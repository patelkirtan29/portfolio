import {useCallback, useEffect, useId, useRef, useState} from 'react';
import type {KeyboardEvent, PointerEvent} from 'react';
import type {Artifact} from '../../lib/profile';
import ThreeHost from '../../three/ThreeHost';
import {createImmunoEngine} from '../../three/immunoEngine';
import type {ChamberState, ChamberMode} from '../../three/chamberTypes';
import {CELL_COUNT, CLUSTER_COLORS, CLUSTER_NAMES, createCellCloud, markerWeights, clampCellIndex, sliceToWorld, PROVENANCE, WALKTHROUGH, FIGURE_SLOTS} from '../../three/immunoModel';
import './immuno-chamber.css';

type Props = {artifact?:Artifact; onNarrate?:(text:string)=>void; onStopNarration?:()=>void};
const cellClusters=createCellCloud().clusters;
const initialState:ChamberState = {standardized:false, slice:0, selectedCell:0, guided:false, reducedMotion:false, dark:false, cameraYaw:0, cameraPitch:0};

function StaticCloud({standardized, slice}:{standardized:boolean; slice:number}) {
 return <div className="ic-static"><svg viewBox="0 0 740 430" role="img" aria-label={`Static schematic of six illustrative immune cell clusters. ${standardized?'Domains aligned.':'Domains separated.'}`}>
  <defs><radialGradient id="ic-static-glow"><stop stopColor="currentColor" stopOpacity=".1"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
  <ellipse cx="350" cy="222" rx="265" ry="180" fill="url(#ic-static-glow)"/>
  {Array.from({length:420}, (_,i)=>{const cluster=i%6; const angle=i*2.399963; const radius=5+Math.sqrt(i/6)*7; const a=cluster*Math.PI/3; const spread=standardized?92:132;const x=355+Math.cos(a)*spread+Math.cos(angle)*radius+(standardized?0:(i%2?21:-21));const y=210+Math.sin(a)*spread*.67+Math.sin(angle)*radius*.65;return <circle key={i} cx={x} cy={y} r={i%11===0?2.7:1.7} fill={CLUSTER_COLORS[cluster]} opacity={Math.abs((y-210)/120-slice)<.2?.95:.38}/>;})}
  <path d={`M ${355+slice*100} 68 l 68 48 v 248 l -68 -48 Z`} fill="currentColor" fillOpacity=".035" stroke="currentColor" strokeOpacity=".25" strokeDasharray="4 5"/>
 </svg><span className="ic-static-note">Static schematic · interactive controls remain available</span></div>;
}

