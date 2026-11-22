import {useCallback,useEffect,useRef,useState} from 'react';
import {createSpeechController,type SpeechSnapshot} from './speechController';
import type {Tone} from './conversation';
export type SpeechControls={supported:boolean;enabled:boolean;setEnabled:(v:boolean)=>void;speaking:boolean;activeKey:string|null;caption:string;speak:(text:string,options?:{key?:string;tone?:Tone})=>void;stop:()=>void;error:string};
export function useSpeech():SpeechControls{
 const [supported,setSupported]=useState(false);
 const [enabled,setAutoEnabled]=useState(false);
 const [state,setState]=useState<SpeechSnapshot>({speaking:false,activeKey:null,caption:'',error:''});
 const controller=useRef<ReturnType<typeof createSpeechController>|null>(null);
 useEffect(()=>{
  const available='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  setSupported(available);
  if(!available)return;
  controller.current=createSpeechController({cancel:()=>window.speechSynthesis.cancel(),speak:unit=>window.speechSynthesis.speak(unit as SpeechSynthesisUtterance)},text=>new SpeechSynthesisUtterance(text),setState);
  return()=>{controller.current?.dispose();controller.current=null;};
 },[]);
 const stop=useCallback(()=>{controller.current?.stop();},[]);
 const speak=useCallback((text:string,options?:{key?:string;tone?:Tone})=>{
  if(!controller.current){setState(s=>({...s,error:'Voice is unavailable in this browser. Full text is ready.'}));return;}
  controller.current.play(text,options?.key||'herald',options?.tone==='Sharp & Technical'?1.08:options?.tone==='Warm & Candid'?1:.91);
 },[]);
 const setEnabled=useCallback((next:boolean)=>{setAutoEnabled(next);if(!next)stop();},[stop]);
 return {...state,supported,enabled,setEnabled,speak,stop};
}
