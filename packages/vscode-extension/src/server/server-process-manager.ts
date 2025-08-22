//src/server/server-process-manager.ts
import { spawn, execFile } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import {
  logError,
  logInfo,
  logServerInfo,
  logServerError,
  showServerLogger,
} from '../utils/logger';
import { SERVER_PID_FILE } from './constants';

export class ServerProcessManager {
  private readonly pidFile: string;

  constructor(
    private readonly installDir: string,
    private readonly launcherPath: string
  ) {
    this.pidFile = path.join(this.installDir, SERVER_PID_FILE);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /** Checks if process is alive (signal 0). */
  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  private async waitForExit(pid: number, timeoutMs = 5000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      if (!this.isProcessAlive(pid)) return;
      await this.sleep(50);
    }
  }

  /** Reads stored PID (if any). */
  private async getPid(): Promise<number | null> {
    if (!existsSync(this.pidFile)) return null;
    try {
      const pidString = await fs.readFile(this.pidFile, 'utf-8');
      const pid = parseInt(pidString, 10);
      return Number.isFinite(pid) ? pid : null;
    } catch (err) {
      logError('[ServerProcessManager] Failed to read PID:', err);
      return null;
    }
  }

  /** Cleans up stale PID file if process already exited. */
  private async cleanupStalePidFile() {
    const pid = await this.getPid();
    if (!pid) return;
    if (!this.isProcessAlive(pid)) {
      await fs.unlink(this.pidFile).catch(() => {});
    }
  }

  async start(): Promise<boolean> {
    logInfo('[ServerProcessManager] Attempting to start server...');

    // 안전망: 이전 비정상 종료 등으로 남은 PID 파일 정리
    await this.cleanupStalePidFile();

    const pid = await this.getPid();

    // 1) already running
    if (pid && this.isProcessAlive(pid)) {
      logInfo(`[ServerProcessManager] Already running (PID: ${pid}).`);
      return false; // not spawned
    }

    // 2) launcher presence
    if (!existsSync(this.launcherPath)) {
      const msg = `Launcher not found: ${this.launcherPath}`;
      logError(`[ServerProcessManager] ${msg}`);
      throw new Error(msg);
    }

    // 3) make executable on Unix
    if (process.platform !== 'win32') {
      try {
        await fs.chmod(this.launcherPath, 0o755);
      } catch (e) {
        logError('[ServerProcessManager] Failed to chmod launcher:', e);
      }
    }

    // 4) spawn
    logInfo(
      `[ServerProcessManager] Starting launcher: ${this.launcherPath} (cwd: ${this.installDir})`
    );

    const child = spawn(this.launcherPath, [], {
      cwd: this.installDir,
      shell: process.platform === 'win32', // needed for .cmd
      stdio: 'pipe', // capture stdout/stderr
      windowsHide: true, // suppress console window on Windows
      detached: false, // keep attached so pipes stay open
    });

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');

    child.stdout?.on('data', (buf) => {
      const text = buf.toString();
      for (const line of text.split(/\r?\n/)) {
        if (line) logServerInfo(line);
      }
    });
    child.stderr?.on('data', (buf) => {
      const text = buf.toString();
      for (const line of text.split(/\r?\n/)) {
        if (line) logServerError(line);
      }
    });

    child.on('error', (err) => {
      logError('[ServerProcessManager] Spawn error:', err);
    });

    child.on('close', (code, signal) => {
      const msg = `[ServerProcessManager] Server process exited (code=${code}, signal=${String(
        signal
      )}).`;
      logInfo(msg);
      logServerInfo(`Server exited (code=${code}, signal=${String(signal)}).`);
    });

    child.on('spawn', () => {
      logServerInfo('Server spawned.');
      showServerLogger();
    });

    if (!child.pid) {
      const msg = 'Failed to spawn server process (no PID).';
      logError(`[ServerProcessManager] ${msg}`);
      throw new Error(msg);
    }

    await fs.writeFile(this.pidFile, String(child.pid), 'utf-8');
    child.unref?.();
    logInfo(
      `[ServerProcessManager] Started (PID: ${child.pid}). PID saved at ${this.pidFile}`
    );

    return true; // spawned
  }

  /**
   * Stops the running server process.
   * Now waits until the process is actually terminated.
   */
  async stop(): Promise<void> {
    logInfo('[ServerProcessManager] Attempting to stop server...');
    const pid = await this.getPid();

    if (!pid) {
      logInfo('[ServerProcessManager] No PID found. Nothing to stop.');
      return;
    }

    try {
      if (process.platform === 'win32') {
        // 트리 종료 + 완료까지 대기
        await new Promise<void>((resolve) => {
          execFile('taskkill', ['/pid', String(pid), '/t', '/f'], () => resolve());
        });
      } else {
        // 부드럽게 종료 시도
        try {
          process.kill(pid, 'SIGTERM');
        } catch {}
        await this.waitForExit(pid, 3000);

        // 아직 살아있으면 강제 종료
        if (this.isProcessAlive(pid)) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch {}
          await this.waitForExit(pid, 2000);
        }
      }

      await fs.unlink(this.pidFile).catch(() => {});
      logInfo('[ServerProcessManager] Stopped and PID file removed.');
    } catch (err) {
      logError(`[ServerProcessManager] Failed to stop PID ${pid}:`, err);
      throw err;
    }
  }
}
