// src/utils/logger.ts
import * as vscode from 'vscode';

let extLogger: vscode.OutputChannel | undefined;
let svrLogger: vscode.OutputChannel | undefined;
let currentMode: vscode.ExtensionMode = vscode.ExtensionMode.Production;

export function initLogger(context: vscode.ExtensionContext) {
  extLogger = vscode.window.createOutputChannel('Tizen Extension Log');
  svrLogger = vscode.window.createOutputChannel('Tizen Server Log');
  currentMode = context.extensionMode;
}

export function logInfo(message: string) {
  if (currentMode === vscode.ExtensionMode.Development) {
    console.log(`ℹ️ ${message}`);
  }
  extLogger?.appendLine(`ℹ️ ${message}`);
}

export function logWarn(message: string) {
  if (currentMode === vscode.ExtensionMode.Development) {
    console.warn(`⚠️ ${message}`);
  }
  extLogger?.appendLine(`⚠️ ${message}`);
}

export function logError(message: string, error?: unknown) {
  if (currentMode === vscode.ExtensionMode.Development) {
    console.error(`❌ ${message}`, error);
  }
  extLogger?.appendLine(`❌ ${message}`);
  if (error instanceof Error) {
    extLogger?.appendLine(error.stack ?? error.message);
  } else if (typeof error === 'string') {
    extLogger?.appendLine(error);
  }
}

export function showExtLogger() {
  extLogger?.show();
}

// for server
export function logServerInfo(line: string) {
  svrLogger?.appendLine(`[SVR] ℹ️ ${line}`);
}

export function logServerError(line: string) {
  svrLogger?.appendLine(`[SVR-ERR] ❌ ${line}`);
}

export function showServerLogger() {
  svrLogger?.show();
}
