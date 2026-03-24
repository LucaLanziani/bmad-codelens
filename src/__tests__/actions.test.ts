import { beforeEach, describe, expect, it, vi } from 'vitest';

const { writeText, showInformationMessage, executeCommand } = vi.hoisted(() => ({
  writeText: vi.fn(),
  showInformationMessage: vi.fn(),
  executeCommand: vi.fn(),
}));

vi.mock('vscode', () => ({
  env: {
    clipboard: {
      writeText,
    },
  },
  window: {
    showInformationMessage,
    createTerminal: vi.fn(),
  },
  commands: {
    executeCommand,
  },
  workspace: {
    getConfiguration: vi.fn(),
  },
}));

import { executeAction, type StoryAction, type StoryRef } from '../actions';

describe('executeAction', () => {
  const story: StoryRef = {
    id: '1.2',
    title: 'Feature B',
    fullText: '### Story 1.2: Feature B\n\nStory body',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    writeText.mockResolvedValue(undefined);
    showInformationMessage.mockReturnValue(undefined);
    executeCommand.mockResolvedValue(undefined);
  });

  it('copies full story text for clipboard actions without a command prefix', async () => {
    const action: StoryAction = {
      label: 'Copy Story',
      commandPrefix: '',
      behavior: 'clipboard',
    };

    await executeAction(action, story);

    expect(writeText).toHaveBeenCalledWith(story.fullText);
    expect(showInformationMessage).toHaveBeenCalledWith('Story text copied to clipboard');
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('opens chat with a partial query for chat behavior', async () => {
    const action: StoryAction = {
      label: 'Create Story',
      commandPrefix: '/bmad-bmm-create-story',
      behavior: 'chat',
    };

    await executeAction(action, story);

    expect(executeCommand).toHaveBeenCalledWith('workbench.action.chat.open', {
      query: '/bmad-bmm-create-story 1.2',
      isPartialQuery: true,
    });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('opens chat and submits immediately for chat-submit behavior', async () => {
    const action: StoryAction = {
      label: 'Create Story',
      commandPrefix: '/bmad-bmm-create-story',
      behavior: 'chat-submit',
    };

    await executeAction(action, story);

    expect(executeCommand).toHaveBeenCalledWith('workbench.action.chat.open', {
      query: '/bmad-bmm-create-story 1.2',
      isPartialQuery: false,
    });
  });

  it('starts a new chat before opening for new-chat-submit behavior', async () => {
    const action: StoryAction = {
      label: 'Code Review',
      commandPrefix: '/bmad-bmm-code-review',
      behavior: 'new-chat-submit',
    };

    await executeAction(action, story);

    expect(executeCommand.mock.calls).toEqual([
      ['workbench.action.chat.newChat'],
      ['workbench.action.chat.open', {
        query: '/bmad-bmm-code-review 1.2',
        isPartialQuery: false,
      }],
    ]);
  });

  it('falls back to copying the command when chat opening fails', async () => {
    const action: StoryAction = {
      label: 'Create Story',
      commandPrefix: '/bmad-bmm-create-story',
      behavior: 'chat',
    };

    executeCommand.mockImplementation(async (command: string) => {
      if (command === 'workbench.action.chat.open') {
        throw new Error('chat unavailable');
      }
    });

    await executeAction(action, story);

    expect(writeText).toHaveBeenCalledWith('/bmad-bmm-create-story 1.2');
    expect(showInformationMessage).toHaveBeenCalledWith(
      'Could not open chat; command copied to clipboard instead',
    );
  });

  it('falls back to copying story text if chat opening fails for a plain-text action', async () => {
    const action: StoryAction = {
      label: 'Story In Chat',
      commandPrefix: '',
      behavior: 'chat',
    };

    executeCommand.mockRejectedValue(new Error('chat unavailable'));

    await executeAction(action, story);

    expect(writeText).toHaveBeenCalledWith(story.fullText);
    expect(showInformationMessage).toHaveBeenCalledWith(
      'Could not open chat; story text copied to clipboard instead',
    );
  });
});