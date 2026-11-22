import {describe,it,expect} from 'vitest';
import {createSpeechController,type SpeechUnit,type SpeechSnapshot} from './speechController';
function setup(){const units:SpeechUnit[]=[];let state:SpeechSnapshot={speaking:false,activeKey:null,caption:'',error:''};const controller=createSpeechController({cancel(){},speak(u){units.push(u);}},text=>({text,rate:1,onstart:null,onend:null,onerror:null,onboundary:null}),next=>{state=next;});return {controller,units,state:()=>state};}
const event={} as SpeechSynthesisEvent;
describe('shared speech ownership',()=>{
 it('only shows speaking after actual browser playback starts',()=>{const f=setup();f.controller.play('A story.','project-01',.95);expect(f.state().activeKey).toBe('project-01');expect(f.state().speaking).toBe(false);f.units[0].onstart?.(event);expect(f.state().speaking).toBe(true);});
 it('ignores stale end callbacks after a newer utterance starts',()=>{const f=setup();f.controller.play('One.','one',1);const old=f.units[0];f.controller.play('Two.','two',1);f.units[1].onstart?.(event);old.onend?.(event);expect(f.state().activeKey).toBe('two');expect(f.state().speaking).toBe(true);});
 it('cancellation prevents old callbacks reviving playback',()=>{const f=setup();f.controller.play('One.','one',1);const old=f.units[0];f.controller.stop();old.onstart?.(event);expect(f.state().activeKey).toBe(null);expect(f.state().speaking).toBe(false);});
 it('advances captions from speech boundary events and handles errors honestly',()=>{const f=setup();f.controller.play('First sentence. Second sentence.','one',1);f.units[0].onboundary?.({charIndex:16,name:'word'} as SpeechSynthesisEvent);expect(f.state().caption).toBe('Second sentence.');f.units[0].onerror?.({error:'audio-busy'} as SpeechSynthesisErrorEvent);expect(f.state().speaking).toBe(false);expect(f.state().error).toContain('text');});
});
