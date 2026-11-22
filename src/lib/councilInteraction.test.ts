import {describe,it,expect} from 'vitest';
import {shouldHoldSpace} from './summon';
import {isDeepQuestion} from './sessionSummary';
describe('Council interaction regressions',()=>{
 it('preserves spaces in a typed multiword question even during narration',()=>{expect(shouldHoldSpace({code:'Space'},true,'Tell me')).toBe(false);expect(shouldHoldSpace({code:'Space'},true,'')).toBe(true);});
 it('only uses an unmodified non-composition Space gesture for dictation',()=>{expect(shouldHoldSpace({code:'Enter'},false,'')).toBe(false);expect(shouldHoldSpace({code:'Space',ctrlKey:true},false,'')).toBe(false);expect(shouldHoldSpace({code:'Space',isComposing:true},false,'')).toBe(false);expect(shouldHoldSpace({code:'Space'},false,'')).toBe(true);});
 it('opens technical decrees for implementation and database stack questions',()=>{expect(isDeepQuestion('Explain Atlas technical implementation')).toBe(true);expect(isDeepQuestion('Show Relay database stack')).toBe(true);expect(isDeepQuestion('Tell me about your story')).toBe(false);});
});
