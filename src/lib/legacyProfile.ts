import type {Profile} from './profile';
/** Exact original seed, retained solely to migrate untouched demo profiles without erasing owner edits. */
export const legacySampleProfile:Profile={
 version:1,name:'Alex Morgan',role:'Product-minded engineer & designer',location:'Brooklyn, New York (fictional)',availability:'Fictional sample identity; no real hiring or contact availability.',isSample:true,
 bio:'A fictional builder exploring the space between thoughtful systems and human needs. Clear writing, accessible interfaces and small teams guide this sample portfolio.',
 pitches:{Recruiter:'Explore ownership, delivery and the outcomes behind four fictional projects.',Engineer:'Examine architecture, constraints and explicit technical trade-offs.',Collaborator:'Start with a shared question, then build the smallest useful answer.',Curious:'Follow the stories behind the work and the lessons each prototype revealed.'},
 capabilities:['TypeScript systems','Accessible interaction design','Product research','Technical leadership'],
 projects:[
 {id:'artifact-01',title:'Atlas',year:'2025',category:'Customer insight platform',metric:'12-week sample release',summary:'A fictional workspace connecting customer feedback to product decisions.',problem:'Small teams collected feedback but lacked shared evidence for decisions.',architecture:'React and TypeScript interface, modular Node.js service, PostgreSQL source of truth, Redis cache and queued imports.',outcomes:'A fictional four-person team shipped a working release in twelve weeks.',stack:['React','TypeScript','Node.js','PostgreSQL','Redis'],lesson:'A shared deployment simplified operations but limited independent scaling. Split services only when measured load warrants the extra complexity.'},
 {id:'artifact-02',title:'Common Ground',year:'2024',category:'Accessible civic design',metric:'3 research rounds (sample)',summary:'A fictional neighborhood service directory built around inclusive navigation.',problem:'Residents struggled to navigate fragmented public-service information.',architecture:'An accessible semantic HTML interface with TypeScript search and a static content pipeline.',outcomes:'Three fictional research rounds produced clearer labels and keyboard-accessible journeys.',stack:['TypeScript','HTML','CSS','Static content'],lesson:'Static delivery reduced operating complexity but required an editorial publish step. Research favored clear language over dense filtering.'},
 {id:'artifact-03',title:'Relay',year:'2023',category:'Engineering observability',metric:'Replayable events (sample)',summary:'A fictional event delivery console for diagnosing failed integrations.',problem:'Integration failures were difficult to trace across background jobs.',architecture:'A Go ingestion service, PostgreSQL event log and a React replay console with idempotency keys.',outcomes:'The sample console made delivery history and retries visible in one workflow.',stack:['Go','PostgreSQL','React'],lesson:'An append-only event log improved traceability but increased storage. Replay required idempotent consumers to avoid duplicate effects.'},
 {id:'artifact-04',title:'Field Notes',year:'2022',category:'Research workflow design',metric:'Offline-first prototype',summary:'A fictional field research notebook for unreliable connections.',problem:'Researchers needed to capture evidence while working offline.',architecture:'A local-first TypeScript application using IndexedDB with explicit synchronization and visible conflict review.',outcomes:'The sample prototype supported offline capture and a reviewable synchronization flow.',stack:['TypeScript','IndexedDB','Web APIs'],lesson:'Offline capture protected field work but introduced conflict handling. Explicit review favored researcher control over invisible automatic merging.'}
 ],
 career:[
 {id:'career-01',role:'Product engineer',company:'Northstar Studio (fictional)',years:'2024–2025',outcome:'Led the Atlas sample release and paired engineering with product research.'},
 {id:'career-02',role:'Design engineer',company:'Civic Workshop (fictional)',years:'2022–2024',outcome:'Explored accessible service navigation and event delivery tools.'},
 {id:'career-03',role:'Frontend engineer',company:'Fieldwork Lab (fictional)',years:'2020–2022',outcome:'Prototyped offline research workflows and reusable interface foundations.'}
 ]
};
export function canonical(value:unknown):string{
 if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
 if(value&&typeof value==='object'){const record=value as Record<string,unknown>;return `{${Object.keys(record).sort().map(key=>`${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;}
 return JSON.stringify(value)??'undefined';
}
const signature=canonical(legacySampleProfile);
export function isUntouchedLegacySample(profile:Profile):boolean{return profile.name==='Alex Morgan'&&canonical({...profile,isSample:true})===signature;}
