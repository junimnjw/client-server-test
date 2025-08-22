import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import extract from 'extract-zip';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

import type { ServerVersion } from './types';
import { logError, logInfo, logWarn } from '../utils/logger';
import {
  SERVER_RUN_CMD,
  SERVER_RUN_SH,
  TIZEN_SERVER_INSTALL_DIR,
  TIZEN_SERVER_RUNTIME_DIR,
} from './constants';

// Constants for better maintainability
const DOWNLOAD_TIMEOUT_MS = 30000;
const BACKUP_SUFFIX = '.backup';
const TEMP_DIR_PREFIX = 'tizen-ext-';
const SERVER_ZIP_NAME = 'server.zip';
const DEFAULT_VERSION = '0.0.0';
const LAUNCHER_PERMISSIONS = 0o755;

export class ServerManager {
  private readonly serverInstallPath: string;
  private readonly serverInfoPath: string;
  private readonly logPath: string;
  private readonly isWindows: boolean;

  // Cache for command availability checks
  private readonly commandCache = new Map<'curl' | 'wget', boolean | null>();

  constructor() {
    // Install under user's home: ~/.tizen-extension-server
    this.serverInstallPath = path.join(
      os.homedir(),
      TIZEN_SERVER_INSTALL_DIR,
      TIZEN_SERVER_RUNTIME_DIR
    );
    this.serverInfoPath = path.join(this.serverInstallPath, 'server-info.json');
    this.logPath = path.join(this.serverInstallPath, 'logs');
    this.isWindows = process.platform === 'win32';
  }

  /** Returns the server installation root directory. */
  getInstallDir(): string {
    return this.serverInstallPath;
  }

  /** Platform-specific launcher path (run.cmd on Windows, run.sh on Unix). */
  getLauncherPath(): string {
    return path.join(
      this.serverInstallPath,
      this.isWindows ? SERVER_RUN_CMD : SERVER_RUN_SH
    );
  }

  /** Returns the currently installed server version (from server-info.json). */
  getCurrentVersion(): string {
    try {
      if (fs.existsSync(this.serverInfoPath)) {
        const info = JSON.parse(fs.readFileSync(this.serverInfoPath, 'utf8'));
        return info.version;
      }
      return DEFAULT_VERSION;
    } catch (error) {
      logError('Failed to get current version:', error);
      return DEFAULT_VERSION;
    }
  }

  /** Checks whether the server is installed (by presence of install dir and server-info.json). */
  isServerInstalled(): boolean {
    return fs.existsSync(this.serverInstallPath) && fs.existsSync(this.serverInfoPath);
  }

  /** Installs the server (download + extract the archive into install dir). */
  async installServer(version: ServerVersion): Promise<boolean> {
    try {
      logInfo(`Installing server version ${version.version} from repository...`);
      const success = await this.downloadAndExtractServer(version);

      if (success) {
        await this.updateServerInfoWithInstallDate(version);
        await this.logAction('install', version.version, 'success');
        logInfo(`Server version ${version.version} installed successfully`);
        return true;
      }

      await this.logAction('install', version.version, 'failed');
      return false;
    } catch (error) {
      logError('Failed to install server:', error);
      await this.logAction('install', version.version, 'error', error);
      return false;
    }
  }

  /** Updates the server with backup/restore protection. */
  async updateServer(version: ServerVersion): Promise<boolean> {
    try {
      const currentVersion = this.getCurrentVersion();
      logInfo(`Updating server from ${currentVersion} to ${version.version}...`);

      if (this.isServerInstalled()) {
        await this.backupServer();
      }

      const success = await this.installServer(version);
      if (success) {
        await this.removeBackup();
        await this.logAction(
          'update',
          `${currentVersion} → ${version.version}`,
          'success'
        );
        return true;
      }
    } catch (error) {
      logError('Failed to update server:', error);
      const currentVersion = this.getCurrentVersion();
      await this.logAction(
        'update',
        `${currentVersion} → ${version.version}`,
        'error',
        error
      );
      await this.restoreFromBackup();
    }
    return false;
  }

  /** Check if command exists with caching for better performance */
  private async existsCmd(cmd: 'curl' | 'wget'): Promise<boolean> {
    // Return cached result if available
    if (this.commandCache.has(cmd)) {
      return this.commandCache.get(cmd)!;
    }

    const exists = await this.checkCommandAvailability(cmd);
    this.commandCache.set(cmd, exists);
    return exists;
  }

