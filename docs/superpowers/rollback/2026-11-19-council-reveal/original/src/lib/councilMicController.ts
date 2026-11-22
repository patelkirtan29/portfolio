export type CouncilMicOptions={open:boolean;speaking:boolean;onWake:(text:string)=>void;onDismiss:()=>void;onQuestion:(text:string)=>void};
export type CouncilMicSnapshot={supported:boolean;ambient:boolean;listening:boolean;notice:string};
type ResultEvent={resultIndex:number;results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>};
export type CouncilRecognition={continuous:boolean;interimResults:boolean;lang:string;onresult:((event:ResultEvent)=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};

/** Owns a single live recognition session. Retired sessions can never dispatch. */
export function createCouncilMicController(create:(()=>CouncilRecognition)|null,emit:(state:CouncilMicSnapshot)=>void,isOutputSpeaking:()=>boolean=()=>false){
 let state:CouncilMicSnapshot={supported:!!create,ambient:false,listening:false,notice:create?'':'Speech recognition is unavailable in this browser. You can type your question.'};
 let options:CouncilMicOptions={open:false,speaking:false,onWake:()=>{},onDismiss:()=>{},onQuestion:()=>{}};
 let hidden=false,disposed=false,holding=false;
 let active:{recognition:CouncilRecognition;mode:'ambient'|'hold';open:boolean}|null=null;
 let restart:ReturnType<typeof setTimeout>|undefined;
 const publish=(patch:Partial<CouncilMicSnapshot>)=>{state={...state,...patch};emit(state);};
 const clearRestart=()=>{if(restart!==undefined)clearTimeout(restart);restart=undefined;};
 const quiet=()=>!options.speaking&&!isOutputSpeaking();
 const retire=()=>{
  clearRestart();const previous=active;active=null;
  if(previous){previous.recognition.onresult=null;previous.recognition.onerror=null;previous.recognition.onend=null;try{previous.recognition.abort();}catch{/* Already ended. */}}
  if(state.listening)publish({listening:false});
 };
 const schedule=()=>{
  clearRestart();if(disposed||!state.ambient||hidden||!quiet()||holding)return;
  restart=setTimeout(()=>{restart=undefined;start('ambient');},400);
 };
 const fail=(error:string)=>{
  holding=false;retire();
  const denied=error==='not-allowed'||error==='service-not-allowed';
  publish({ambient:false,notice:denied?'Microphone permission was denied. Enable it in browser settings, then explicitly enable listening again.':error==='audio-capture'?'No microphone is available. You can type your question.':'Speech recognition stopped. You can type or explicitly enable listening again.'});
 };
 function waitForOutput(){
  if(disposed||hidden||options.speaking||(!holding&&!state.ambient)||restart!==undefined)return;
  restart=setTimeout(()=>{restart=undefined;if(quiet())start(holding?'hold':'ambient');else waitForOutput();},400);
 }
 function start(mode:'ambient'|'hold'){
  if(disposed||hidden||!create||active||(mode==='ambient'&&!state.ambient))return;
  if(!quiet()){waitForOutput();return;}
  clearRestart();let recognition:CouncilRecognition;
  try{recognition=create();}catch{fail('unavailable');return;}
  const session={recognition,mode,open:options.open};active=session;
  recognition.continuous=mode==='ambient';recognition.interimResults=false;recognition.lang='en-US';
  const valid=()=>!disposed&&active===session&&!hidden&&quiet()&&options.open===session.open;
  recognition.onresult=event=>{
   if(!valid())return;
   const parts:string[]=[];for(let i=event.resultIndex;i<event.results.length;i++)if(event.results[i].isFinal)parts.push(event.results[i][0].transcript);
   const text=parts.join(' ').trim();if(!text)return;
   if(options.open){
    // Retire before callbacks: these callbacks may close the HUD or start speech.
    holding=false;retire();
    if(/^dismiss[.!?\s]*$/i.test(text))options.onDismiss();else options.onQuestion(text);
    schedule();
   }else{
    const wake=/\bhey\b[\s,.:;!?-]*/i.exec(text);if(!wake)return;
    holding=false;retire();options.onWake(text.slice(wake.index+wake[0].length).trim());schedule();
   }
  };
  recognition.onerror=event=>{if(active!==session||disposed)return;if(event.error==='no-speech')return;if(event.error==='aborted'){retire();schedule();return;}fail(event.error);};
  recognition.onend=()=>{
   if(active!==session||disposed)return;
   active=null;recognition.onresult=null;recognition.onerror=null;recognition.onend=null;holding=false;publish({listening:false});schedule();
  };
  try{recognition.start();if(active===session)publish({listening:true,notice:''});}catch{if(active===session)fail('start-failed');}
 }
 emit(state);
 return {
  update(next:CouncilMicOptions,nextHidden:boolean){
   const changed=next.open!==options.open;options={...next};hidden=nextHidden;
   if(disposed)return;
   if(changed||hidden||!quiet()){retire();if(changed||hidden)holding=false;}
   if(!hidden&&!active&&restart===undefined){if(holding)start('hold');else if(state.ambient)start('ambient');}
  },
  setAmbient(value:boolean){
   if(disposed)return;
   if(!create){publish({notice:'Speech recognition is unavailable in this browser. You can type your question.'});return;}
   if(!value){holding=false;retire();publish({ambient:false});return;}
   publish({ambient:true,notice:''});start('ambient');
  },
  holdStart(){
   if(disposed||!options.open||hidden)return;
   if(!create){publish({notice:'Speech recognition is unavailable in this browser. You can type your question.'});return;}
   if(holding)return;retire();holding=true;start('hold');
  },
  holdEnd(){
   if(!holding)return;holding=false;
   if(active?.mode==='hold'){try{active.recognition.stop();}catch{retire();schedule();}}
   else schedule();
  },
  dispose(){disposed=true;holding=false;retire();},
 };
}
