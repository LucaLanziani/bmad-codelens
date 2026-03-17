import * as vscode from 'vscode';

export interface StoryAction {
  label: string;
  commandPrefix: string;
  behavior: 'clipboard' | 'chat';
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

export function getDefaultActions(): StoryAction[] {
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

  if (action.behavior === 'chat') {
    const opened = await openChatWithQuery(text);
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

async function openChatWithQuery(query: string): Promise<boolean> {
  const chatCommands = [
    'workbench.action.chat.open',
    'workbench.action.chat.newChat',
  ];

  for (const cmd of chatCommands) {
    try {
      await vscode.commands.executeCommand(cmd, { query });
      return true;
    } catch {
      // command not available, try next
    }
  }
  return false;
}
