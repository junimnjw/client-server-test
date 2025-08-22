// src/constants.ts
export const SERVER_PID_FILE = 'server.pid';
export const SERVER_RUN_CMD = 'run.cmd';
export const SERVER_RUN_SH = 'run.sh';
export const TIZEN_SERVER_INSTALL_DIR = '.tizen-extension-platform';
export const TIZEN_SERVER_RUNTIME_DIR = 'server';
export const BASE_DOWNLOAD_URL = 'http://10.113.138.168/srib-packages/tizen-extension';

export const PLATFORM_MAP: Record<string, string> = {
  win32: 'win',
  linux: 'linux',
  darwin: 'darwin',
};

export const ZIP_FILE_PREFIX = 'tizen-extension-server-';
export const ZIP_FILE_SUFFIX = '.zip';
