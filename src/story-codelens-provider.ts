import * as vscode from 'vscode';
import { parseStories, parseStoryFile } from './story-parser';
import { getConfiguredActions, getOutputFolder, StoryAction, StoryRef } from './actions';
import { resolveStatuses, statusLabel } from './status-resolver';

export interface CodeLensActionArgs {
  action: StoryAction;
  story: StoryRef;
}

/**
 * CodeLens for epic files — shows configurable action buttons above each
 * ### Story header. Hides "Create Story" when an implementation file exists.
 */
export class EpicCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  private readonly _disposables: vscode.Disposable[] = [];

  constructor() {
    const fire = () => this._onDidChangeCodeLenses.fire();

    this._disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('bmadCodelens')) {
          fire();
        }
      }),
    );

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const watchGlob = workspaceFolder
      ? new vscode.RelativePattern(workspaceFolder, `${getOutputFolder()}/implementation-artifacts/*.md`)
      : `**/${getOutputFolder()}/implementation-artifacts/*.md`;
    const watcher = vscode.workspace.createFileSystemWatcher(watchGlob);
    watcher.onDidChange(fire, undefined, this._disposables);
    watcher.onDidCreate(fire, undefined, this._disposables);
    watcher.onDidDelete(fire, undefined, this._disposables);
    this._disposables.push(watcher);
  }

  dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
    this._onDidChangeCodeLenses.dispose();
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CodeLens[]> {
    const enabled = vscode.workspace
      .getConfiguration('bmadCodelens')
      .get<boolean>('enabled', true);

    if (!enabled) {
      return [];
    }

    const stories = parseStories(document.getText());
    const actions = getConfiguredActions();

    const resolved = await resolveStatuses(stories.map((s) => s.id));
    const lenses: vscode.CodeLens[] = [];

    for (const story of stories) {
      const range = new vscode.Range(story.lineNumber, 0, story.lineNumber, 0);
      const entry = resolved.get(story.id) ?? null;
      const hasImplementation = entry !== null;

      if (hasImplementation) {
        lenses.push(
          new vscode.CodeLens(range, {
            title: statusLabel(entry.status),
            command: '',
            tooltip: `Story ${story.id} status: ${entry.status}`,
          }),
        );

        if (entry.status !== 'done') {
          lenses.push(
            new vscode.CodeLens(range, {
              title: '$(go-to-file) Go to Story',
              command: 'vscode.open',
              arguments: [entry.fileUri],
              tooltip: `Open story implementation file`,
            }),
          );
        }
      }

      for (const action of actions) {
        if (action.commandPrefix === '/bmad-bmm-create-story' && hasImplementation) {
          continue;
        }

        const args: CodeLensActionArgs = { action, story };

        lenses.push(
          new vscode.CodeLens(range, {
            title: action.label,
            command: 'bmadCodelens.executeAction',
            arguments: [args],
            tooltip: action.commandPrefix
              ? `Run ${action.commandPrefix} with this story`
              : 'Copy full story text to clipboard',
          }),
        );
      }
    }

    return lenses;
  }
}

/**
 * CodeLens for story implementation files — shows status-dependent actions
 * above the # Story header.
 *   - ready-for-dev → /bmad-bmm-dev-story
 *   - review → /bmad-bmm-code-review
 *   - done → no action
 */
export class StoryFileCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.CodeLens[] {
    const enabled = vscode.workspace
      .getConfiguration('bmadCodelens')
      .get<boolean>('enabled', true);

    if (!enabled) {
      return [];
    }

    const storyFile = parseStoryFile(document.getText());
    if (!storyFile || storyFile.status === 'done' || storyFile.status === 'draft') {
      return [];
    }

    const range = new vscode.Range(storyFile.lineNumber, 0, storyFile.lineNumber, 0);
    const isReview = storyFile.status === 'review';

    const action: StoryAction = isReview
      ? { label: 'Code Review', commandPrefix: '/bmad-bmm-code-review', behavior: 'chat' }
      : { label: 'Dev Story', commandPrefix: '/bmad-bmm-dev-story', behavior: 'chat' };

    const story = { id: storyFile.id, title: storyFile.title, fullText: '' };
    const args: CodeLensActionArgs = { action, story };

    return [
      new vscode.CodeLens(range, {
        title: `$(${isReview ? 'eye' : 'play'}) ${action.label}`,
        command: 'bmadCodelens.executeAction',
        arguments: [args],
        tooltip: `Run ${action.commandPrefix} for Story ${storyFile.id}`,
      }),
    ];
  }
}
