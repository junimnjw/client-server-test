//src/server/server-supervisor.ts
import { ServerLifecycleManager } from './server-lifecycle-manager';
import { ServerHealthManager, ServerStatus } from './server-health-manager';
import * as vscode from 'vscode';
import { delay } from '../utils/delay';
import { logInfo, logError } from '../utils/logger';
import { sdkInit } from '../utils/api/sdk-init-api';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEFAULT_RETRIES = 10;
const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_HEALTH_TIMEOUT_MS = 3000;
const PORT_FILE = path.join(os.homedir(), '.tizen-extension-server', 'port.txt');

export class ServerSupervisor implements vscode.Disposable {
  private disposed = false;
  private startInFlight: Promise<boolean> | null = null;

  constructor(
    private readonly lifecycleManager: ServerLifecycleManager,
    private readonly healthManager: ServerHealthManager
  ) {}

  private getHealthUrl(): string {
    try {
      if (fs.existsSync(PORT_FILE)) {
        const port = fs.readFileSync(PORT_FILE, 'utf-8').trim();
        return `http://127.0.0.1:${port}/health`;
      }
    } catch (error) {
      logError('[ServerSupervisor] Failed to read port file:', error);
    }
    // Fallback to default port
    return 'http://127.0.0.1:12345/health';
  }

  async disposeAsync(): Promise<void> {
    try {
      await this.startInFlight?.catch(() => {});
      
      // Skip if debug mode
      if (process.env.SKIP_SERVER_INSTALL === '1') {
        logInfo('[ServerSupervisor] Debug mode: skip terminating server.');
        return;
      }
      
      await this.lifecycleManager.terminateServer();
      logInfo('[ServerSupervisor] Server disposed');
    } catch (error) {
      logError('[ServerSupervisor] Error during disposal:', error);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
  }

  async startIfNeeded(
    retries = DEFAULT_RETRIES,
    intervalMs = DEFAULT_INTERVAL_MS
  ): Promise<boolean> {
    if (this.disposed) return false;

    if (!this.startInFlight) {
      this.startInFlight = this.performStartup(retries, intervalMs);
    }

    try {
      return await this.startInFlight;
    } catch (error) {
      // 에러 발생 시 startInFlight 초기화하여 재시도 가능하게 함
      this.startInFlight = null;
      throw error;
    }
  }

  async stopIfOwned(): Promise<void> {
    try {
      await this.lifecycleManager.terminateServer();
    } catch (error) {
      logError('[ServerSupervisor] Error stopping server:', error);
    }
  }

  private async performStartup(
    retries: number,
    intervalMs: number
  ): Promise<boolean> {
    try {
      // Step 1: Start server and wait for health check
      await this.lifecycleManager.ensureServerRunning();
      
      const isHealthy = await this.waitUntilServerIsHealthy(retries, intervalMs);
      if (!isHealthy) {
        this.healthManager.setFailure(
          'Health check failed',
          ServerStatus.Disconnected
        );
        return false;
      }
      
      this.healthManager.setHealthy();
      
      // Step 2: Initialize SDK after server is healthy
      return await this.initializeSDK();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.healthManager.setFailure(errorMessage, ServerStatus.FailedToStart);
      logError('[ServerSupervisor] Startup failed:', error);
      return false;
    }
  }

  private async initializeSDK(): Promise<boolean> {
    try {
      logInfo('[ServerSupervisor] Server is healthy, starting SDK initialization...');
      
      const sdkResult = await sdkInit();
      
      if (sdkResult.status) {
        logInfo('[ServerSupervisor] SDK initialization completed successfully');
        return true;
      } else {
        logInfo('[ServerSupervisor] SDK initialization failed');
        return false;
      }
      
    } catch (error) {
      logError('[ServerSupervisor] SDK initialization error:', error);
      return false;
    }
  }

  private async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_HEALTH_TIMEOUT_MS);
      
      try {
        const response = await fetch(this.getHealthUrl(), { 
          signal: controller.signal 
        });
        return response.ok;
      } finally {
        clearTimeout(timeoutId);
      }
      
    } catch {
      return false;
    }
  }

  private async waitUntilServerIsHealthy(
    retries: number,
    intervalMs: number
  ): Promise<boolean> {
    for (let attempt = 0; attempt < retries; attempt++) {
      if (this.disposed) return false;
      
      if (await this.checkHealth()) return true;
      
      // Don't delay on the last attempt
      if (attempt < retries - 1) {
        await delay(intervalMs);
      }
    }
    
    return false;
  }
}
