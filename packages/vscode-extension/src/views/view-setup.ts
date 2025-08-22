import * as vscode from 'vscode';

const COMMAND_NAME = {
  CREATE_PROJECT_MANAGER: 'tizen-create-project-manager-v2',
  CERTIFICATE_MANAGER: 'tizen-certificate-manager-v2',
  DEVICE_MANAGER: 'tizen-device-manager-v2',
  BUILD_PROJECT_MANAGER: 'tizen-build-project-manager-v2',
  RUN_PROJECT_MANAGER: 'tizen-run-project-manager-v2',
  PACKAGE_MANAGER: 'tizen-package-manager-v2',
  EMULATOR_MANAGER: 'tizen-emulator-manager-v2',
  WELCOME_PAGE: 'tizen-welcome-page-v2',
  SET_WORKING_PROJECT: 'tizen-set-working-project-v2',
  DEVICE_VIEW: 'tizen-view-device-v2',
};

class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly path?: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.command = command;
  }
}

class ToolsTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> =
    new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class WebviewViewProvider implements vscode.WebviewViewProvider {
  private welcomeProvider: any;
  private webviewView?: vscode.WebviewView;
  private visibilityChangeListeners: (() => void)[] = [];

  constructor(private context: vscode.ExtensionContext) {
    // TODO: Initialize welcome provider
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;
    // TODO: Implement webview view resolution
  }

  isVisible(): boolean {
    return this.webviewView?.visible ?? false;
  }

  onDidBecomeVisible(listener: () => void): void {
    this.visibilityChangeListeners.push(listener);
  }
}

export function registerViews(context: vscode.ExtensionContext) {
  // TODO: Implement view registration
  const webviewViewProvider = new WebviewViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'tizen.views.tools.v2',
      new ToolsTreeDataProvider()
    ),
    vscode.commands.registerCommand(COMMAND_NAME.CREATE_PROJECT_MANAGER, () => {
      // TODO: Implement create project command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.CERTIFICATE_MANAGER, () => {
      // TODO: Implement certificate manager command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.DEVICE_MANAGER, () => {
      // TODO: Implement device manager command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.EMULATOR_MANAGER, () => {
      // TODO: Implement emulator manager command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.BUILD_PROJECT_MANAGER, async () => {
      // TODO: Implement build project command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.RUN_PROJECT_MANAGER, async () => {
      // TODO: Implement run project command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.PACKAGE_MANAGER, () => {
      // TODO: Implement package manager command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.WELCOME_PAGE, () => {
      // TODO: Implement welcome page command
    }),
    vscode.commands.registerCommand(COMMAND_NAME.SET_WORKING_PROJECT, (projectPath) => {
      // TODO: Implement set working project command
    })
  );

  setupActivityBarFocusDetection(webviewViewProvider);
}

function setupActivityBarFocusDetection(webviewViewProvider: WebviewViewProvider) {
  // TODO: Implement activity bar focus detection
}
