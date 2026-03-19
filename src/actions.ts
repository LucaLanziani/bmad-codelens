import * as vscode from 'vscode';

export interface StoryAction {
  label: string;
  commandPrefix: string;
  behavior: 'clipboard' | 'chat' | 'chat-submit';
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
    .get<StoryAction>('devStoryAction', { label: 'Dev Story', commandPrefix: '/bmad-bmm-dev-story', behavior: 'chat' });
}

export function getCodeReviewAction(): StoryAction {
  return vscode.workspace
    .getConfiguration('bmadCodelens')
    .get<StoryAction>('codeReviewAction', { label: 'Code Review', commandPrefix: '/bmad-bmm-code-review', behavior: 'chat' });
}

function getDefaultActions(): StoryAction[] {
  return [
    { label: 'Create Story', commandPrefix: '/bmad-bmm-create-story', behavior: 'chat' },
    { label: 'Copy Story', commandPrefix: '', behavior: 'clipboard' },
  ];
}

export async function executeAction(
  action: StoryAction,
  story: StoryRef,
): Promise<void> {
  const text = action.commandPrefix
    ? `${action.commandPrefix} ${story.id}`
    : story.fullText;

  if (action.behavior === 'chat' || action.behavior === 'chat-submit') {
    const opened = await openChatWithQuery(text, action.behavior === 'chat-submit');
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

async function openChatWithQuery(query: string, submit = false): Promise<boolean> {
  const chatCommands = [
    'workbench.action.chat.open',
    'workbench.action.chat.newChat',
  ];

  for (const cmd of chatCommands) {
    try {
      await vscode.commands.executeCommand(cmd, { query, isPartialQuery: !submit });
      return true;
    } catch {
      // command not available, try next
    }
  }
  return false;
}
