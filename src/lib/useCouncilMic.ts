import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createCouncilMicController,type CouncilMicOptions,type CouncilMicSnapshot,type CouncilRecognition} from './councilMicController';

export function useCouncilMic(options:CouncilMicOptions){
 const [state,setState]=useState<CouncilMicSnapshot>({supported:false,ambient:false,listening:false,notice:''});
 const latest=useRef(options);latest.current=options;
 const controller=useRef<ReturnType<typeof createCouncilMicController>|null>(null);
 useEffect(()=>{
  type RecognitionWindow=Window&{SpeechRecognition?:new()=>CouncilRecognition;webkitSpeechRecognition?:new()=>CouncilRecognition};
  const browser=window as RecognitionWindow;
  const Recognition=browser.SpeechRecognition||browser.webkitSpeechRecognition;
  const instance=createCouncilMicController(Recognition?()=>new Recognition():null,setState,()=>!!window.speechSynthesis?.speaking);
  controller.current=instance;
  const update=()=>instance.update(latest.current,document.hidden);
  update();document.addEventListener('visibilitychange',update);
  return()=>{document.removeEventListener('visibilitychange',update);instance.dispose();controller.current=null;};
 },[]);
 useLayoutEffect(()=>{controller.current?.update(options,document.hidden);});
 const setAmbient=useCallback((value:boolean)=>controller.current?.setAmbient(value),[]);
 const holdStart=useCallback(()=>controller.current?.holdStart(),[]);
 const holdEnd=useCallback(()=>controller.current?.holdEnd(),[]);
 return {...state,setAmbient,holdStart,holdEnd};
}
