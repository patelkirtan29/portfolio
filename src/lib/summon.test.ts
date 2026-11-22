import { describe, expect, it } from 'vitest';
import { summonKey } from './summon';

describe('Council keyboard summon', () => {
  it('opens an empty question on slash', () => {
    expect(summonKey({ key: '/' }, false, false)).toBe('');
  });
  it('retains the exact first letter across scripts and case', () => {
    for (const key of ['a', 'Z', 'é', '中', 'क', '𐐀']) {
      expect(summonKey({ key }, false, false)).toBe(key);
    }
  });
  it('leaves editing and other modals undisturbed', () => {
    expect(summonKey({ key: 'a' }, true, false)).toBeNull();
    expect(summonKey({ key: '/' }, false, true)).toBeNull();
  });
  it('ignores composition and modified shortcuts', () => {
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
      expect(summonKey({ key: 'a', [modifier]: true }, false, false)).toBeNull();
    }
  });
  it('ignores spaces, digits, punctuation, and named keys', () => {
    for (const key of [' ', '1', '?', 'Enter', 'Dead', 'Process', 'ArrowDown', 'ab', '🙂']) {
      expect(summonKey({ key }, false, false)).toBeNull();
    }
  });
});
