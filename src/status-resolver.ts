import * as vscode from 'vscode';
import { getOutputFolder } from './actions';

export type StoryStatus = 'ready-for-dev' | 'review' | 'done';

const STATUS_RE = /^Status:\s*(.+)$/im;

const STATUS_ICONS: Record<StoryStatus, string> = {
  'ready-for-dev': '🔵',
  'review': '🟡',
  'done': '🟢',
};

function storyIdToFilePrefix(id: string): string {
  return id.replace('.', '-') + '-';
}

export interface ResolvedStatus {
  status: StoryStatus;
  fileUri: vscode.Uri;
}

/**
 * Look up the status for a list of story IDs by finding their
 * matching implementation artifact files in the workspace.
 * Returns null for stories with no implementation file.
 */
export async function resolveStatuses(
  storyIds: string[],
): Promise<Map<string, ResolvedStatus | null>> {
  const result = new Map<string, ResolvedStatus | null>();

  const files = await vscode.workspace.findFiles(
    `${getOutputFolder()}/implementation-artifacts/*.md`,
    '**/node_modules/**',
  );

  const filesByPrefix = new Map<string, vscode.Uri>();
  for (const uri of files) {
    const filename = uri.path.split('/').pop() ?? '';
    filesByPrefix.set(filename, uri);
  }

  for (const id of storyIds) {
    const prefix = storyIdToFilePrefix(id);
    let matchedUri: vscode.Uri | undefined;

    for (const [filename, uri] of filesByPrefix) {
      if (filename.startsWith(prefix)) {
        matchedUri = uri;
        break;
      }
    }

    if (!matchedUri) {
      result.set(id, null);
      continue;
    }

    try {
      const content = await vscode.workspace.fs.readFile(matchedUri);
      const text = Buffer.from(content).toString('utf-8');
      const match = STATUS_RE.exec(text);
      const s = match ? match[1].trim().toLowerCase() : '';
      const status: StoryStatus = (s === 'done' || s === 'review') ? s : 'ready-for-dev';
      result.set(id, { status, fileUri: matchedUri });
    } catch {
      result.set(id, null);
    }
  }

  return result;
}

export function statusLabel(status: StoryStatus): string {
  return `${STATUS_ICONS[status]} ${status}`;
}
