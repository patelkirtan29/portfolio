import {useEffect,useRef,useState,type ReactNode} from 'react';
import {WebGLRenderer} from 'three';
import type {BaseChamberState,ChamberFactory,ChamberMode,ChamberScene} from './chamberTypes';

type Props<S extends BaseChamberState>={factory:ChamberFactory<S>;state:S;label?:string;onPick?:(index:number)=>void;onMode?:(mode:ChamberMode)=>void;fallback?:ReactNode};
/** Chambers own their scene resources; this host owns the renderer and animation clock. */
export default function ThreeHost<S extends BaseChamberState>({factory,state,label='Interactive project chamber. Use the controls below to explore.',onPick,onMode,fallback}:Props<S>){
 const root=useRef<HTMLDivElement>(null);
 const latest=useRef({state,onPick,onMode});latest.current={state,onPick,onMode};
 const requestRender=useRef<()=>void>(()=>{});
 const [status,setStatus]=useState<'loading'|'three'|'static'>('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const host=root.current;if(!host)return;
  let renderer:WebGLRenderer|undefined,chamber:ChamberScene<S>|undefined,frame=0,disposed=false,active=true,visible=true,previous=0,elapsed=0,pending=true;
  let resizeObserver:ResizeObserver|undefined,visibilityObserver:IntersectionObserver|undefined;
  let detach=()=>{};
  setStatus('loading');
  const stop=()=>{cancelAnimationFrame(frame);frame=0;previous=0;};
  const releaseRenderer=()=>{const owned=renderer;renderer=undefined;if(owned){owned.dispose();owned.forceContextLoss();owned.domElement.remove();}};
  const release=()=>{detach();resizeObserver?.disconnect();visibilityObserver?.disconnect();const scene=chamber;chamber=undefined;try{scene?.dispose();}finally{if(!pending)releaseRenderer();else renderer?.domElement.remove();}};
  const fail=()=>{if(disposed||!active)return;active=false;stop();release();setStatus('static');};
  const draw=(time:number)=>{
   frame=0;if(disposed||!active||!visible||document.hidden||!renderer||!chamber)return;
   const dt=previous?Math.min(Math.max(0,(time-previous)/1000),.033):1/60;previous=time;
   if(!latest.current.state.reducedMotion)elapsed+=dt;
   try{chamber.frame(dt,elapsed,latest.current.state);}catch(error){console.warn('Herald chamber switched to its static view.',error);fail();return;}
   if(!latest.current.state.reducedMotion)schedule();
  };
  const schedule=()=>{if(!disposed&&active&&visible&&!document.hidden&&!frame&&chamber)frame=requestAnimationFrame(draw);};
  requestRender.current=()=>{previous=0;schedule();};
  const visibility=()=>{if(document.hidden)stop();else schedule();};
  const setup=async()=>{
   try{
    renderer=new WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance',failIfMajorPerformanceCaveat:false});
    const ownedRenderer=renderer,canvas=ownedRenderer.domElement;
    canvas.className='three-chamber-canvas';Object.assign(canvas.style,{width:'100%',height:'100%',display:'block',touchAction:'none'});canvas.setAttribute('aria-label',label);canvas.setAttribute('role','img');
    ownedRenderer.debug.onShaderError=()=>{throw new Error('Chamber shader compilation failed.');};
    host.appendChild(canvas);
    const created=await factory(ownedRenderer);pending=false;
    if(disposed||!active){try{created.dispose();}finally{releaseRenderer();}return;}
    chamber=created;latest.current.onMode?.(created.mode);setStatus('three');
    const resize=()=>{if(!renderer||!chamber||disposed||!active)return;const box=host.getBoundingClientRect(),width=Math.max(1,Math.round(box.width)),height=Math.max(1,Math.round(box.height)),dpr=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);chamber.resize(width,height,dpr);schedule();};
    const ndc=(event:PointerEvent)=>{const box=canvas.getBoundingClientRect();return {x:(event.clientX-box.left)/Math.max(box.width,1)*2-1,y:-(event.clientY-box.top)/Math.max(box.height,1)*2+1};};
    const lost=(event:Event)=>{event.preventDefault();fail();};
    let down:{x:number;y:number;pointer:number;dragging:boolean}|null=null;
    const pointerDown=(event:PointerEvent)=>{if(event.button!==0||!chamber)return;const point=ndc(event),picked=chamber.beginDrag?.(point.x,point.y);down={x:event.clientX,y:event.clientY,pointer:event.pointerId,dragging:picked!=null};if(picked!=null){latest.current.onPick?.(picked);canvas.setPointerCapture(event.pointerId);schedule();}};
    const pointerMove=(event:PointerEvent)=>{if(!down||down.pointer!==event.pointerId||!down.dragging)return;const point=ndc(event);chamber?.drag?.(point.x,point.y);schedule();};
    const finish=(event:PointerEvent,cancel=false)=>{if(!down||down.pointer!==event.pointerId)return;const previousDown=down;down=null;chamber?.endDrag?.();if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(!cancel&&Math.hypot(event.clientX-previousDown.x,event.clientY-previousDown.y)<=5&&chamber&&active){const point=ndc(event),selected=chamber.pick(point.x,point.y);if(selected!==null)latest.current.onPick?.(selected);}schedule();};
    const pointerUp=(event:PointerEvent)=>finish(event),cancelPointer=(event:PointerEvent)=>finish(event,true);
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',cancelPointer);document.addEventListener('visibilitychange',visibility);
    detach=()=>{chamber?.endDrag?.();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',cancelPointer);document.removeEventListener('visibilitychange',visibility);};
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
    visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)schedule();else stop();});visibilityObserver.observe(host);
    resize();schedule();
   }catch(error){pending=false;console.warn('Herald 3D is unavailable; showing the accessible static view.',error);if(disposed){releaseRenderer();return;}fail();}
  };
  void setup();
  return()=>{disposed=true;stop();requestRender.current=()=>{};release();};
 },[factory,attempt,label]);
 useEffect(()=>{requestRender.current();},[state]);
 return <div className="three-host" ref={root} data-render-state={status} style={{position:'absolute',inset:0,overflow:'hidden'}}>{status==='loading'&&<span role="status" style={{position:'absolute',left:24,bottom:24}}>Preparing the chamber…</span>}{status==='static'&&<div className="three-host-fallback" style={{position:'absolute',inset:0,zIndex:1}}>{fallback||<p>Explore the project through the keyboard controls below.</p>}<button type="button" className="three-retry" onClick={()=>setAttempt(value=>value+1)}>Retry 3D ↗</button></div>}</div>;
}
