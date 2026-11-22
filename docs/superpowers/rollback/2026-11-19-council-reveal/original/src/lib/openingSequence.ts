export const OPENING_KEY='herald-opening-v1';
export const OPENING_TIMING={interruption:1000,reveal:1600,total:2200} as const;
export type OpeningStorage=Pick<Storage,'getItem'|'setItem'>;
export type OpeningEnd='complete'|'skipped';
export function shouldPlayOpening(reduced:boolean,storage:OpeningStorage|null):boolean{
 if(reduced)return false;
 try{return storage?.getItem(OPENING_KEY)!=='done';}catch{return true;}
}
/** Disposal is not completion: a StrictMode probe must never consume the session. */
export function createOpeningSequence(options:{onVoice?:()=>void;onFinish:(reason:OpeningEnd)=>void},storage:OpeningStorage|null){
 let finished=false;
 let voice:ReturnType<typeof setTimeout>,end:ReturnType<typeof setTimeout>;
 const clear=()=>{clearTimeout(voice);clearTimeout(end);};
 const finish=(reason:OpeningEnd)=>{
  if(finished)return;finished=true;clear();
  try{storage?.setItem(OPENING_KEY,'done');}catch{/* Storage must never block the hero. */}
  options.onFinish(reason);
 };
 voice=setTimeout(()=>{if(!finished){try{options.onVoice?.();}catch{/* Optional audio cannot interrupt the reveal. */}}},OPENING_TIMING.interruption);
 end=setTimeout(()=>finish('complete'),OPENING_TIMING.total);
 return{skip:()=>finish('skipped'),dispose:()=>{finished=true;clear();}};
}
