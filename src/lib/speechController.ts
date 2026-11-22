export type SpeechSnapshot = {speaking:boolean;activeKey:string|null;caption:string;error:string};
export type SpeechUnit = {text:string;rate:number;onstart:((event:SpeechSynthesisEvent)=>void)|null;onend:((event:SpeechSynthesisEvent)=>void)|null;onerror:((event:SpeechSynthesisErrorEvent)=>void)|null;onboundary:((event:SpeechSynthesisEvent)=>void)|null};
export type SpeechEngine = {cancel:()=>void;speak:(unit:SpeechUnit)=>void};
/** Owns a single browser utterance; late events from cancelled units cannot mutate newer speech. */
export function createSpeechController(engine:SpeechEngine,make:(text:string)=>SpeechUnit,onChange:(state:SpeechSnapshot)=>void) {
  let generation=0;
  let alive=true;
  let state:SpeechSnapshot={speaking:false,activeKey:null,caption:'',error:''};
  const update=(patch:Partial<SpeechSnapshot>)=>{state={...state,...patch};if(alive)onChange(state);};
  function stop(){generation++;engine.cancel();update({speaking:false,activeKey:null});}
  return {
    play(text:string,key:string,rate:number){
      if(!alive||!text.trim())return;
      generation++;const token=generation;
      engine.cancel();
      update({speaking:false,activeKey:key,caption:text,error:''});
      try {
        const unit=make(text);unit.rate=rate;
        const current=()=>alive&&generation===token;
        unit.onstart=()=>{if(current())update({speaking:true});};
        unit.onend=()=>{if(current())update({speaking:false,activeKey:null});};
        unit.onerror=()=>{if(current())update({speaking:false,activeKey:null,error:'Speech could not play. The full text is available.'});};
        unit.onboundary=event=>{
          if(!current()||event.name!=='word')return;
          const before=text.slice(0,event.charIndex);
          const matches=Array.from(before.matchAll(/[.!?]\s+/g));
          const last=matches[matches.length-1];
          const start=last?(last.index!+last[0].length):0;
          const rest=text.slice(start);const end=rest.search(/[.!?](?:\s|$)/);
          update({caption:end<0?rest:rest.slice(0,end+1)});
        };
        engine.speak(unit);
      }catch{update({speaking:false,activeKey:null,error:'Speech is unavailable. You can read the full text.'});}
    },
    stop,
    dispose(){generation++;alive=false;engine.cancel();},
  };
}
