interface ParsedStory {
  /** e.g. "2.2" */
  id: string;
  /** e.g. "User Search & Nomination Submission" */
  title: string;
  /** Full markdown body from the header line through the end of the story section */
  fullText: string;
  /** 0-based line number of the `### Story` header */
  lineNumber: number;
}

interface ParsedStoryFile {
  /** e.g. "1.1" */
  id: string;
  /** e.g. "Monorepo & Development Environment Setup" */
  title: string;
  /** e.g. "done", "draft", "in-progress" */
  status: string;
  /** 0-based line number of the `# Story` header */
  lineNumber: number;
}

const STORY_HEADER_RE = /^###\s+Story\s+(\d+\.\d+):\s+(.+)$/;
const SECTION_BOUNDARY_RE = /^#{2,3}\s/;

const STORY_FILE_HEADER_RE = /^#\s+Story\s+(\d+\.\d+):\s+(.+)$/;
const STATUS_RE = /^Status:\s*(.+)$/i;

/** Parse inline stories from epic files (### Story X.Y: Title) */
export function parseStories(documentText: string): ParsedStory[] {
  const lines = documentText.split('\n');
  const stories: ParsedStory[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = STORY_HEADER_RE.exec(lines[i]);
    if (!match) {
      continue;
    }

    const id = match[1];
    const title = match[2];
    const startLine = i;

    let endLine = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (SECTION_BOUNDARY_RE.test(lines[j])) {
        endLine = j;
        break;
      }
    }

    const fullText = lines.slice(startLine, endLine).join('\n').trimEnd();

    stories.push({ id, title, fullText, lineNumber: startLine });
  }

  return stories;
}

/** Parse a standalone story implementation file (# Story X.Y: Title + Status: ...) */
export function parseStoryFile(documentText: string): ParsedStoryFile | null {
  const lines = documentText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const headerMatch = STORY_FILE_HEADER_RE.exec(lines[i]);
    if (!headerMatch) {
      continue;
    }

    let status = 'draft';
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const statusMatch = STATUS_RE.exec(lines[j]);
      if (statusMatch) {
        status = statusMatch[1].trim().toLowerCase();
        break;
      }
    }

    return {
      id: headerMatch[1],
      title: headerMatch[2],
      status,
      lineNumber: i,
    };
  }

  return null;
}
