//src/server/server-health-manager.ts
export enum ServerStatus {
  Healthy = 'healthy',
  FailedToStart = 'failed-to-start',
  Disconnected = 'disconnected',
}

export class ServerHealthManager {
  private status: ServerStatus = ServerStatus.Healthy;
  private lastError: unknown = null;

  setHealthy() {
    this.status = ServerStatus.Healthy;
    this.lastError = null;
  }

  setFailure(error: unknown, status: ServerStatus = ServerStatus.FailedToStart) {
    this.status = status;
    this.lastError = error;
  }

  getStatus(): ServerStatus {
    return this.status;
  }

  getLastError(): unknown {
    return this.lastError;
  }

  isHealthy(): boolean {
    return this.status === ServerStatus.Healthy;
  }
}
