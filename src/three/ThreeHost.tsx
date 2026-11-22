import {useEffect,useRef,useState,type ReactNode} from 'react';
import {WebGLRenderer} from 'three';
import type {ChamberFactory,ChamberMode,ChamberState,ChamberScene} from './chamberTypes';

type Props={factory:ChamberFactory;state:ChamberState;onPick?:(index:number)=>void;onMode?:(mode:ChamberMode)=>void;fallback?:ReactNode};
/** Renderer ownership is centralized here. Chambers borrow it and own only their scene resources. */
export default function ThreeHost({factory,state,onPick,onMode,fallback}:Props){
 const root=useRef<HTMLDivElement>(null);
 const latest=useRef({state,onPick,onMode});latest.current={state,onPick,onMode};
 const requestRender=useRef<()=>void>(()=>{});
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const host=root.current;if(!host)return;
  let renderer:WebGLRenderer|undefined,chamber:ChamberScene|undefined,frame=0,disposed=false,active=true,visible=true,previous=0,elapsed=0;
  let resizeObserver:ResizeObserver|undefined,visibilityObserver:IntersectionObserver|undefined;
  let detach=()=>{};
  setFailed(false);
  const stop=()=>{cancelAnimationFrame(frame);frame=0;previous=0;};
  const release=()=>{
   detach();resizeObserver?.disconnect();visibilityObserver?.disconnect();
   const scene=chamber,ownedRenderer=renderer;chamber=undefined;renderer=undefined;
   try{scene?.dispose();}finally{if(ownedRenderer){ownedRenderer.dispose();ownedRenderer.forceContextLoss();ownedRenderer.domElement.remove();}}
  };
  const fail=()=>{if(disposed||!active)return;active=false;stop();release();setFailed(true);};
  const draw=(time:number)=>{
   frame=0;if(disposed||!active||!visible||document.hidden||!renderer||!chamber)return;
   const dt=previous?Math.min((time-previous)/1000,1/30):1/60;previous=time;
   if(!latest.current.state.reducedMotion)elapsed+=dt;
   try{chamber.frame(dt,elapsed,latest.current.state);}catch(error){console.warn('Herald chamber switched to its static view.',error);fail();return;}
   if(!latest.current.state.reducedMotion)schedule();
  };
  const schedule=()=>{if(!disposed&&active&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(draw);};
  requestRender.current=()=>{previous=0;schedule();};
  const visibility=()=>{if(document.hidden)stop();else schedule();};
  try{
   renderer=new WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance',failIfMajorPerformanceCaveat:false});
   renderer.domElement.className='three-chamber-canvas';
   renderer.domElement.setAttribute('aria-label','Interactive ImmunoNet cell cloud. Use the controls below to inspect cells and move the GeneAttention slicer.');
   renderer.domElement.setAttribute('role','img');
   renderer.debug.onShaderError=()=>{throw new Error('Chamber shader compilation failed.');};
   host.appendChild(renderer.domElement);
   chamber=factory(renderer);latest.current.onMode?.(chamber.mode);
   const resize=()=>{if(!renderer||!chamber||disposed||!active)return;const box=host.getBoundingClientRect();const width=Math.max(1,Math.round(box.width)),height=Math.max(1,Math.round(box.height)),dpr=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);chamber.resize(width,height,dpr);schedule();};
   const canvas=renderer.domElement;
   const lost=(event:Event)=>{event.preventDefault();fail();};
   let down:{x:number;y:number;pointer:number}|null=null;
   const pointerDown=(event:PointerEvent)=>{down={x:event.clientX,y:event.clientY,pointer:event.pointerId};};
   const pointerUp=(event:PointerEvent)=>{if(!down||down.pointer!==event.pointerId)return;const moved=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;if(moved>5||!chamber||!active)return;const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;const selected=chamber.pick((event.clientX-box.left)/box.width*2-1,-((event.clientY-box.top)/box.height)*2+1);if(selected!==null)latest.current.onPick?.(selected);};
   const cancelPointer=()=>{down=null;};
   canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',cancelPointer);document.addEventListener('visibilitychange',visibility);
   detach=()=>{canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',cancelPointer);document.removeEventListener('visibilitychange',visibility);};
   resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
   visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)schedule();else stop();});visibilityObserver.observe(host);
   resize();schedule();
  }catch(error){console.warn('Herald 3D is unavailable; showing the accessible static view.',error);fail();}
  return()=>{disposed=true;stop();requestRender.current=()=>{};release();};
 },[factory,attempt]);
 useEffect(()=>{requestRender.current();},[state]);
 return <div className="three-host" ref={root} data-render-state={failed?'static':'three'} style={{position:'absolute',inset:0,overflow:'hidden'}}>{failed&&<div className="three-host-fallback" style={{position:'absolute',inset:0,zIndex:1}}>{fallback||<p>The cell cloud is available through the keyboard inspector and slicer controls below.</p>}<button type="button" className="three-retry" onClick={()=>setAttempt(value=>value+1)}>Retry 3D ↗</button></div>}</div>;
}
