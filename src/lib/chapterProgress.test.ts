import {describe,it,expect} from 'vitest';
import {chapterInset} from './chapterProgress';
describe('four chapter wipe progression',()=>{
 it('reveals the opening and selected chapter at its boundary',()=>{expect(chapterInset(0,0)).toBe(0);expect(chapterInset(1/3,1)).toBe(0);expect(chapterInset(2/3,2)).toBe(0);expect(chapterInset(1,3)).toBe(0);});
 it('keeps later chapters closed and continuously wipes the incoming one',()=>{expect(chapterInset(0,1)).toBe(100);expect(chapterInset(1/6,1)).toBeCloseTo(50);expect(chapterInset(1/3,2)).toBe(100);expect(chapterInset(.5,2)).toBeCloseTo(50);});
 it('clamps overscroll and preserves already read chapters',()=>{expect(chapterInset(-1,1)).toBe(100);expect(chapterInset(2,3)).toBe(0);expect(chapterInset(.8,1)).toBe(0);});
});
