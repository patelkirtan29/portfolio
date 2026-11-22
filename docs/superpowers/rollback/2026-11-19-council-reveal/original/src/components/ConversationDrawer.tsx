import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
import {ArrowUpRight,Volume2,VolumeX,Mic,Square} from 'lucide-react';
import {proclamation,questions,reply,type ConversationContext,type Focus,type Mode,type Tone} from '../lib/conversation';
import type {Profile} from '../lib/profile';
import type {SpeechControls} from '../lib/useSpeech';
import type {useCouncilMic} from '../lib/useCouncilMic';
import {shouldHoldSpace} from '../lib/summon';
import {buildSessionSummary,isDeepQuestion} from '../lib/sessionSummary';
import CouncilAstrolabe from './CouncilAstrolabe';
import DecreeSheet from './DecreeSheet';
import './drawer.css';
type Turn={id:number;question:string;answer:string;artifactId?:string};
type Props={open:boolean;onClose:()=>void;mode:Mode;tone:Tone;focus:Focus;profile:Profile;speech:SpeechControls;onUnlock:(id:string)=>void;onArtifact:(id:string)=>void;request:{serial:number;artifactId:string}|null;summonRequest:{serial:number;text:string;submit:boolean}|null;mic:ReturnType<typeof useCouncilMic>};
export default function ConversationDrawer({open,onClose,mode,tone,focus,profile,speech,onUnlock,onArtifact,request,summonRequest,mic}:Props){
 const main=useRef<HTMLDivElement>(null);
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLTextAreaElement>(null),priorFocus=useRef<HTMLElement|null>(null);
 const currentOpen=useRef(open);currentOpen.current=open;
 const context=useRef<ConversationContext|undefined>(undefined);
 const handledArtifact=useRef<number|null>(null),handledSummon=useRef<number|null>(null),nextId=useRef(1);
 const [turns,setTurns]=useState<Turn[]>([]),[draft,setDraft]=useState('');
 const draftRef=useRef(draft);draftRef.current=draft;
 const [decreeId,setDecreeId]=useState<string|null>(null);
 const [decrees,setDecrees]=useState<string[]>([]);
 const [raven,setRaven]=useState(false),[copyNotice,setCopyNotice]=useState('');
 const holding=useRef(false);
 const last=turns[turns.length-1];
 const active=last?speech.activeKey===`council-${last.id}`&&speech.speaking:false;
 const decree=profile.projects.find(p=>p.id===decreeId);
 const summary=buildSessionSummary(profile,turns.map(turn=>turn.question),decrees);
 function send(question:string){
  const text=question.trim().slice(0,2000);if(!currentOpen.current||!text)return;
  speech.stop();
  const answer=reply(text,mode,tone,profile,context.current);context.current=answer.context;
  const id=nextId.current++;
  if(answer.unlockId){onUnlock(answer.unlockId);setDecrees(current=>current.includes(answer.unlockId!)?current:[...current,answer.unlockId!]);}
  setTurns(current=>[...current,{id,question:text,answer:answer.text,artifactId:answer.artifactId}]);
  setDraft('');setRaven(false);
  if(answer.artifactId&&isDeepQuestion(text)){setDecreeId(answer.artifactId);}
  else setDecreeId(null);
  if(speech.enabled)speech.speak(answer.text,{key:`council-${id}`,tone});
  input.current?.focus({preventScroll:true});
 }
 useEffect(()=>{
  const node=dialog.current;if(!node)return;
  if(open){priorFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;if(!node.open)node.showModal();input.current?.focus({preventScroll:true});}
  else if(node.open){node.close();priorFocus.current?.focus({preventScroll:true});setRaven(false);}
 },[open]);
 useEffect(()=>{
  if(!open||!request||handledArtifact.current===request.serial)return;
  const artifact=profile.projects.find(p=>p.id===request.artifactId);if(!artifact)return;
  handledArtifact.current=request.serial;send(`Show the deep architecture, proof and lessons for ${artifact.title} (Artifact ${artifact.id.slice(-2)}).`);
 },[open,request,profile]);
 useEffect(()=>{
  if(!open||!summonRequest||handledSummon.current===summonRequest.serial)return;
  handledSummon.current=summonRequest.serial;
  if(summonRequest.submit)send(summonRequest.text);
  else{setDraft(summonRequest.text);requestAnimationFrame(()=>{if(currentOpen.current){const node=input.current;node?.focus({preventScroll:true});node?.setSelectionRange(node.value.length,node.value.length);}});}
 },[open,summonRequest]);
 useEffect(()=>{if(open&&last)main.current?.scrollTo({top:0,behavior:'instant'});},[open,last?.id]);
 const live=useRef({speech,mic});live.current={speech,mic};
 useEffect(()=>{
  if(!open)return;
  const down=(event:KeyboardEvent)=>{
   if(event.code!=='Space'||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
   if(event.target instanceof Element&&event.target.closest('button,a,summary,select,input,[role="button"]'))return;
   const editing=event.target instanceof Element&&!!event.target.closest('input,textarea,[contenteditable="true"]');
   if(!shouldHoldSpace(event,editing,draftRef.current))return;
   event.preventDefault();if(event.repeat||holding.current)return;
   holding.current=true;live.current.speech.stop();live.current.mic.holdStart();
  };
  const up=(event:KeyboardEvent)=>{if(event.code==='Space'&&holding.current){event.preventDefault();holding.current=false;live.current.mic.holdEnd();}};
  const release=()=>{if(holding.current){holding.current=false;live.current.mic.holdEnd();}};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',release);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',release);release();};
 },[open]);
 function submit(event:FormEvent){event.preventDefault();send(draft);}
 async function copy(){try{if(!navigator.clipboard?.writeText)throw new Error('unavailable');await navigator.clipboard.writeText(summary);setCopyNotice('Session summary copied.');}catch{setCopyNotice('Select the note below and copy it.');}}
 const display=last?(active?speech.caption||last.answer:last.answer):proclamation(tone,focus,profile,mode);
 return <dialog ref={dialog} data-lenis-prevent className={`council-hud ${decree?'has-decree':''}`} aria-labelledby="council-title" onCancel={event=>{event.preventDefault();onClose();}}>
 <div className="council-shell"><header className="council-header"><div><p className="council-mono">HERALD / COUNCIL IN SESSION</p><h2 id="council-title">An audience with {profile.name}.</h2></div><div className="council-header-right"><span className="council-mono">{mode.toUpperCase()} · {tone.toUpperCase()}</span><button className="council-text-action" onClick={onClose}>Dismiss <span>ESC ↗</span></button></div></header>
 <div className="council-body"><div className="council-main" ref={main}><div className="council-orbit-stage"><>{open&&<CouncilAstrolabe speaking={speech.speaking} artifactId={last?.artifactId} projects={profile.projects}/>}</><div className="council-orbit-caption council-mono"><span>NEURAL GYROSCOPE / FIG. 01</span><span>{mic.listening?'LISTENING':active?'VOICE RESONANCE ACTIVE':'AWAITING YOUR CURIOSITY'}</span></div></div>
 <section className="council-proclamation" aria-label="Herald proclamation"><p className="council-question">{last?`You asked — ${last.question}`:'Your question opens the conversation.'}</p><p className={`council-answer ${!last?'is-introduction':''}`} aria-live="polite">{display}</p><div className={`council-wave ${active?'is-speaking':''}`} aria-hidden="true">{Array.from({length:42},(_,i)=><i key={i} style={{height:`${8+Math.abs(Math.sin(i*1.53)*Math.cos(i*.21))*28}px`,animationDelay:`${i*-.083}s`}}/>)}</div>
 {last&&<div className="council-evidence"><button className="council-text-action" onClick={()=>active?speech.stop():speech.speak(last.answer,{key:`council-${last.id}`,tone})}>{active?'Interrupt proclamation':'Hear this proclamation'}{active?<Square size={11}/>:<Volume2 size={13}/>}</button>{last.artifactId&&<button className="council-text-action" onClick={()=>onArtifact(last.artifactId!)}>View Artifact {last.artifactId.slice(-2)}<ArrowUpRight size={12}/></button>}</div>}
 </section>
 <div className="council-prompts" aria-label="Suggested questions">{questions(mode,profile).map(q=><button key={q} onClick={()=>send(q)}>{q}<ArrowUpRight size={11}/></button>)}</div>
 {turns.length>0&&<details className="council-history"><summary className="council-mono">SESSION LEDGER / {String(turns.length).padStart(2,'0')} QUESTIONS</summary><ol>{turns.map(turn=><li key={turn.id}><span>{turn.question}</span><p>{turn.answer}</p></li>)}</ol></details>}
 <div className="raven-handoff"><button className="council-text-action" onClick={()=>{setRaven(v=>!v);setCopyNotice('');}}>Dispatch a Raven — Send Session Summary<ArrowUpRight size={13}/></button>{raven&&<section className="raven-note" aria-label="Session summary"><p className="council-mono">A DRAFT FOR YOU TO COPY OR SEND</p><label htmlFor="raven-summary" className="council-sr">Copy-ready session summary</label><textarea id="raven-summary" readOnly value={summary} rows={8} onFocus={event=>event.target.select()}/><div><button className="council-text-action" onClick={copy}>Copy summary<ArrowUpRight size={12}/></button><a className="council-text-action" href={`mailto:?subject=${encodeURIComponent(`Herald — ${profile.name} session`)}&body=${encodeURIComponent(summary)}`}>Open email draft<ArrowUpRight size={12}/></a></div><p role="status" className="council-notice">{copyNotice}</p></section>}</div>
 </div>{decree&&<DecreeSheet artifact={decree} onClose={()=>setDecreeId(null)}/>}</div>
 <footer className="council-command"><form onSubmit={submit}><span className="command-chevron" aria-hidden="true">&gt;</span><label className="council-sr" htmlFor="herald-question">Your question for Herald</label><textarea ref={input} id="herald-question" rows={1} value={draft} maxLength={2000} onChange={event=>setDraft(event.target.value)} placeholder="Speak or type to the Herald…" onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();send(draft);}}}/><span className="council-mono command-enter">↵ ENTER</span></form><div className="council-command-meta"><span className="council-mono">{mic.listening?'LISTENING — RELEASE SPACE TO FINISH':'> HOLD SPACE TO INTERRUPT / SPEAK · ESC TO DISMISS'}</span><div><button className="council-text-action" onClick={()=>speech.setEnabled(!speech.enabled)} aria-pressed={speech.enabled}>{speech.enabled?<Volume2 size={12}/>:<VolumeX size={12}/>}Voice {speech.enabled?'on':'off'}</button><button className="council-text-action" onClick={()=>mic.setAmbient(!mic.ambient)} aria-pressed={mic.ambient}><Mic size={12}/>Wake word {mic.ambient?'on':'off'}</button></div></div><p className="council-notice" role="status">{mic.notice||speech.error||(!mic.supported?'Microphone unavailable. Type a question and press Enter.':'') }</p><p className="council-disclosure council-mono">{profile.isSample?'FICTIONAL SAMPLE PROFILE':'SAVED PROFILE'} · SCRIPTED COUNCIL · MAIL OPENS A DRAFT, NEVER SENDS AUTOMATICALLY</p></footer></div>
 </dialog>;
}
