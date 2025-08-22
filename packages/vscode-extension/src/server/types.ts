//src/server/types.ts
export interface ServerVersion {
  version: string;
  downloadUrl: string;
  checksum: string;
  releaseDate: string;
}

export interface UpdateResult {
  success: boolean;
  updated: boolean;
  newVersion?: string;
  requiresReload: boolean;
  error?: string;
  installDir?: string;
  binaryPath?: string;
}

export interface LatestZip {
  version: string;
  fileName: string;
}
