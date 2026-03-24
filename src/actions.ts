import * as vscode from 'vscode';

export interface StoryAction {
  label: string;
  commandPrefix: string;
  behavior: 'clipboard' | 'chat' | 'chat-submit' | 'new-chat' | 'new-chat-submit';
}

export interface StoryRef {
  id: string;
  title: string;
  fullText: string;
}

export function getConfiguredActions(): StoryAction[] {
  const config = vscode.workspace.getConfiguration('bmadCodelens');
  return config.get<StoryAction[]>('actions', getDefaultActions());
}

export function getOutputFolder(): string {
  return vscode.workspace
    .getConfiguration('bmadCodelens')
    .get<string>('outputFolder', '_bmad-output');
}

export function getDevStoryAction(): StoryAction {
  return vscode.workspace
    .getConfiguration('bmadCodelens')
    .get<StoryAction>('devStoryAction', { label: 'Dev Story', commandPrefix: '/bmad-bmm-dev-story', behavior: 'new-chat' });
}

export function getCodeReviewAction(): StoryAction {
  return vscode.workspace
    .getConfiguration('bmadCodelens')
    .get<StoryAction>('codeReviewAction', { label: 'Code Review', commandPrefix: '/bmad-bmm-code-review', behavior: 'new-chat' });
}

function getDefaultActions(): StoryAction[] {
  return [
    { label: 'Create Story', commandPrefix: '/bmad-bmm-create-story', behavior: 'new-chat' },
    { label: 'Copy Story', commandPrefix: '', behavior: 'clipboard' },
  ];
}

export function installBmad(): void {
  const terminal = vscode.window.createTerminal({ name: 'BMad Install' });
  terminal.show();
  terminal.sendText('npx bmad-method install');
}

export async function executeAction(
  action: StoryAction,
  story: StoryRef,
): Promise<void> {
  const text = action.commandPrefix
    ? `${action.commandPrefix} ${story.id}`
    : story.fullText;

  if (isChatBehavior(action.behavior)) {
    const createNew = action.behavior === 'new-chat' || action.behavior === 'new-chat-submit';
    const submit = action.behavior === 'chat-submit' || action.behavior === 'new-chat-submit';
    const opened = await openChatWithQuery(text, submit, createNew);
    if (!opened) {
      await vscode.env.clipboard.writeText(text);
      vscode.window.showInformationMessage(
        'Could not open chat — command copied to clipboard instead',
      );
    }
    return;
  }

  await vscode.env.clipboard.writeText(text);
  vscode.window.showInformationMessage(
    'Story text copied to clipboard',
  );
}

function isChatBehavior(behavior: StoryAction['behavior']): boolean {
  return behavior === 'chat' || behavior === 'chat-submit' ||
    behavior === 'new-chat' || behavior === 'new-chat-submit';
}

async function openChatWithQuery(query: string, submit = false, createNew = false): Promise<boolean> {
  if (createNew) {
    try {
      await vscode.commands.executeCommand('workbench.action.chat.newChat');
    } catch {
      // newChat not available, fall through to open directly
    }
  }

  try {
    await vscode.commands.executeCommand('workbench.action.chat.open', { query, isPartialQuery: !submit });
    return true;
  } catch {
    return false;
  }
}
