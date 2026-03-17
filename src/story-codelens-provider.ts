import * as vscode from 'vscode';
import { parseStories, parseStoryFile } from './story-parser';
import { getConfiguredActions, StoryAction, StoryRef } from './actions';
import { resolveStatuses, statusLabel } from './status-resolver';

export interface CodeLensActionArgs {
  action: StoryAction;
  story: StoryRef;
}

/**
 * CodeLens for epic files — shows configurable action buttons above each
 * ### Story header. Hides "Create Story" when an implementation file exists.
 */
export class EpicCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor() {
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('bmadCodelens')) {
        this._onDidChangeCodeLenses.fire();
      }
    });

    const watcher = vscode.workspace.createFileSystemWatcher(
      '**/implementation-artifacts/*.md',
    );
    watcher.onDidChange(() => this._onDidChangeCodeLenses.fire());
    watcher.onDidCreate(() => this._onDidChangeCodeLenses.fire());
    watcher.onDidDelete(() => this._onDidChangeCodeLenses.fire());
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

    const statuses = await resolveStatuses(stories.map((s) => s.id));
    const lenses: vscode.CodeLens[] = [];

    for (const story of stories) {
      const range = new vscode.Range(story.lineNumber, 0, story.lineNumber, 0);
      const status = statuses.get(story.id) ?? null;
      const hasImplementation = status !== null;

      if (hasImplementation) {
        lenses.push(
          new vscode.CodeLens(range, {
            title: statusLabel(status),
            command: '',
            tooltip: `Story ${story.id} status: ${status}`,
          }),
        );
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
 *   - status "done" → /bmad-bmm-code-review
 *   - any other status → /bmad-bmm-dev-story
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
    if (!storyFile) {
      return [];
    }

    const range = new vscode.Range(storyFile.lineNumber, 0, storyFile.lineNumber, 0);
    const action: StoryAction =
      storyFile.status === 'done'
        ? { label: 'Code Review', commandPrefix: '/bmad-bmm-code-review', behavior: 'chat' }
        : { label: 'Dev Story', commandPrefix: '/bmad-bmm-dev-story', behavior: 'chat' };

    const story = { id: storyFile.id, title: storyFile.title, fullText: '' };
    const args: CodeLensActionArgs = { action, story };

    return [
      new vscode.CodeLens(range, {
        title: `$(${storyFile.status === 'done' ? 'check' : 'play'}) ${action.label}`,
        command: 'bmadCodelens.executeAction',
        arguments: [args],
        tooltip: `Run ${action.commandPrefix} for Story ${storyFile.id} (status: ${storyFile.status})`,
      }),
    ];
  }
}