  /** Check if a command is available on the system */
  private async checkCommandAvailability(cmd: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const proc = spawn(cmd, ['--version']);
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    });
  }

  /** Download using curl with optimized error handling */
  private async downloadWithCurl(url: string, destPath: string): Promise<void> {
    const args = [
      '-L',
      '--fail',
      '--show-error',
      '--retry',
      '3',
      '--output',
      destPath,
      url,
    ];

    await this.executeDownloadCommand('curl', args);
  }

  /** Download using wget with optimized error handling */
  private async downloadWithWget(url: string, destPath: string): Promise<void> {
    const args = ['--tries=3', '--timeout=30', '-O', destPath, url];

    await this.executeDownloadCommand('wget', args);
  }

  /** Execute download command with unified error handling */
  private async executeDownloadCommand(
    cmd: string,
    args: string[]
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let errorOutput = '';

      proc.stderr.on('data', (data) => (errorOutput += data.toString()));
      proc.on('error', reject);
      proc.on('close', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`${cmd} exit ${code}: ${errorOutput.trim()}`))
      );
    });
  }

  /** Stream download via http/https to a local file path using Node.js built-in fetch first, then fallback to curl/wget. */
  private async httpDownload(url: string, destPath: string): Promise<void> {
    try {
      this.ensureTargetDirectory(destPath);

      // Try Node.js built-in fetch first (Node.js 18+)
      if (await this.tryNodeFetchDownload(url, destPath)) {
        return;
      }

      // Fallback to system tools (curl/wget)
      if (await this.trySystemToolDownload(url, destPath)) {
        return;
      }

      throw new Error('Download failed: No available download method succeeded');
    } catch (error) {
      logError('Download failed:', error);
      throw error;
    }
  }

  /** Ensure target directory exists */
  private ensureTargetDirectory(filePath: string): void {
    const targetDir = path.dirname(filePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  /** Try Node.js fetch download */
  private async tryNodeFetchDownload(url: string, destPath: string): Promise<boolean> {
    try {
      await this.downloadWithNodeFetch(url, destPath);
      return true;
    } catch {
      logWarn('Node.js fetch download failed, falling back to system tools');
      return false;
    }
  }

  /** Try system tool download (curl/wget) */
  private async trySystemToolDownload(url: string, destPath: string): Promise<boolean> {
    // Try curl first
    if (await this.existsCmd('curl')) {
      try {
        await this.downloadWithCurl(url, destPath);
        return true;
      } catch {
        logWarn('curl download failed, trying wget');
      }
    }

    // Try wget as fallback
    if (await this.existsCmd('wget')) {
      try {
        await this.downloadWithWget(url, destPath);
        return true;
      } catch {
        logWarn('wget download failed');
      }
    }

    return false;
  }

  /** Download using Node.js built-in fetch API with proxy support and proper error handling. */
  private async downloadWithNodeFetch(url: string, destPath: string): Promise<void> {
    try {
      const fetchOptions = this.buildFetchOptions();
      const proxyUrl = this.getProxyUrl();

      if (proxyUrl) {
        logInfo(`Using proxy: ${proxyUrl}`);
      }

      logInfo(`Downloading with Node.js fetch: ${url}`);
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logContentLength(response);
      await this.streamResponseToFile(response, destPath);

      logInfo(`Download completed successfully to: ${destPath}`);
    } catch (error) {
      await this.cleanupPartialDownload(destPath);
      throw this.enhanceFetchError(error, url);
    }
  }

  /** Build fetch options with timeout and headers */
  private buildFetchOptions(): RequestInit {
    return {
      method: 'GET',
      headers: {
        'User-Agent': 'Tizen-Extension-Server/1.0',
      },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    };
  }

  /** Get proxy URL from environment variables */
  private getProxyUrl(): string | undefined {
    return (
      process.env.HTTP_PROXY ||
      process.env.HTTPS_PROXY ||
      process.env.http_proxy ||
      process.env.https_proxy
    );
  }

  /** Log content length if available */
  private logContentLength(response: Response): void {
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      logInfo(`Content length: ${contentLength} bytes`);
    }
  }

  /** Stream response body to file */
  private async streamResponseToFile(
    response: Response,
    destPath: string
  ): Promise<void> {
    const { Readable } = require('stream');
    const responseBody: NodeJS.ReadableStream | null = response.body
      ? Readable.fromWeb(response.body as ReadableStream<Uint8Array>)
      : null;

    if (!responseBody) {
      throw new Error('Response body is null or undefined');
    }

    await pipeline(responseBody, createWriteStream(destPath));
  }

  /** Enhance fetch error with context */
  private enhanceFetchError(error: unknown, url: string): Error {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return new Error(
          `Download timeout after ${DOWNLOAD_TIMEOUT_MS / 1000} seconds: ${url}`
        );
      }
      if (error.name === 'AbortError') {
        return new Error(`Download was aborted: ${url}`);
      }
      return new Error(`Node.js fetch download failed: ${error.message}`);
    }
    return new Error(`Unknown download error: ${String(error)}`);
  }

  /** Clean up partial download file */
  private async cleanupPartialDownload(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      logError('Failed to cleanup partial download file:', cleanupError);
    }
  }

  /** Resolve a download URL to a local zip path (file:// or downloaded temp file). */
  private async resolveToLocalZip(downloadUrl: string): Promise<string | null> {
    if (downloadUrl.startsWith('file://')) {
      return fileURLToPath(downloadUrl);
    }

    if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
      const zipPath = path.join(tmpDir, SERVER_ZIP_NAME);
      await this.httpDownload(downloadUrl, zipPath);
      return zipPath;
    }

    return null;
  }

  /** Download (http/https/file) and extract server artifact into install dir. */
  private async downloadAndExtractServer(version: ServerVersion): Promise<boolean> {
    try {
      const url = version.downloadUrl;
      logInfo(`Downloading server from: ${url}`);

      this.ensureTargetDirectory(this.serverInstallPath);

      // Resolve source zip
      const localZipPath = await this.resolveToLocalZip(url);
      if (!localZipPath || !fs.existsSync(localZipPath)) {
        logError(`Source zip not available: ${url}, ${localZipPath}`);
        return false;
      }

      // Extract
      await extract(localZipPath, { dir: this.serverInstallPath });

      // Fix permissions on Unix
      if (!this.isWindows) {
        await this.fixUnixPermissions();
      }

      // Cleanup temporary files
      await this.cleanupTempFiles(localZipPath);

      return true;
    } catch (error) {
      logError('Failed to download and extract server:', error);
      return false;
    }
  }

  /** Fix Unix permissions for launcher and runtime */
  private async fixUnixPermissions(): Promise<void> {
    try {
      const launcher = this.getLauncherPath();
      if (fs.existsSync(launcher)) {
        fs.chmodSync(launcher, LAUNCHER_PERMISSIONS);
      }

      const runtimeNode = path.join(this.serverInstallPath, 'runtime', 'node');
      if (fs.existsSync(runtimeNode)) {
        fs.chmodSync(runtimeNode, LAUNCHER_PERMISSIONS);
      }
    } catch (error) {
      logError('Failed to chmod launcher/runtime', error);
    }
  }

  /** Clean up temporary files */
  private async cleanupTempFiles(zipPath: string): Promise<void> {
    try {
      const tmpDir = path.dirname(zipPath);
      if (tmpDir.startsWith(os.tmpdir()) && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      logError('Failed to cleanup temp dir', cleanupError);
    }
  }

  /** Update server-info.json with actual install date */
  private async updateServerInfoWithInstallDate(version: ServerVersion): Promise<void> {
    try {
      const serverInfo = this.buildServerInfo(version);

      if (fs.existsSync(this.serverInfoPath)) {
        const existingInfo = JSON.parse(fs.readFileSync(this.serverInfoPath, 'utf8'));
        const updatedInfo = {
          ...existingInfo,
          installDate: new Date().toISOString(),
        };
        fs.writeFileSync(this.serverInfoPath, JSON.stringify(updatedInfo, null, 2));
        logInfo('Updated server-info.json with install date');
      } else {
        fs.writeFileSync(this.serverInfoPath, JSON.stringify(serverInfo, null, 2));
        logInfo('Created server-info.json with install date');
      }
    } catch (error) {
      logError('Failed to update server-info.json with install date:', error);
    }
  }

  /** Build server info object */
  private buildServerInfo(version: ServerVersion) {
    return {
      version: version.version,
      installDate: new Date().toISOString(),
      downloadUrl: version.downloadUrl,
      checksum: version.checksum,
      releaseDate: version.releaseDate,
      source: 'client-install',
    };
  }

  /** Creates a backup copy of the current installation. */
  private async backupServer(): Promise<void> {
    const backupPath = this.serverInstallPath + BACKUP_SUFFIX;
    if (fs.existsSync(this.serverInstallPath)) {
      fs.cpSync(this.serverInstallPath, backupPath, { recursive: true });
    }
  }

  /** Removes the backup directory, if present. */
  private async removeBackup(): Promise<void> {
    const backupPath = this.serverInstallPath + BACKUP_SUFFIX;
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
  }

  /** Restores from backup on failure. */
  private async restoreFromBackup(): Promise<void> {
    const backupPath = this.serverInstallPath + BACKUP_SUFFIX;
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(this.serverInstallPath)) {
        fs.rmSync(this.serverInstallPath, { recursive: true, force: true });
      }
      fs.cpSync(backupPath, this.serverInstallPath, { recursive: true });
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
  }

  /** Appends an action entry to the server action log. */
  private async logAction(
    action: string,
    version: string,
    status: 'success' | 'failed' | 'error',
    error?: unknown
  ): Promise<void> {
    try {
      if (!fs.existsSync(this.logPath)) {
        fs.mkdirSync(this.logPath, { recursive: true });
      }

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logPath, `server-actions-${today}.log`);

      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        version,
        status,
        error: this.formatErrorForLog(error),
      };

      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      logError('Failed to log action:', error);
    }
  }

  /** Format error for logging */
  private formatErrorForLog(error?: unknown): string | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
