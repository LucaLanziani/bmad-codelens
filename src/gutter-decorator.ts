import * as vscode from 'vscode';
import * as path from 'path';
import { parseStories } from './story-parser';
import { resolveStatuses, StoryStatus } from './status-resolver';

const decorationTypes = new Map<StoryStatus, vscode.TextEditorDecorationType>();

function getDecorationType(
  status: StoryStatus,
  extensionPath: string,
): vscode.TextEditorDecorationType {
  let type = decorationTypes.get(status);
  if (!type) {
    type = vscode.window.createTextEditorDecorationType({
      gutterIconPath: path.join(extensionPath, 'icons', `${status}.svg`),
      gutterIconSize: 'contain',
    });
    decorationTypes.set(status, type);
  }
  return type;
}

async function updateDecorations(
  editor: vscode.TextEditor,
  extensionPath: string,
): Promise<void> {
  if (editor.document.languageId !== 'markdown') {
    return;
  }

  const stories = parseStories(editor.document.getText());
  if (stories.length === 0) {
    clearDecorations(editor, extensionPath);
    return;
  }

  const statuses = await resolveStatuses(stories.map((s) => s.id));

  const rangesByStatus = new Map<StoryStatus, vscode.Range[]>();
  for (const status of ['ready-for-dev', 'review', 'done'] as StoryStatus[]) {
    rangesByStatus.set(status, []);
  }

  for (const story of stories) {
    const entry = statuses.get(story.id);
    if (!entry) {
      continue;
    }
    const line = editor.document.lineAt(story.lineNumber);
    rangesByStatus.get(entry.status)!.push(line.range);
  }

  for (const [status, ranges] of rangesByStatus) {
    editor.setDecorations(getDecorationType(status, extensionPath), ranges);
  }
}

function clearDecorations(
  editor: vscode.TextEditor,
  extensionPath: string,
): void {
  for (const status of ['ready-for-dev', 'review', 'done'] as StoryStatus[]) {
    editor.setDecorations(getDecorationType(status, extensionPath), []);
  }
}

export function registerGutterDecorator(context: vscode.ExtensionContext): void {
  const extPath = context.extensionPath;

  const refresh = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      updateDecorations(editor, extPath);
    }
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateDecorations(editor, extPath);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && e.document === editor.document) {
        updateDecorations(editor, extPath);
      }
    }),
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/implementation-artifacts/*.md',
  );
  context.subscriptions.push(
    watcher,
    watcher.onDidChange(refresh),
    watcher.onDidCreate(refresh),
    watcher.onDidDelete(refresh),
  );

  refresh();
}
