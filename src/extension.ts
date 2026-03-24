import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
  EpicCodeLensProvider,
  StoryFileCodeLensProvider,
} from './story-codelens-provider';
import { installBmad, getOutputFolder } from './actions';

const STATUS_RE = /^Status:\s*(.+)$/im;

async function getStoryCounts(): Promise<{ done: number; inProgress: number; total: number }> {
  const files = await vscode.workspace.findFiles(
    `${getOutputFolder()}/implementation-artifacts/*.md`,
    '**/node_modules/**',
  );

  let done = 0;
  let inProgress = 0;

  for (const uri of files) {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(content).toString('utf-8');
      const match = STATUS_RE.exec(text);
      const status = match ? match[1].trim().toLowerCase() : 'unknown';
      if (status === 'done') {
        done++;
      } else if (status === 'ready-for-dev' || status === 'review') {
        inProgress++;
      }
    } catch {
      // skip unreadable files
    }
  }

  return { done, inProgress, total: files.length };
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
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

  const bmadFolderPath = workspaceFolder
    ? path.join(workspaceFolder.uri.fsPath, bmadFolder)
    : null;

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBarItem.text = '$(cloud-download) Install BMad';
  statusBarItem.tooltip = 'Run npx bmad-method install';
  statusBarItem.command = 'bmadCodelens.installBmad';

  const progressBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  progressBarItem.tooltip = new vscode.MarkdownString(
    '**BMad Story Progress**\n\n' +
    '`done / in-progress / total`\n\n' +
    '- **done**: stories with status `done`\n' +
    '- **in-progress**: stories with status `ready-for-dev` or `review`\n' +
    '- **total**: all implementation artifact files',
  );

  async function updateProgressBar(): Promise<void> {
    const { done, inProgress, total } = await getStoryCounts();
    progressBarItem.text = `$(checklist) ${done}/${inProgress}/${total}`;
  }

  async function updateStatusBarVisibility(): Promise<void> {
    const isInstalled = bmadFolderPath ? fs.existsSync(bmadFolderPath) : false;
    if (isInstalled) {
      statusBarItem.hide();
      await updateProgressBar();
      progressBarItem.show();
    } else {
      progressBarItem.hide();
      statusBarItem.show();
    }
  }

  await updateStatusBarVisibility();
  context.subscriptions.push(statusBarItem, progressBarItem);

  if (bmadFolderPath) {
    // Watch for the directory itself being created/deleted
    const dirWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder!, bmadFolder),
    );
    dirWatcher.onDidCreate(() => updateStatusBarVisibility());
    dirWatcher.onDidDelete(() => updateStatusBarVisibility());
    context.subscriptions.push(dirWatcher);

    // Watch for files inside the directory (e.g. after npx bmad-method install)
    const contentsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder!, `${bmadFolder}/**`),
    );
    contentsWatcher.onDidCreate(() => updateStatusBarVisibility());
    contentsWatcher.onDidDelete(() => updateStatusBarVisibility());
    context.subscriptions.push(contentsWatcher);
  }

  // Refresh progress counts when implementation artifact files change
  const artifactWatcher = vscode.workspace.createFileSystemWatcher(
    workspaceFolder
      ? new vscode.RelativePattern(workspaceFolder, `${outputFolder}/implementation-artifacts/*.md`)
      : `**/${outputFolder}/implementation-artifacts/*.md`,
  );
  const refreshProgress = (): void => { void updateProgressBar(); };
  artifactWatcher.onDidCreate(refreshProgress);
  artifactWatcher.onDidChange(refreshProgress);
  artifactWatcher.onDidDelete(refreshProgress);
  context.subscriptions.push(artifactWatcher);
}

export function deactivate(): void {
  // nothing to clean up
}
