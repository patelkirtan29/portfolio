import {useEffect,useRef,useState} from 'react';
import {createOpeningSequence,shouldPlayOpening,type OpeningStorage} from './openingSequence';
function storage():OpeningStorage|null{try{return window.sessionStorage;}catch{return null;}}
function reduced(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}}
export function useOpeningSequence(options:{onVoice?:()=>void;onSkip?:()=>void}={}){
 const latest=useRef(options);latest.current=options;
 const [active,setActive]=useState(()=>shouldPlayOpening(reduced(),storage()));
 useEffect(()=>{
  if(!active)return;
  const sequence=createOpeningSequence({onVoice:()=>latest.current.onVoice?.(),onFinish:reason=>{setActive(false);if(reason==='skipped')latest.current.onSkip?.();}},storage());
  const skip=(event:Event)=>{if(event.cancelable)event.preventDefault();event.stopImmediatePropagation();sequence.skip();};
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const preference=()=>{if(media.matches)sequence.skip();};
  const visibility=()=>{if(document.hidden)sequence.skip();};
  const capture={capture:true,passive:false};
  window.addEventListener('click',skip,capture);window.addEventListener('wheel',skip,capture);window.addEventListener('touchmove',skip,capture);window.addEventListener('keydown',skip,capture);
  media.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);
  if(media.matches||document.hidden)sequence.skip();
  return()=>{sequence.dispose();window.removeEventListener('click',skip,true);window.removeEventListener('wheel',skip,true);window.removeEventListener('touchmove',skip,true);window.removeEventListener('keydown',skip,true);media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);};
 },[active]);
 return{active};
}
