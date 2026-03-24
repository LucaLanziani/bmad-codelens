import * as vscode from 'vscode';

export interface StoryAction {
  label: string;
  commandPrefix: string;
  behavior: 'clipboard' | 'chat' | 'chat-submit' | 'new-chat' | 'new-chat-submit';
}

interface ChatOpenOptions {
  newChat: boolean;
  submit: boolean;
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

export function installBmad(): void {
  const terminal = vscode.window.createTerminal({ name: 'BMad Install' });
  terminal.show();
  terminal.sendText('npx bmad-method install');
}

export async function executeAction(
  action: StoryAction,
  story: StoryRef,
): Promise<void> {
  const text = buildActionText(action, story);

  switch (action.behavior) {
    case 'clipboard':
      await copyActionText(text, copiedToClipboardMessage(action));
      return;
    case 'chat':
    case 'chat-submit':
    case 'new-chat':
    case 'new-chat-submit': {
      const opened = await openChatWithQuery(text, getChatOpenOptions(action.behavior));
      if (!opened) {
        await copyActionText(text, chatOpenFailedMessage(action));
      }
      return;
    }
  }
}

function buildActionText(action: StoryAction, story: StoryRef): string {
  return action.commandPrefix
    ? `${action.commandPrefix} ${story.id}`
    : story.fullText;
}

function getChatOpenOptions(behavior: Exclude<StoryAction['behavior'], 'clipboard'>): ChatOpenOptions {
  switch (behavior) {
    case 'chat':
      return { newChat: false, submit: false };
    case 'chat-submit':
      return { newChat: false, submit: true };
    case 'new-chat':
      return { newChat: true, submit: false };
    case 'new-chat-submit':
      return { newChat: true, submit: true };
  }
}

function copiedToClipboardMessage(action: StoryAction): string {
  return action.commandPrefix
    ? 'Command copied to clipboard'
    : 'Story text copied to clipboard';
}

function chatOpenFailedMessage(action: StoryAction): string {
  return action.commandPrefix
    ? 'Could not open chat; command copied to clipboard instead'
    : 'Could not open chat; story text copied to clipboard instead';
}

async function copyActionText(text: string, message: string): Promise<void> {
  await vscode.env.clipboard.writeText(text);
  vscode.window.showInformationMessage(message);
}

async function openChatWithQuery(query: string, options: ChatOpenOptions): Promise<boolean> {
  if (options.newChat) {
    try {
      await vscode.commands.executeCommand('workbench.action.chat.newChat');
    } catch {
      // newChat not available, fall through to open directly
    }
  }

  try {
    await vscode.commands.executeCommand('workbench.action.chat.open', {
      query,
      isPartialQuery: !options.submit,
    });
    return true;
  } catch {
    return false;
  }
}
