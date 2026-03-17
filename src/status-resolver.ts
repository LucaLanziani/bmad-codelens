import * as vscode from 'vscode';

export type StoryStatus = 'ready-for-dev' | 'review' | 'done';

const STATUS_RE = /^Status:\s*(.+)$/im;

const STATUS_ICONS: Record<StoryStatus, string> = {
  'ready-for-dev': '🔵',
  'review': '🟡',
  'done': '🟢',
};

function normalizeStatus(raw: string): StoryStatus {
  const s = raw.trim().toLowerCase();
  if (s === 'done') {
    return 'done';
  }
  if (s === 'review' || s === 'code-review' || s === 'in-review') {
    return 'review';
  }
  return 'ready-for-dev';
}

function storyIdToFilePrefix(id: string): string {
  return id.replace('.', '-') + '-';
}

/**
 * Look up the status for a list of story IDs by finding their
 * matching implementation artifact files in the workspace.
 * Returns null for stories with no implementation file.
 */
export async function resolveStatuses(
  storyIds: string[],
): Promise<Map<string, StoryStatus | null>> {
  const result = new Map<string, StoryStatus | null>();

  const files = await vscode.workspace.findFiles(
    '**/implementation-artifacts/*.md',
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
      result.set(id, match ? normalizeStatus(match[1]) : 'ready-for-dev');
    } catch {
      result.set(id, null);
    }
  }

  return result;
}

export function statusLabel(status: StoryStatus): string {
  return `${STATUS_ICONS[status]} ${status}`;
}
