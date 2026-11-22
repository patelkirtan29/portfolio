import {afterEach,describe,expect,it,vi} from 'vitest';
import {createCouncilMicController,type CouncilRecognition} from './councilMicController';

class Recognition implements CouncilRecognition {
 continuous=false;interimResults=false;lang='';onresult:CouncilRecognition['onresult']=null;onerror:CouncilRecognition['onerror']=null;onend:CouncilRecognition['onend']=null;
 start=vi.fn();stop=vi.fn();abort=vi.fn();
 final(text:string){this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:text}}]});}
}
function setup(){
 const runs:Recognition[]=[];const onWake=vi.fn(),onQuestion=vi.fn(),onDismiss=vi.fn();
 const options={open:false,speaking:false,onWake,onQuestion,onDismiss};
 let state={supported:true,ambient:false,listening:false,notice:''};
 const mic=createCouncilMicController(()=>{const r=new Recognition();runs.push(r);return r;},s=>{state=s;});
 mic.update(options,false);return {mic,runs,options,onWake,onQuestion,onDismiss,state:()=>state};
}
afterEach(()=>vi.useRealTimers());
describe('Council microphone',()=>{
 it('wakes on Hey alone, ignores the former name and partial word matches',()=>{
  const x=setup();x.mic.setAmbient(true);x.runs[0].final('Herald');x.runs[0].final('they discussed a heyday');expect(x.onWake).not.toHaveBeenCalled();x.runs[0].final('hEy!');expect(x.onWake).toHaveBeenCalledWith('');x.mic.dispose();
 });
 it('requires opt-in and disables ambient permanently after permission denial',()=>{
  vi.useFakeTimers();const x=setup();expect(x.runs).toHaveLength(0);x.mic.setAmbient(true);
  const r=x.runs[0];const end=r.onend;r.onerror?.({error:'not-allowed'});end?.();vi.runAllTimers();
  expect(x.state().ambient).toBe(false);expect(x.state().notice).toMatch(/permission/i);expect(x.runs).toHaveLength(1);expect(r.abort).toHaveBeenCalled();
 });
 it('pauses while speaking and ignores stale speech events across close and disposal',()=>{
  vi.useFakeTimers();const x=setup();x.mic.setAmbient(true);const r=x.runs[0];const late=r.onresult;
  x.options.speaking=true;x.mic.update(x.options,false);late?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Hey hello'}}]});
  expect(x.onWake).not.toHaveBeenCalled();expect(r.abort).toHaveBeenCalled();
  x.options.speaking=false;x.mic.update(x.options,false);expect(x.runs).toHaveLength(2);
  x.options.open=true;x.mic.update(x.options,false);const question=x.runs.at(-1)!;const old=question.onresult;
  x.options.open=false;x.mic.update(x.options,false);old?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'old question'}}]});expect(x.onQuestion).not.toHaveBeenCalled();
  x.mic.dispose();vi.runAllTimers();expect(x.state().listening).toBe(false);
 });
 it('routes wake remainder, questions and dismissal and bounds end restarts',()=>{
  vi.useFakeTimers();const x=setup();x.mic.setAmbient(true);x.runs[0].final('hello there');expect(x.onWake).not.toHaveBeenCalled();
  x.runs[0].final('Hey, explain your work');expect(x.onWake).toHaveBeenCalledWith('explain your work');
  x.options.open=true;x.mic.update(x.options,false);x.runs.at(-1)!.final('Dismiss.');expect(x.onDismiss).toHaveBeenCalledOnce();
  x.mic.update(x.options,false);vi.advanceTimersByTime(400);x.runs.at(-1)!.final('What did you build?');expect(x.onQuestion).toHaveBeenCalledWith('What did you build?');
  vi.advanceTimersByTime(400);const count=x.runs.length;x.runs.at(-1)!.onend?.();vi.advanceTimersByTime(399);expect(x.runs).toHaveLength(count);vi.advanceTimersByTime(1);expect(x.runs).toHaveLength(count+1);
 });
 it('waits for actual output silence before resuming a held gesture',()=>{
  vi.useFakeTimers();const runs:Recognition[]=[];let output=true;const question=vi.fn();
  const mic=createCouncilMicController(()=>{const r=new Recognition();runs.push(r);return r;},()=>{},()=>output);
  mic.update({open:true,speaking:false,onWake:()=>{},onDismiss:()=>{},onQuestion:question},false);
  mic.holdStart();expect(runs).toHaveLength(0);output=false;vi.advanceTimersByTime(400);expect(runs).toHaveLength(1);mic.holdEnd();runs[0].final('quiet now');expect(question).toHaveBeenCalledWith('quiet now');mic.dispose();
 });
 it('stops hold dictation without aborting its final result and cleans up on hide',()=>{
  const x=setup();x.options.open=true;x.mic.update(x.options,false);x.mic.holdStart();const r=x.runs[0];x.mic.holdEnd();expect(r.stop).toHaveBeenCalled();expect(r.abort).not.toHaveBeenCalled();r.final('A held question');expect(x.onQuestion).toHaveBeenCalledWith('A held question');
  x.mic.setAmbient(true);const active=x.runs.at(-1)!;x.mic.update(x.options,true);expect(active.abort).toHaveBeenCalled();expect(x.state().listening).toBe(false);
 });
});
