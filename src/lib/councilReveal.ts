export const revealMetrics=['6s → 0.9s','1,000+ ORDERS / DAY','0.896 HELD-OUT F1','385,288 SAFETY REPORTS'] as const;
/** Timeline for the Résumé Implosion that plays each time Herald is called. */
export const REVEAL_TIMING={slice:300,assemble:600,settle:1200} as const;
export const revealQuote='Why read the numbers when you can ask the Herald?';
export function welcomeLine(hour:number):string{
 const part=hour>=5&&hour<12?'morning':hour>=12&&hour<17?'afternoon':'evening';
 return `Good ${part}. The Herald is listening.`;
}
/** The welcome never talks over a visitor who is already typing, asking, dictating or speaking. */
export function shouldWelcome(state:{enabled:boolean;supported:boolean;asked:boolean;draft:string;holding:boolean;listening:boolean}):boolean{
 return state.enabled&&state.supported&&!state.asked&&!state.draft.trim()&&!state.holding&&!state.listening;
}
/** Disposal is not settling: closing mid-reveal must never fire a stale welcome. */
export function createCouncilReveal(options:{reduced:boolean;onSettle:()=>void}){
 let done=false,timer:ReturnType<typeof setTimeout>|undefined;
 const settle=()=>{if(done)return;done=true;clearTimeout(timer);options.onSettle();};
 if(options.reduced){settle();return{startedAt:-Infinity,skip:()=>{},dispose:()=>{done=true;}};}
 const startedAt=performance.now();
 timer=setTimeout(settle,REVEAL_TIMING.settle);
 return{startedAt,skip:settle,dispose:()=>{done=true;clearTimeout(timer);}};
}
