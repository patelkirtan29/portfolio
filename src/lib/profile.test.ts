import { describe, it, expect } from 'vitest';
import { defaultProfile, validateProfile, loadProfile, persistProfile } from './profile';

const clone = () => structuredClone(defaultProfile);
function storage(initial: string | null = null) {
  let value = initial;
  return { getItem: (key: string) => key === 'herald-profile-v2' ? value : null, setItem: (key: string, next: string) => { if (key === 'herald-profile-v2') value = next; } };
}
describe('editable profile persistence', () => {
  it('seeds six stable projects and the supplied career', () => {
    const p = validateProfile(defaultProfile);
    expect(p?.projects.map(a => a.id)).toEqual(['artifact-01', 'artifact-02', 'artifact-03', 'artifact-04', 'artifact-05', 'artifact-06']);
    expect(new Set(p?.projects.map(a => a.title)).size).toBe(6);
    expect(p?.career.length).toBeGreaterThanOrEqual(3);
    expect(p?.isSample).toBe(false);
  });
  it.each([null, {}, { version: 9 }, { ...defaultProfile, name: '' }, { ...defaultProfile, bio: 'x'.repeat(10001) }, { ...defaultProfile, pitches: {} }, { ...defaultProfile, projects: [] }])('rejects malformed profile %#', value => {
    expect(validateProfile(value)).toBeNull();
  });
  it('rejects duplicate IDs and incomplete artifact or career content', () => {
    const p = clone(); p.projects[1].id = 'artifact-01'; expect(validateProfile(p)).toBeNull();
    const q = clone(); q.projects[0].stack = []; expect(validateProfile(q)).toBeNull();
    const r = clone(); r.career[0].outcome = ''; expect(validateProfile(r)).toBeNull();
  });
  it('round trips owner edits and removes the sample label when explicitly saved', () => {
    const p = clone(); p.name = 'Sam Lee'; p.isSample = false;
    const s = storage();
    expect(persistProfile(p, s).ok).toBe(true);
    expect(loadProfile(s).profile.name).toBe('Sam Lee');
    expect(loadProfile(s).profile.isSample).toBe(false);
  });
  it.each(['{bad json', JSON.stringify({ version: 99 }), 'x'.repeat(300001)])('falls back safely from invalid stored input %#', raw => {
    const result = loadProfile(storage(raw));
    expect(result.profile.name).toBe('Kirtan Patel'); expect(result.notice).toBeTruthy();
  });
  it('handles missing and blocked storage without sharing a mutable fallback', () => {
    const first = loadProfile(storage()); first.profile.name = 'Changed';
    expect(loadProfile(storage()).profile.name).toBe('Kirtan Patel');
    const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
    expect(loadProfile(blocked).notice).toBeTruthy();
    expect(persistProfile(clone(), blocked).ok).toBe(false);
    expect(loadProfile(null).profile.name).toBe('Kirtan Patel');
    expect(persistProfile(clone(), null).ok).toBe(false);
  });
  it('refuses to persist invalid owner edits', () => {
    const s = storage(); const p = clone(); p.name = '';
    expect(persistProfile(p, s).ok).toBe(false);
    expect(s.getItem('herald-profile-v2')).toBeNull();
  });
});
