import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const FIXTURES_DIR = resolve(__dirname, 'fixtures/implementation-artifacts');

/** Build a fake vscode.Uri that points to a real fixture file. */
function fixtureUri(filename: string) {
  const fullPath = resolve(FIXTURES_DIR, filename);
  return { path: fullPath, fsPath: fullPath };
}

// ---------------------------------------------------------------------------
// Mock vscode and ./actions BEFORE importing status-resolver.
// vscode.workspace.fs.readFile delegates to Node's real fs so fixture files
// are read from disk — no inline content in tests.
// ---------------------------------------------------------------------------
vi.mock('vscode', () => ({
  workspace: {
    findFiles: vi.fn(),
    fs: {
      readFile: vi.fn((uri: { fsPath: string }) => readFile(uri.fsPath)),
    },
  },
  Uri: {
    file: (p: string) => ({ path: p, fsPath: p }),
  },
}));

vi.mock('../actions', () => ({
  getOutputFolder: vi.fn(() => '_bmad-output'),
}));

import * as vscode from 'vscode';
import { statusLabel, resolveStatuses } from '../status-resolver';

// ---------------------------------------------------------------------------
// statusLabel
// ---------------------------------------------------------------------------
describe('statusLabel', () => {
  it('returns correct label for ready-for-dev', () => {
    expect(statusLabel('ready-for-dev')).toBe('🔵 ready-for-dev');
  });

  it('returns correct label for review', () => {
    expect(statusLabel('review')).toBe('🟡 review');
  });

  it('returns correct label for done', () => {
    expect(statusLabel('done')).toBe('🟢 done');
  });
});

// ---------------------------------------------------------------------------
// resolveStatuses
// ---------------------------------------------------------------------------
describe('resolveStatuses', () => {
  const mockFindFiles = vscode.workspace.findFiles as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for every id when no implementation files exist', async () => {
    mockFindFiles.mockResolvedValue([]);

    const result = await resolveStatuses(['1.1', '2.3']);
    expect(result.get('1.1')).toBeNull();
    expect(result.get('2.3')).toBeNull();
  });

  it('resolves "done" status from fixture file', async () => {
    const uri = fixtureUri('1-1-my-feature.md');
    mockFindFiles.mockResolvedValue([uri]);

    const result = await resolveStatuses(['1.1']);
    const resolved = result.get('1.1');

    expect(resolved).not.toBeNull();
    expect(resolved!.status).toBe('done');
    expect(resolved!.fileUri).toBe(uri);
  });

  it('normalises "review" alias to "review"', async () => {
    const uri = fixtureUri('2-1-review-alias.md');
    mockFindFiles.mockResolvedValue([uri]);

    const result = await resolveStatuses(['2.1']);
    expect(result.get('2.1')!.status).toBe('review');
  });

  it('normalises mixed-case "Done" to "done"', async () => {
    const uri = fixtureUri('3-1-done-mixed-case.md');
    mockFindFiles.mockResolvedValue([uri]);

    const result = await resolveStatuses(['3.1']);
    expect(result.get('3.1')!.status).toBe('done');
  });

  it('defaults to "ready-for-dev" when fixture has no Status line', async () => {
    const uri = fixtureUri('4-1-no-status.md');
    mockFindFiles.mockResolvedValue([uri]);

    const result = await resolveStatuses(['4.1']);
    expect(result.get('4.1')!.status).toBe('ready-for-dev');
  });

  it('returns null when the file does not exist on disk', async () => {
    const nonExistentPath = resolve(FIXTURES_DIR, 'does-not-exist-5-1.md');
    const uri = { path: nonExistentPath, fsPath: nonExistentPath };
    mockFindFiles.mockResolvedValue([uri]);

    const result = await resolveStatuses(['5.1']);
    expect(result.get('5.1')).toBeNull();
  });

  it('resolves multiple stories to their respective fixture files', async () => {
    const uri11 = fixtureUri('1-1-my-feature.md');
    const uri12 = fixtureUri('1-2-feature-b.md');
    mockFindFiles.mockResolvedValue([uri11, uri12]);

    const result = await resolveStatuses(['1.1', '1.2']);
    expect(result.get('1.1')!.fileUri).toBe(uri11);
    expect(result.get('1.1')!.status).toBe('done');
    expect(result.get('1.2')!.fileUri).toBe(uri12);
    expect(result.get('1.2')!.status).toBe('review');
  });
});
