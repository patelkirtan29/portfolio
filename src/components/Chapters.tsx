import {useLayoutEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {Profile} from '../lib/profile';
import type {Mode} from '../lib/conversation';
import {chapterInset} from '../lib/chapterProgress';
gsap.registerPlugin(ScrollTrigger);
// Chapter prose is projected from the editable evidence, independently of the visitor lens.
export function storyChapters(profile: Profile) {
 const career = (company: RegExp, fallback: number) => profile.career.find(entry => company.test(entry.company)) || profile.career[fallback];
 const production = career(/Shaligram/i, 1), education = career(/Washington/i, 0);
 const project = (id: string) => profile.projects.find(item => item.id === id);
 const immuno = project('artifact-01'), rag = project('artifact-02'), sibyl = project('artifact-03'), faers = project('artifact-04'), go = project('artifact-05');
 const evidence = (items: typeof profile.projects) => items.map(item => `${item.title}: ${item.metric}.`).join(' ');
 return [
  {mode:'Recruiter' as Mode,label:production ? `${production.company} · ${production.years}` : profile.role,title:'Production\nroots.',index:'PRODUCTION ROOTS',art:'impact',short:'ROOTS',excerpt:production?.outcome || profile.bio},
  {mode:'Engineer' as Mode,label:education ? `${education.company} · ${education.years}` : profile.role,title:'Distributed &\nML systems.',index:'DISTRIBUTED & ML SYSTEMS',art:'systems',short:'SYSTEMS',excerpt:[education?.outcome.match(/[^.!?]+[.!?]/)?.[0] || education?.outcome, evidence([rag,go,sibyl].filter((item): item is NonNullable<typeof item> => !!item))].filter(Boolean).join(' ')},
  {mode:'Collaborator' as Mode,label:'Course research · data systems · future questions',title:'ML for healthcare\n& biology.',index:'HEALTHCARE & BIOLOGY',art:'collaboration',short:'BIOLOGY',excerpt:[immuno ? `${immuno.title}: ${immuno.metric}. ${immuno.summary}` : '',faers ? `${faers.title}: ${faers.metric}.` : '',profile.researchInterests?.[0] ? `Exploring next: ${profile.researchInterests[0]}.` : ''].filter(Boolean).join(' ') || profile.bio},
  {mode:'Curious' as Mode,label:profile.name,title:'What’s\nnext.',index:'WHAT’S NEXT',art:'human',short:'NEXT',excerpt:profile.availability},
 ];
}
export default function Chapters({profile,onLens,onNavigate}:{profile:Profile;onLens:(mode:Mode)=>void;onNavigate:(top:number)=>void}){
 const root=useRef<HTMLElement>(null),trigger=useRef<ScrollTrigger|null>(null);
 const chapters=storyChapters(profile);
 const [active,setActive]=useState(0);
 useLayoutEffect(()=>{
  const mm=gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)',()=>{
   const scenes=Array.from(root.current!.querySelectorAll<HTMLElement>('.chapter'));
   scenes.forEach((el,i)=>{gsap.set(el,{zIndex:i+1,clipPath:i?'inset(0 0 0 100%)':'inset(0 0 0 0)'});});
   const timeline=gsap.timeline({scrollTrigger:{trigger:root.current,start:'top top',end:()=>`+=${innerHeight*3.2}`,pin:true,scrub:.7,invalidateOnRefresh:true,onUpdate:self=>{scenes.forEach((el,index)=>{el.style.clipPath=`inset(0% 0% 0% ${chapterInset(self.progress,index)}%)`;});setActive(Math.min(3,Math.round(self.progress*3)));root.current?.style.setProperty('--reading',String(self.progress));}}});
   scenes.slice(1).forEach((el,i)=>{
    timeline.fromTo(el.querySelector('.chapter-content'),{y:40,filter:'blur(6px)',opacity:.15},{y:0,filter:'blur(0px)',opacity:1,ease:'power2.out',duration:.8},i+.05)
    .to(scenes[i].querySelector('.chapter-content'),{filter:'blur(4px)',opacity:.4,duration:.8},i+.1)
    .fromTo(el.querySelector('.documentary-art'),{y:65,scale:1.15},{y:-25,scale:1,ease:'none',duration:1},i);
   });
   trigger.current=timeline.scrollTrigger!;
   return()=>{trigger.current=null;};
  });
  return()=>mm.revert();
 },[]);
 function jump(index:number){setActive(index);onLens(chapters[index].mode);const st=trigger.current;if(st)onNavigate(st.start+(st.end-st.start)*index/3);else document.getElementById(`chapter-${index}`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
 return <section className="chapters" id="chapters" ref={root} aria-label="Four chapters of the career story"><div className="chapter-top mono"><span>01 — CHAPTERS</span><span>ONE STORY. FOUR CHAPTERS.</span></div><div className="chapter-stage">{chapters.map((c,i)=><article className={`chapter chapter-${c.art}`} id={`chapter-${i}`} key={c.mode}><div className={`documentary-art art-${c.art}`} aria-hidden="true"><div className="architecture-grid"/>{Array.from({length:9},(_,n)=><i key={n} style={{'--n':n} as React.CSSProperties}/>)}<span className="art-coordinate">{[profile.location.toUpperCase(),'STATE → EVENT → SYSTEM','OBSERVE / MAKE / LEARN','A STUDY IN CONTINUITY'][i]}</span></div><div className="chapter-scrim"/><div className="chapter-content"><p className="mono chapter-index">0{i+1} / {c.index}</p><p className="chapter-audience">{c.label}</p><h2>{c.title.split('\n').map((line,n)=><span key={line}>{n>0&&<br/>}{line}</span>)}</h2><p className="chapter-excerpt">{c.excerpt}</p></div></article>)}</div><div className="reading-line" aria-hidden="true"><i/></div><div className="chapter-controls"><span className="mono">0{active+1} <span>/ 04</span></span><div>{chapters.map((c,i)=><button key={c.mode} onClick={()=>jump(i)} aria-label={`Jump to ${c.index.toLowerCase()}`} aria-pressed={active===i}><i/><span className="mono">{c.short}</span></button>)}</div></div></section>;
}
