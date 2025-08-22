import * as vscode from 'vscode';
import { registerViews } from './views/view-setup';
import { ServerLifecycleManager } from './server/server-lifecycle-manager';
import { ServerHealthManager } from './server/server-health-manager';
import { ServerSupervisor } from './server/server-supervisor';
import { checkForUpdate, installUpdate } from './utils/api/update-api';
import { initLogger, logError, logInfo } from './utils/logger';
import { isTizenWorkspace } from './utils/common-util';
import { globSync } from 'glob';
import { dirname, relative, resolve } from 'path';
import {
  getWorkingProject,
  setWorkingProject,
} from './project-operations/working-project';

// CHANGED: Define common messages as constants for better consistency and maintainability
const MESSAGES = {
  EXTENSION_ACTIVATED: '[tizen-extension] Activated',
  SERVER_CONNECTING_PROGRESS: 'Connecting to local server...',
  SERVER_CONNECT_SUCCESS: '✅ Connected to local server ({0} mode)',
  SERVER_CONNECT_FAILURE: 'Could not connect to local server. Make sure it is running.',
  UPDATE_AVAILABLE_PROMPT: 'A Tizen SDK update is available',
  UPDATE_PROMPT_UPDATE_BUTTON: 'Update',
  UPDATE_PROMPT_NO_BUTTON: 'No',
  UPDATE_PROGRESS_TITLE: '⏳ Updating Tizen SDK ...',
  DEACTIVATING_SERVER: '[tizen-extension] Deactivating and stopping server...',
};

let supervisor: ServerSupervisor | undefined;

export async function activate(context: vscode.ExtensionContext) {
  initLogger(context);

  logInfo(MESSAGES.EXTENSION_ACTIVATED);
  registerViews(context); //show ui at first
  logInfo(`registerViews executed.`);

  //set context and workspace
  await initializeExtensionConfig();
  logInfo(`initializeExtensionConfig executed.`);

  supervisor = new ServerSupervisor(
    new ServerLifecycleManager(),
    new ServerHealthManager()
  );
  context.subscriptions.push(supervisor);

  const sup = supervisor;

  const isServerReady = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: MESSAGES.SERVER_CONNECTING_PROGRESS,
      cancellable: false,
    },
    () => sup.startIfNeeded()
  );

  if (!isServerReady) {
    vscode.window.showErrorMessage(MESSAGES.SERVER_CONNECT_FAILURE);
    return;
  }

  logInfo(`Server and SDK initialization completed successfully`);
  
  // Check for updates after successful initialization
  await checkForUpdateAndPrompt();
}

export async function deactivate() {
  await supervisor?.disposeAsync();
  supervisor = undefined;
}

export async function checkForUpdateAndPrompt(): Promise<void> {
  try {
    const updateStatus = await checkForUpdate();
    if (!updateStatus.updateAvailable) return;

    const shouldUpdate = await vscode.window.showInformationMessage(
      MESSAGES.UPDATE_AVAILABLE_PROMPT,
      MESSAGES.UPDATE_PROMPT_UPDATE_BUTTON,
      MESSAGES.UPDATE_PROMPT_NO_BUTTON
    );

    if (shouldUpdate !== MESSAGES.UPDATE_PROMPT_UPDATE_BUTTON) return; // CHANGED: Use constant for comparison

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: MESSAGES.UPDATE_PROGRESS_TITLE,
        cancellable: false,
      },
      async () => {
        const result = await installUpdate();
        if (result.status === 'success') {
          vscode.window.showInformationMessage(`✅ ${result.message}`);
        } else {
          vscode.window.showErrorMessage(`❌ ${result.message}`);
        }
      }
    );
  } catch (error) {
    logError('Update check failed:', error);
  }
}

async function initializeExtensionConfig() {
  if (await isTizenWorkspace()) {
    vscode.commands.executeCommand('setContext', 'tizen.isTizenWorkspace', true);
    const contextMenuSupportedProjects: string[] = [];
    const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const projResults = globSync(
      workspacePath.replace(/\\/g, '/') + '/**/@(tizen-manifest.xml|config.xml|*.sln)'
    );
    for (const result of projResults) {
      const relPath = relative(workspacePath, resolve(result));
      if (relPath.match(/Debug/i) || relPath.match(/Release/i)) continue;
      let currPath = dirname(result);
      if (process.platform === 'win32') {
        currPath = currPath[0].toLowerCase() + currPath.slice(1);
      }
      contextMenuSupportedProjects.push(currPath);
    }
    vscode.commands.executeCommand(
      'setContext',
      'tizen.buildSupportedFolders',
      contextMenuSupportedProjects
    );

    const workingProject = getWorkingProject();
    const currentOpenWorkspace = vscode.workspace.workspaceFolders![0].uri.fsPath;
    if (workingProject !== null && !workingProject.startsWith(currentOpenWorkspace)) {
      setWorkingProject();
    }
  }
}
