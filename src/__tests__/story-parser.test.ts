import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseStories, parseStoryFile } from '../story-parser';

const EPICS_FILE = resolve(__dirname, 'fixtures/planning-artifacts/epics.md');
const ARTIFACTS_DIR = resolve(__dirname, 'fixtures/implementation-artifacts');

function readArtifact(filename: string): string {
  return readFileSync(resolve(ARTIFACTS_DIR, filename), 'utf-8');
}

// ---------------------------------------------------------------------------
// parseStories
// ---------------------------------------------------------------------------
describe('parseStories', () => {
  it('returns empty array for empty input', () => {
    expect(parseStories('')).toEqual([]);
  });

  it('returns empty array when no story headers exist', () => {
    expect(parseStories(`# Epic 1: Some Epic

Some description here.

## Overview

Details.`)).toEqual([]);
  });

  it('parses all stories from epics.md', () => {
    const result = parseStories(readFileSync(EPICS_FILE, 'utf-8'));

    expect(result).toHaveLength(7);
    expect(result.map(s => s.id)).toEqual(['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '2.4a']);
  });

  it('captures correct ids and titles', () => {
    const result = parseStories(readFileSync(EPICS_FILE, 'utf-8'));
    const byId = Object.fromEntries(result.map(s => [s.id, s.title]));

    expect(byId['1.1']).toBe('Monorepo & Development Environment Setup');
    expect(byId['1.2']).toBe('Google SSO Authentication & User Provisioning');
    expect(byId['1.3']).toBe('Role-Based Access Control & Manager Routing');
    expect(byId['2.1']).toBe('Recognition Data Model & Public Feed');
    expect(byId['2.2']).toBe('User Search & Nomination Submission');
    expect(byId['2.3']).toBe('Rate Limiting & Nomination Feedback');
  });

  it('records correct 0-based line numbers for each story', () => {
    const result = parseStories(readFileSync(EPICS_FILE, 'utf-8'));
    const byId = Object.fromEntries(result.map(s => [s.id, s.lineNumber]));

    expect(byId['1.1']).toBe(238);
    expect(byId['1.2']).toBe(274);
    expect(byId['1.3']).toBe(309);
    expect(byId['2.1']).toBe(350);
    expect(byId['2.2']).toBe(378);
    expect(byId['2.3']).toBe(407);
  });

  it('stops story body at the next ### section boundary', () => {
    const result = parseStories(readFileSync(EPICS_FILE, 'utf-8'));
    const story11 = result.find(s => s.id === '1.1')!;

    expect(story11.fullText).toContain('### Story 1.1:');
    expect(story11.fullText).not.toContain('Story 1.2');
  });

  it('stops story body at a ## section boundary', () => {
    const result = parseStories(readFileSync(EPICS_FILE, 'utf-8'));
    const story13 = result.find(s => s.id === '1.3')!;

    expect(story13.fullText).toContain('### Story 1.3:');
    expect(story13.fullText).not.toContain('Epic 2');
  });

  it('handles titles with special characters (& in title)', () => {
    const result = parseStories(readFileSync(EPICS_FILE, 'utf-8'));
    const story22 = result.find(s => s.id === '2.2')!;

    expect(story22.title).toBe('User Search & Nomination Submission');
  });

  it('does not match ## Story headers (wrong level)', () => {
    expect(parseStories(`## Story 1.1: Wrong Level

Not matched.`)).toEqual([]);
  });

  it('does not match # Story headers (wrong level)', () => {
    expect(parseStories(`# Story 1.1: Wrong Level

Not matched.`)).toEqual([]);
  });

  it('trims trailing whitespace from fullText', () => {
    const result = parseStories(`### Story 5.1: Trailing\n\nContent.   \n   `);
    expect(result[0].fullText).not.toMatch(/\s+$/);
  });
});

// ---------------------------------------------------------------------------
// parseStoryFile
// ---------------------------------------------------------------------------
describe('parseStoryFile', () => {
  it('returns null for empty input', () => {
    expect(parseStoryFile('')).toBeNull();
  });

  it('returns null when no story file header exists', () => {
    expect(parseStoryFile('## Story 1.1: Wrong Level\n\nNot matched.')).toBeNull();
  });

  it('parses id, title, status and lineNumber from 1-1-my-feature.md', () => {
    const result = parseStoryFile(readArtifact('1-1-my-feature.md'));

    expect(result).not.toBeNull();
    expect(result!.id).toBe('1.1');
    expect(result!.title).toBe('My Feature');
    expect(result!.status).toBe('done');
    expect(result!.lineNumber).toBe(0);
  });

  it('parses review status from 1-2-feature-b.md', () => {
    const result = parseStoryFile(readArtifact('1-2-feature-b.md'));

    expect(result!.id).toBe('1.2');
    expect(result!.title).toBe('Feature B');
    expect(result!.status).toBe('review');
  });

  it('parses ready-for-dev status from 2-1-ready-for-dev.md', () => {
    const result = parseStoryFile(readArtifact('2-1-ready-for-dev.md'));

    expect(result!.id).toBe('2.1');
    expect(result!.title).toBe('Ready for Dev');
    expect(result!.status).toBe('ready-for-dev');
  });

  it('lowercases status value (Done → done) from 3-1-done-mixed-case.md', () => {
    const result = parseStoryFile(readArtifact('3-1-done-mixed-case.md'));

    expect(result!.id).toBe('3.1');
    expect(result!.title).toBe('Mixed Case Done');
    expect(result!.status).toBe('done');
  });

  it('defaults status to "draft" when no Status line present (4-1-no-status.md)', () => {
    const result = parseStoryFile(readArtifact('4-1-no-status.md'));

    expect(result!.id).toBe('4.1');
    expect(result!.title).toBe('No Status');
    expect(result!.status).toBe('draft');
  });
});
