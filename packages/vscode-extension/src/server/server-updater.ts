// src/server/server-update.ts
import { ServerManager } from './server-version-manager';
import { ServerVersion, UpdateResult } from './types';
import * as semver from 'semver';
import { logError, logInfo } from '../utils/logger';
import { BASE_DOWNLOAD_URL } from './constants';
import { fetchLatestForCurrentPlatform, joinUrl } from './server-listing';

export class ServerUpdater {
  private serverManager: ServerManager;

  constructor() {
    this.serverManager = new ServerManager();
  }
  /**
   * Check for updates and optionally auto-install/update.
   */

  async checkForUpdates(autoUpdate: boolean = false): Promise<UpdateResult> {
    try {
      // 1) Find the latest release from remote listing
      const remoteVersion = await this.getLatestRelease();
      if (!remoteVersion) {
        return {
          success: false,
          updated: false,
          error: `No releases found at ${BASE_DOWNLOAD_URL}`,
          requiresReload: false,
        };
      }

      // 2) Inspect current installation state

      const currentVersion = this.serverManager.getCurrentVersion();
      const isInstalled = this.serverManager.isServerInstalled();
      const installDir = this.serverManager.getInstallDir();
      const binaryPath = this.serverManager.getLauncherPath();

      logInfo(
        `[ServerUpdater] Current: ${currentVersion} (${
          isInstalled ? 'installed' : 'not installed'
        })`
      );
      logInfo(`[ServerUpdater] Latest Release: ${remoteVersion.version}`);

      // 3) Branch by installation state

      if (!isInstalled) {
        // Not installed → install if autoUpdate is true
        logInfo(
          `[ServerUpdater] No server installed. Latest available is v${remoteVersion.version}`
        );
        if (autoUpdate) {
          logInfo(
            `[ServerUpdater] Installing server version ${remoteVersion.version}...`
          );
          const installSuccess = await this.serverManager.installServer(remoteVersion);
          return {
            success: installSuccess,
            updated: installSuccess,
            newVersion: remoteVersion.version,
            requiresReload: installSuccess,
            installDir: installSuccess ? installDir : undefined,
            binaryPath: installSuccess ? binaryPath : undefined,
          };
        } else {
          return {
            success: true,
            updated: false,
            newVersion: remoteVersion.version,
            requiresReload: false,
            installDir,
            binaryPath,
          };
        }
      } else {
        // Enhanced version comparison for pre-release versions
        const needUpdate = this.isVersionNewer(remoteVersion.version, currentVersion);
        if (!needUpdate) {
          logInfo(`[ServerUpdater] Server is up to date (v${currentVersion}).`);
          return {
            success: true,
            updated: false,
            requiresReload: false,
            installDir,
            binaryPath,
          };
        }

        if (autoUpdate) {
          logInfo(
            `[ServerUpdater] Updating server from ${currentVersion} to ${remoteVersion.version}...`
          );
          const updateSuccess = await this.serverManager.updateServer(remoteVersion);
          return {
            success: updateSuccess,
            updated: updateSuccess,
            newVersion: remoteVersion.version,
            requiresReload: updateSuccess,
            installDir: updateSuccess ? installDir : undefined,
            binaryPath: updateSuccess ? binaryPath : undefined,
          };
        } else {
          logInfo(
            `[ServerUpdater] New version available: v${remoteVersion.version} (current v${currentVersion}). Auto-update is disabled; skipping install.`
          );
          return {
            success: true,
            updated: false,
            newVersion: remoteVersion.version,
            requiresReload: false,
            installDir,
            binaryPath,
          };
        }
      }
    } catch (error) {
      logError('[ServerUpdater] Update check failed:', error);
      return {
        success: false,
        updated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requiresReload: false,
      };
    }
  }

  // Enhanced version comparison that handles pre-release versions safely.
  private isVersionNewer(remoteVersion: string, currentVersion: string): boolean {
    try {
      logInfo(
        `[ServerUpdater] Version comparison: remote="${remoteVersion}", current="${currentVersion}"`
      );

      // Validate both versions with semver

      const isRemoteValid = semver.valid(remoteVersion);
      const isCurrentValid = semver.valid(currentVersion);

      logInfo(
        `[ServerUpdater] Semver validation: remote=${
          isRemoteValid ? 'valid' : 'invalid'
        }, current=${isCurrentValid ? 'valid' : 'invalid'}`
      );

      if (isRemoteValid && isCurrentValid) {
        const comparison = semver.compare(remoteVersion, currentVersion);
        logInfo(
          `[ServerUpdater] Standard semver comparison: ${remoteVersion} ${
            comparison > 0 ? '>' : comparison < 0 ? '<' : '=='
          } ${currentVersion} (result: ${comparison})`
        );
        return comparison > 0;
      }

      // If current version is not valid semver, consider remote as newer
      if (!isCurrentValid) {
        logInfo(
          `[ServerUpdater] Current version "${currentVersion}" is not valid semver, treating remote as newer`
        );
        return true;
      }

      // If remote version is not valid semver, try to coerce it

      if (!isRemoteValid) {
        const coercedRemote = semver.coerce(remoteVersion);
        if (coercedRemote) {
          logInfo(
            `[ServerUpdater] Coerced remote version "${remoteVersion}" to "${coercedRemote.version}"`
          );
          const comparison = semver.compare(coercedRemote.version, currentVersion);
          const isNewer = comparison > 0;
          logInfo(
            `[ServerUpdater] Coerced semver comparison: ${coercedRemote.version} ${
              comparison > 0 ? '>' : comparison < 0 ? '<' : '=='
            } ${currentVersion} (result: ${comparison})`
          );
          return isNewer;
        }
      }

      // If all else fails, do string comparison as fallback

      logInfo(`[ServerUpdater] Falling back to string comparison for versions`);
      const stringComparison = remoteVersion > currentVersion;
      logInfo(
        `[ServerUpdater] String comparison result: ${remoteVersion} ${
          stringComparison ? '>' : '<='
        } ${currentVersion}`
      );
      return stringComparison;
    } catch (error) {
      logError('[ServerUpdater] Version comparison failed:', error);
      // In case of error, treat remote as newer to be safe
      return true;
    }
  }

  private async getLatestRelease(): Promise<ServerVersion | null> {
    try {
      const latest = await fetchLatestForCurrentPlatform(BASE_DOWNLOAD_URL);

      logInfo(
        `[ServerUpdater] Found latest (listing): ${latest.fileName} (v${latest.version})`
      );

      return {
        version: latest.version,
        downloadUrl: joinUrl(BASE_DOWNLOAD_URL, latest.fileName),
        checksum: 'remote-not-checked',
        releaseDate: new Date().toISOString(),
      };
    } catch (error) {
      logError(
        `[ServerUpdater] Failed to fetch releases from ${BASE_DOWNLOAD_URL}:`,
        error
      );
    }
    return null; // safe return
  }

  /** Exposes server installation state in a compact form. */

  getServerStatus(): { isInstalled: boolean; currentVersion: string } {
    return {
      isInstalled: this.serverManager.isServerInstalled(),
      currentVersion: this.serverManager.getCurrentVersion(),
    };
  }
}