export default function ImmunoChamber({onNarrate,onStopNarration}:Props) {
 const [state,setState]=useState<ChamberState>(initialState);
 const [mode,setMode]=useState<ChamberMode>();
 const [dockOpen,setDockOpen]=useState(true);
 const [provenanceOpen,setProvenanceOpen]=useState(false);
 const [step,setStep]=useState(0);
 const [cellDraft,setCellDraft]=useState('1');
 const provenanceButton=useRef<HTMLButtonElement>(null);
 const provenanceClose=useRef<HTMLButtonElement>(null);
 const pointer=useRef<{x:number;y:number;yaw:number;pitch:number}|null>(null);
 const callbacks=useRef({onNarrate,onStopNarration});
 callbacks.current={onNarrate,onStopNarration};
 const sliderId=useId();
 const inspectorId=useId();
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setState(s=>({...s,reducedMotion:media.matches,dark:document.documentElement.dataset.theme==='dark'}));
  update(); media.addEventListener('change',update);
  const observer=new MutationObserver(update); observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return ()=>{media.removeEventListener('change',update);observer.disconnect();callbacks.current.onStopNarration?.();};
 },[]);
 const stop=useCallback(()=>{setState(s=>({...s,guided:false}));callbacks.current.onStopNarration?.();},[]);
 const applyStep=useCallback((index:number,narrate:boolean)=>{
  const next=Math.max(0,Math.min(WALKTHROUGH.length-1,index)); const item=WALKTHROUGH[next];
  setStep(next); setState(s=>({...s,guided:true,standardized:item.standardized,slice:sliceToWorld(item.slice)/4,selectedCell:clampCellIndex(item.selectedCell)}));
  callbacks.current.onStopNarration?.();
  if(narrate) callbacks.current.onNarrate?.(`${item.title}. ${item.text}`);
 },[]);
 useEffect(()=>{
  if(!state.guided||state.reducedMotion) return;
  const timer=window.setTimeout(()=>{if(step===WALKTHROUGH.length-1)stop();else applyStep(step+1,true);},Math.max(8500,WALKTHROUGH[step].text.split(/\s+/).length*420+1500));
  return ()=>window.clearTimeout(timer);
 },[state.guided,state.reducedMotion,step,applyStep,stop]);
 useEffect(()=>setCellDraft(String(state.selectedCell+1)),[state.selectedCell]);
 useEffect(()=>{if(provenanceOpen)provenanceClose.current?.focus();},[provenanceOpen]);
 const closeProvenance=()=>{setProvenanceOpen(false);provenanceButton.current?.focus();};
 const selectCell=(index:number)=>{stop();setState(s=>({...s,selectedCell:clampCellIndex(index)}));};
 const handleInspectorKey=(event:KeyboardEvent<HTMLElement>)=>{
  if(event.target instanceof HTMLInputElement)return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();selectCell(state.selectedCell+(event.key==='ArrowRight'?1:-1));}
 };
 const dragStart=(event:PointerEvent<HTMLDivElement>)=>{if(event.button!==0||!(event.target instanceof HTMLCanvasElement))return;pointer.current={x:event.clientX,y:event.clientY,yaw:state.cameraYaw,pitch:state.cameraPitch};};
 const dragMove=(event:PointerEvent<HTMLDivElement>)=>{const start=pointer.current;if(!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)<5)return;stop();setState(s=>({...s,cameraYaw:start.yaw+(event.clientX-start.x)*.006,cameraPitch:Math.max(-.7,Math.min(.7,start.pitch+(event.clientY-start.y)*.004))}));};
 const markers=markerWeights(state.selectedCell);
 const cluster=cellClusters[state.selectedCell];
 return <section className={`immuno-chamber ${state.dark?'ic-nocturne':'ic-archival'}`} aria-label="ImmunoNet interactive research chamber">
  <header className="ic-heading"><div><p className="ic-kicker">Computational immunology / interactive study</p><h3>A common language for cells.</h3></div><button ref={provenanceButton} className="ic-text-button" onClick={()=>setProvenanceOpen(true)}>Evidence & figures <span aria-hidden="true">↗</span></button></header>
  <div className="ic-stage">
   <div className="ic-canvas" onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onPointerLeave={()=>{pointer.current=null;}}>
    <ThreeHost factory={createImmunoEngine} state={state} onMode={setMode} onPick={selectCell} fallback={<StaticCloud standardized={state.standardized} slice={state.slice}/>}/>
   </div>
   <div className="ic-stage-top"><span className="ic-plate">IMN / 01 <i/> CELL ATLAS</span><span className="ic-stage-mode">{state.standardized?'Aligned domains':'Raw domain shift'}</span></div>
   <div className="ic-coordinate"><span>GWU Course Paper · Spring 2026</span><span>10,000 cells / 6 immune classes</span><span>Illustrative geometry</span><span>{mode==='float-fbo'?'Float-FBO':mode==='half-float-fbo'?'Half-Float':mode==='instanced-spring'?'Instanced spring':'Static / initializing'}</span></div><div className="ic-readouts">{PROVENANCE.map(item=><div key={item.accession}><strong>{item.metric}</strong><span>{item.label}<small>{item.accession}</small></span></div>)}</div>
   <div className="ic-axis" aria-hidden="true"><span>z</span><i/><span>x</span></div>
   <aside className="ic-inspector" aria-labelledby={inspectorId} onKeyDown={handleInspectorKey} tabIndex={0}>
    <div className="ic-inspector-heading"><span className="ic-kicker">Cell inspector</span><span className="ic-cell-dot" style={{background:CLUSTER_COLORS[cluster]}}/></div>
    <h4 id={inspectorId}>{CLUSTER_NAMES[cluster]}</h4>
    <div className="ic-cell-nav"><button aria-label="Inspect previous cell" onClick={()=>selectCell(state.selectedCell-1)}>←</button><label>Cell <input aria-label="Cell number" type="number" min="1" max={CELL_COUNT} value={cellDraft} onChange={e=>{const value=e.target.value;setCellDraft(value);if(value!==''&&Number.isFinite(Number(value)))selectCell(Number(value)-1);}} onBlur={()=>setCellDraft(String(state.selectedCell+1))}/></label><button aria-label="Inspect next cell" onClick={()=>selectCell(state.selectedCell+1)}>→</button></div>
    <div className="ic-marker-list">{markers.map(({gene,weight})=><div className="ic-marker" key={gene}><div><span>{gene}</span><span>{Math.round(weight*100)}%</span></div><div className="ic-marker-track"><i style={{width:`${Math.max(0,Math.min(1,weight))*100}%`,background:CLUSTER_COLORS[cluster]}}/></div></div>)}</div>
    <p className="ic-weight-note">Illustrative IG-style weights · not measured cell attribution</p>
    <details className="ic-ig-explainer"><summary>What is Integrated Gradients?</summary><p>A method that attributes a model’s prediction to its input features by integrating gradients from a baseline. These bars demonstrate the idea; they are not research outputs.</p></details>
   </aside>
   <div className="ic-stage-bottom"><span className="ic-live-dot"/><span>{state.reducedMotion?'Reduced motion · static view':'Drag to orbit · select a cell'}</span><button className="ic-text-button" onClick={()=>setDockOpen(open=>!open)} aria-expanded={dockOpen} aria-controls="ic-control-dock">{dockOpen?'Hide controls −':'Show controls +'}</button></div>
  </div>
  {state.guided&&<div className="ic-tour" aria-live="polite"><div className="ic-tour-count">0{step+1}<span>/ 0{WALKTHROUGH.length}</span></div><div><p className="ic-kicker">Guided walkthrough{state.reducedMotion?' · manual steps':''}</p><h4>{WALKTHROUGH[step].title}</h4><p>{WALKTHROUGH[step].text}</p></div><div className="ic-tour-nav"><button aria-label="Previous walkthrough step" disabled={step===0} onClick={()=>applyStep(step-1,true)}>←</button><button aria-label="Next walkthrough step" disabled={step===WALKTHROUGH.length-1} onClick={()=>applyStep(step+1,true)}>→</button><button onClick={stop}>Stop</button></div></div>}
  {dockOpen&&<div className="ic-dock" id="ic-control-dock">
   <div className="ic-domain"><span className="ic-kicker">01 / Domain alignment</span><div className="ic-segment"><button aria-pressed={!state.standardized} onClick={()=>{stop();setState(s=>({...s,standardized:false}));}}>Raw <span>10x shift</span></button><button aria-pressed={state.standardized} onClick={()=>{stop();setState(s=>({...s,standardized:true}));}}>Standardized <span>target domain · +0.018 F1</span></button></div><span className="ic-domain-caption">{state.standardized?'Reported preprocessing bundle: +0.018 macro F1':'Explore the separation between domains'}</span></div>
   <div className="ic-slicer"><label className="ic-kicker" htmlFor={sliderId}>02 / Gene attention slice <output>{Math.round((state.slice+1)*50)}%</output></label><input id={sliderId} type="range" min="0" max="100" step="1" value={Math.round((state.slice+1)*50)} aria-valuetext={`Slice position ${Math.round((state.slice+1)*50)} percent`} onChange={e=>{stop();setState(s=>({...s,slice:sliceToWorld(Number(e.target.value))/4}));}}/><div className="ic-range-labels"><span>Near</span><span>Drag or use arrow keys</span><span>Far</span></div></div>
   <button className="ic-tour-start" aria-pressed={state.guided} onClick={()=>state.guided?stop():applyStep(0,true)}><span aria-hidden="true">{state.guided?'Ⅱ':'▷'}</span><span>{state.guided?'Stop walkthrough':'Take the walkthrough'}<small>Four perspectives · {state.reducedMotion?'manual pace':'narrated study'}</small></span></button>
  </div>}
  <div className="ic-legend" aria-label="Immune cell classes">{CLUSTER_NAMES.map((name,i)=><span key={name}><i style={{background:CLUSTER_COLORS[i]}}/>{name}</span>)}</div>
  <p className="ic-footnote">Synthetic cell geometry. Reported gains: +0.018 macro F1 for the preprocessing bundle (standardization + gene handling); +0.013 for architecture.</p>
  {provenanceOpen&&<aside className="ic-evidence" role="region" aria-label="Research provenance and original figures" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeProvenance();}}}>
   <div className="ic-evidence-heading"><div><p className="ic-kicker">Research record</p><h4>Evidence, with boundaries.</h4></div><button ref={provenanceClose} onClick={closeProvenance} aria-label="Close research evidence">×</button></div>
   <p className="ic-evidence-intro">The chamber is a conceptual reconstruction. Its coordinates, cell identities and marker weights are illustrative. Reported results below remain separate from this visualization.</p>
   <div className="ic-provenance-list">{PROVENANCE.map((item,i)=><article key={`${item.accession}-${i}`}><div><h5>{item.label}</h5>{item.accession&&<a href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${encodeURIComponent(item.accession)}`} target="_blank" rel="noreferrer">{item.accession} ↗</a>}</div><strong>{item.metric}</strong><p>{item.evidence}</p></article>)}</div>
   <div className="ic-figure-slots">{FIGURE_SLOTS.map(figure=><figure key={figure.id}>{figure.src?<img src={figure.src} alt={figure.description}/>:<div className="ic-empty-figure"><span aria-hidden="true">▧</span><span>Original figure not attached</span></div>}<figcaption><strong>{figure.title}</strong><p>{figure.description}</p></figcaption></figure>)}</div>
  </aside>}
 </section>;
}
