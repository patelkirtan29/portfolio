import {describe, expect, it} from 'vitest';
import {defaultProfile, loadProfile, persistProfile, validateProfile} from './profile';
import {storyChapters} from '../components/Chapters';

describe('optional profile evidence lists', () => {
  it('accepts old profiles without optional fields', () => {
    const profile = structuredClone(defaultProfile);
    delete profile.familiarSkills; delete profile.researchInterests; delete profile.heroSubtitle;
    expect(validateProfile(profile)).toEqual(profile);
  });
  it('clones and persists separate familiar skills and research interests', () => {
    const input = {...structuredClone(defaultProfile), familiarSkills: ['CUDA'], researchInterests: ['Thermal ML idea']};
    const valid = validateProfile(input)!;
    input.familiarSkills[0] = 'Changed';
    expect(valid.familiarSkills).toEqual(['CUDA']);
    let raw: string | null = null;
    const storage = {getItem: () => raw, setItem: (_key: string, value: string) => {raw = value;}};
    expect(persistProfile(valid, storage).ok).toBe(true);
    expect(loadProfile(storage).profile).toEqual(valid);
    expect(validateProfile({...valid, familiarSkills: [], researchInterests: []})).not.toBeNull();
  });
  it.each(['familiarSkills', 'researchInterests'] as const)('rejects malformed %s lists', field => {
    for (const invalid of [null, 'CUDA', [''], ['x'.repeat(201)], Array(31).fill('Skill'), [12]]) {
      expect(validateProfile({...defaultProfile, [field]: invalid})).toBeNull();
    }
  });
  it('bounds and preserves the optional subtitle', () => {
    expect(validateProfile({...defaultProfile, heroSubtitle: 'x'.repeat(3001)})).toBeNull();
    expect(validateProfile({...defaultProfile, heroSubtitle: ''})).toBeNull();
    expect(validateProfile(defaultProfile)?.heroSubtitle).toBe(defaultProfile.heroSubtitle);
  });
});

describe('career chapter projections', () => {
  it('shows four career chapters instead of audience pitches', () => {
    const chapters = storyChapters(defaultProfile);
    expect(chapters.map(chapter => chapter.index)).toEqual(['PRODUCTION ROOTS', 'DISTRIBUTED & ML SYSTEMS', 'HEALTHCARE & BIOLOGY', 'WHAT’S NEXT']);
    expect(chapters[0].excerpt).toContain('10,000+');
    expect(chapters[1].excerpt).toContain('SibylKV');
    expect(chapters[2].excerpt).toContain('385,288');
    expect(chapters[3].excerpt).toContain('May 2027');
  });
  it('reflects edited career evidence and availability', () => {
    const profile = structuredClone(defaultProfile);
    profile.career[1].outcome = 'A different production story.';
    profile.availability = 'Available for collaboration now.';
    const chapters = storyChapters(profile);
    expect(chapters[0].excerpt).toBe(profile.career[1].outcome);
    expect(chapters[3].excerpt).toBe(profile.availability);
  });
});
