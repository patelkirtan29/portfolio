import { describe, expect, it } from 'vitest';
import { defaultProfile } from './profile';
import { buildSessionSummary, isDeepQuestion } from './sessionSummary';

describe('Council session dispatch', () => {
  it('uses current identity and project lessons, only for unlocked projects', () => {
    const profile = structuredClone(defaultProfile);
    profile.name = 'River Quinn';
    profile.projects[1].title = 'Renamed library';
    profile.projects[1].lesson = 'A local index made lookup possible offline.';
    const result = buildSessionSummary(profile, ['Why a local index?', '  '], ['artifact-02', 'artifact-02', 'missing']);
    expect(result).toContain('River Quinn');
    expect(result).toContain('Renamed library');
    expect(result).toContain('A local index made lookup possible offline.');
    expect(result).toContain('Why a local index?');
    expect(result.match(/A local index made lookup possible offline\./g)).toHaveLength(1);
    expect(result).not.toContain(defaultProfile.projects[0].lesson);
    expect(result).not.toMatch(/99\.9|p99:\s*\d|Alex Morgan/);
  });
  it('includes the recorded answers in a Raven dispatch', () => {
    expect(buildSessionSummary(defaultProfile, ['What are the results?'], [], ['No results available yet.'])).toContain('No results available yet.');
  });
  it('makes an empty session explicit without inventing questions or lessons', () => {
    const result = buildSessionSummary(defaultProfile, [], []);
    expect(result).toContain('No questions recorded.');
    expect(result).toContain('No project lessons unlocked.');
    expect(result).toContain(defaultProfile.projects[0].title);
  });
  it.each(['Explain the architecture', 'Show proof', 'What are the trade-offs?', 'tradeoffs', 'lessons learned', 'Open the vault'])('recognizes a technical/deep question: %s', text => {
    expect(isDeepQuestion(text)).toBe(true);
  });
  it.each(['Who are you?', 'Hi', 'The proofreading title', ''])('does not open the decree for ordinary text: %s', text => {
    expect(isDeepQuestion(text)).toBe(false);
  });
});
