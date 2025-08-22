// src/server/server-lifecycle-manager.ts
import { ServerProcessManager } from './server-process-manager';
import { logError, logInfo } from '../utils/logger';
import { ServerUpdater } from './server-updater';

export class ServerLifecycleManager {
  private readonly updater = new ServerUpdater();
  private processManager: ServerProcessManager | null = null;
  private ownsProcess = false;

  async ensureServerRunning(): Promise<void> {
    try {
      const result = await this.updater.checkForUpdates(true);
      const { success, installDir, binaryPath } = result;

      if (!success || !installDir || !binaryPath) {
        const reason = !success
          ? 'Server install/update failed'
          : !installDir
          ? 'Missing installDir from updater'
          : 'Missing launcher (binaryPath) from updater';
        logError(`[ServerLifecycleManager] ${reason}`);
        throw new Error(`[ServerLifecycleManager] ${reason}`);
      }

      this.processManager ??= new ServerProcessManager(installDir, binaryPath);

      const spawned = await this.processManager.start();
      this.ownsProcess = spawned;
      logInfo(
        `[ServerLifecycleManager] ${
          spawned ? 'Server Started' : 'Server Already Running'
        }`
      );
    } catch (err) {
      logError('[ServerLifecycleManager] Server start failed:', err);
      throw err;
    }
  }

  async terminateServer(): Promise<void> {
    if (!this.ownsProcess) {
      logInfo('[ServerLifecycleManager] Not owner; skip termination');
      return;
    }
    const pm = this.processManager;
    if (!pm) {
      logInfo('[ServerLifecycleManager] No process manager; nothing to terminate');
      return;
    }

    logInfo('[ServerLifecycleManager] Terminating server...');
    try {
      await pm.stop(); // stop()은 종료 확정까지 대기
      logInfo('[ServerLifecycleManager] Termination done');
    } catch (err) {
      logError('[ServerLifecycleManager] Termination failed:', err);
      throw err;
    } finally {
      this.processManager = null; // 동작 동일하게 유지
    }
  }
}
