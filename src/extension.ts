import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
  EpicCodeLensProvider,
  StoryFileCodeLensProvider,
} from './story-codelens-provider';
import { installBmad } from './actions';

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('bmadCodelens');
  const outputFolder = config.get<string>('outputFolder', '_bmad-output');
  const bmadFolder = config.get<string>('bmadFolder', '_bmad');

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const pattern = workspaceFolder
    ? new vscode.RelativePattern(workspaceFolder, `${outputFolder}/**/*.md`)
    : `**/${outputFolder}/**/*.md`;

  const selector: vscode.DocumentSelector = { language: 'markdown', scheme: 'file', pattern };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(selector, new EpicCodeLensProvider()),
    vscode.languages.registerCodeLensProvider(selector, new StoryFileCodeLensProvider()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bmadCodelens.installBmad', () => installBmad()),
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBarItem.text = '$(cloud-download) Install BMad';
  statusBarItem.tooltip = 'Run npx bmad-method install';
  statusBarItem.command = 'bmadCodelens.installBmad';

  const bmadFolderPath = workspaceFolder
    ? path.join(workspaceFolder.uri.fsPath, bmadFolder)
    : null;

  function updateStatusBarVisibility(): void {
    const isInstalled = bmadFolderPath ? fs.existsSync(bmadFolderPath) : false;
    if (isInstalled) {
      statusBarItem.hide();
    } else {
      statusBarItem.show();
    }
  }

  updateStatusBarVisibility();
  context.subscriptions.push(statusBarItem);

  if (bmadFolderPath) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder!, `${bmadFolder}/`),
    );
    watcher.onDidCreate(() => updateStatusBarVisibility());
    watcher.onDidDelete(() => updateStatusBarVisibility());
    context.subscriptions.push(watcher);
  }
}

export function deactivate(): void {
  // nothing to clean up
}
