import {afterEach,describe,expect,it,vi} from 'vitest';
import {createCouncilReveal,welcomeLine,shouldWelcome,REVEAL_TIMING,revealQuote,revealMetrics} from './councilReveal';
afterEach(()=>vi.useRealTimers());
describe('Council summon reveal',()=>{
 it('settles exactly once at 1200ms',()=>{vi.useFakeTimers();const onSettle=vi.fn();const reveal=createCouncilReveal({reduced:false,onSettle});vi.advanceTimersByTime(1199);expect(onSettle).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(onSettle).toHaveBeenCalledOnce();reveal.skip();expect(onSettle).toHaveBeenCalledOnce();expect(REVEAL_TIMING.settle).toBe(1200);});
 it('skip settles immediately and cancels the timer',()=>{vi.useFakeTimers();const onSettle=vi.fn();createCouncilReveal({reduced:false,onSettle}).skip();expect(onSettle).toHaveBeenCalledOnce();vi.runAllTimers();expect(onSettle).toHaveBeenCalledOnce();});
 it('dispose never settles',()=>{vi.useFakeTimers();const onSettle=vi.fn();const reveal=createCouncilReveal({reduced:false,onSettle});reveal.dispose();vi.runAllTimers();reveal.skip();expect(onSettle).not.toHaveBeenCalled();});
 it('reduced motion settles synchronously with no start time',()=>{const onSettle=vi.fn();const reveal=createCouncilReveal({reduced:true,onSettle});expect(onSettle).toHaveBeenCalledOnce();expect(reveal.startedAt).toBe(-Infinity);});
 it('greets by the hour',()=>{expect([4,5,11,12,16,17,23].map(welcomeLine)).toEqual(['Good evening. The Herald is listening.','Good morning. The Herald is listening.','Good morning. The Herald is listening.','Good afternoon. The Herald is listening.','Good afternoon. The Herald is listening.','Good evening. The Herald is listening.','Good evening. The Herald is listening.']);});
 it('keeps the quote verbatim',()=>{expect(revealQuote).toBe('Why read the numbers when you can ask the Herald?');});
 it('never welcomes over the visitor speaking, dictating, typing or asking',()=>{const base={enabled:true,supported:true,asked:false,draft:'',holding:false,listening:false};expect(shouldWelcome(base)).toBe(true);expect(shouldWelcome({...base,holding:true})).toBe(false);expect(shouldWelcome({...base,listening:true})).toBe(false);expect(shouldWelcome({...base,draft:'a'})).toBe(false);expect(shouldWelcome({...base,asked:true})).toBe(false);expect(shouldWelcome({...base,enabled:false})).toBe(false);});
});

it('uses the supplied portfolio metrics in the résumé implosion',()=>{expect(revealMetrics).toEqual(['6s → 0.9s','1,000+ ORDERS / DAY','0.896 HELD-OUT F1','385,288 SAFETY REPORTS']);});
