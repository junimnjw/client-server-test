import * as fs from 'fs';
import * as path from 'path';

import { SdkConstants } from './sdk-constants';
import { FileUtil } from './fileutil';

interface IPathHandler {
  normalizePath(inputPath: string): string;
  joinPath(...segments: string[]): string;
  ensureDirectoryExists(directoryPath: string): void;
}

export class DefaultPathHandler implements IPathHandler {
  normalizePath(inputPath: string): string {
    return path.normalize(inputPath);
  }

  joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  ensureDirectoryExists(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }
}

interface IEnvironmentHandler {
  create(path: string): void;
  set(key: string, value: string): void;
  get(key: string): string | null;
  remove(key: string): void;
}
/*
export class DefaultEnvironmentHandler implements IEnvironmentHandler {
  private storage: Record<string, string> = {};

  set(key: string, value: string): void {
    this.storage[key] = value;
  }

  get(key: string): string | null {
    return this.storage[key] || null;
  }

  remove(key: string): void {
    delete this.storage[key];
  }
}
  */

export class FileBasedEnvironmentHandler implements IEnvironmentHandler {
  private storageFilePath: string = '';

  constructor() {}

  private setStorageFilePath(extensionPath: string) {
    console.log('sdk path: ' + extensionPath);
    const sdkToolsPath = path.join(extensionPath, '..', SdkConstants.SDK_PATH.SDKTOOLS);
    const extractPath = path.join(sdkToolsPath, SdkConstants.SDK_PATH.EXTRACT);
    const dataPath = path.join(extractPath, SdkConstants.SDK_PATH.DATA);
    const sdkInfoFile = path.join(dataPath, SdkConstants.SDK_INFO_FILE.SDK_INFO);
    this.storageFilePath = sdkInfoFile;
    this.ensureStorageFileExists();
  }

  private ensureStorageFileExists(): void {
    if (!fs.existsSync(this.storageFilePath)) {
      fs.writeFileSync(this.storageFilePath, '{}', 'utf-8');
    }
  }

  private readStorageFile(): Record<string, string> {
    if (!this.storageFilePath || !fs.existsSync(this.storageFilePath)) {
      return {};
    }
    const content = fs.readFileSync(this.storageFilePath, 'utf-8');
    if (!content || typeof content !== 'string') {
      return {};
    }
    try {
      return JSON.parse(content.trim());
    } catch (e) {
      console.error(`[SDKPathManager] Failed to parse storage file: ${e}`);
      throw e;
    }
  }

  private writeStorageFile(data: Record<string, string>): void {
    fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  set(key: string, value: string): void {
    const data = this.readStorageFile();
    data[key] = value;
    this.writeStorageFile(data);
  }

  get(key: string): string | null {
    const data = this.readStorageFile();
    return data[key] || null;
  }

  remove(key: string): void {
    const data = this.readStorageFile();
    delete data[key];
    this.writeStorageFile(data);
  }

  create(path: string) {
    this.setStorageFilePath(path);
  }
}

export type OSType = 'Windows' | 'Linux' | 'MacOS' | 'Unknown';

/**
 * SDK Path Manager for managing Tizen SDK paths
 */

export class SDKPathManager {
  private static instance: SDKPathManager;
  private sdkRoot: string = '';
  private sdkToolsPath: string = '';

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   * @returns SDKPathManager instance
   */
  public static getInstance(): SDKPathManager {
    if (!SDKPathManager.instance) {
      SDKPathManager.instance = new SDKPathManager();
    }
    return SDKPathManager.instance;
  }

  /**
   * Set SDK root path
   * @param path SDK root path
   */
  public setSdkRoot(path: string): void {
    this.sdkRoot = path;
    this.sdkToolsPath = `${path}/tools`;
  }

  /**
   * Get SDK root path
   * @returns SDK root path
   */
  public getSdkRoot(): string {
    return this.sdkRoot;
  }

  /**
   * Get Tizen SDK tools path
   * @returns SDK tools path
   */
  public getTizenSdkToolsPath(): string {
    return this.sdkToolsPath;
  }

  /**
   * Initialize SDK paths from environment or default locations
   */
  public initializePaths(): void {
    // TODO: Implement SDK path initialization logic
    // This should check environment variables and default locations
    
    const defaultPath = process.env.TIZEN_STUDIO || 'C:\\tizen-studio';
    this.setSdkRoot(defaultPath);
  }
}
