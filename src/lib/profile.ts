import type { Mode } from './conversation';
import {portfolioProfile} from './portfolioData';
import {interactivePortfolioProfile} from './interactivePortfolio';
import {previousPortfolioProfile} from './previousPortfolio';
import {canonical,isUntouchedLegacySample,legacySampleProfile} from './legacyProfile';
export type EvidenceLink = {label:string;url:string};
export type ProjectConcept = {title:string;body:string};
export type Artifact = { id: string; title: string; year: string; category: string; metric: string; summary: string; problem: string; architecture: string; outcomes: string; stack: string[]; lesson: string; links?:EvidenceLink[];status?:string;concepts?:ProjectConcept[] };
export type CareerEntry = { id: string; role: string; company: string; years: string; outcome: string };
export type Profile = { version: 1; name: string; role: string; location: string; availability: string; bio: string; pitches: Record<Mode, string>; capabilities: string[]; heroSubtitle?: string; familiarSkills?: string[]; researchInterests?: string[]; projects: Artifact[]; career: CareerEntry[]; isSample: boolean;contacts?:{email?:string;linkedin?:string;github?:string} };
type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const defaultProfile: Profile = portfolioProfile;
const key = 'herald-profile-v2';
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const string = (v: unknown, max = 10000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const httpsUrl=(v:unknown):v is string=>{if(!string(v,2048))return false;try{const u=new URL(v);return u.protocol==='https:'&&!!u.hostname&&!u.username&&!u.password;}catch{return false;}};
const email=(v:unknown):v is string=>string(v,254)&&/^[^\s@<>"?&]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const strings = (v: unknown, maxItems: number) => Array.isArray(v) && v.length > 0 && v.length <= maxItems && v.every(item => string(item, 200));
export function validateProfile(value: unknown): Profile | null {
  if (!record(value) || value.version !== 1 || typeof value.isSample !== 'boolean') return null;
  if (!['name', 'role', 'location', 'availability', 'bio'].every(field => string(value[field], field === 'bio' ? 10000 : 1000))) return null;
  if (!record(value.pitches) || !['Recruiter', 'Engineer', 'Collaborator', 'Curious'].every(mode => string((value.pitches as Record<string, unknown>)[mode], 3000))) return null;
  if (!strings(value.capabilities, 30) || !Array.isArray(value.projects) || value.projects.length < 4 || value.projects.length > 12) return null;
  if (value.heroSubtitle !== undefined && !string(value.heroSubtitle, 3000)) return null;
  for (const field of ['familiarSkills', 'researchInterests']) {
    const items = value[field];
    if (items !== undefined && (!Array.isArray(items) || items.length > 30 || items.some(item => !string(item, 200)))) return null;
  }
  if(value.contacts!==undefined){if(!record(value.contacts))return null;const c=value.contacts;if(c.email!==undefined&&c.email!==''&&!email(c.email))return null;if(['linkedin','github'].some(k=>c[k]!==undefined&&c[k]!==''&&!httpsUrl(c[k])))return null;}
  const ids = new Set<string>();
  for (const item of value.projects) {
    if (!record(item) || !/^artifact-(0[1-9]|1[0-2])$/.test(item.id as string) || ids.has(item.id as string)) return null;
    if (!['title', 'year', 'category', 'metric', 'summary', 'problem', 'architecture', 'outcomes', 'lesson'].every(field => string(item[field], ['title', 'year', 'category', 'metric'].includes(field) ? 1000 : 10000)) || !strings(item.stack, 30)) return null;
    if(item.concepts!==undefined&&(!Array.isArray(item.concepts)||item.concepts.length>12||item.concepts.some(concept=>!record(concept)||!string(concept.title,200)||!string(concept.body,12000))))return null;
    if(item.status!==undefined&&!string(item.status,150))return null;
    if(item.links!==undefined&&(!Array.isArray(item.links)||item.links.length>5||item.links.some(link=>!record(link)||!string(link.label,100)||!httpsUrl(link.url))))return null;
    ids.add(item.id as string);
  }
  if (!Array.isArray(value.career) || value.career.length < 1 || value.career.length > 30) return null;
  const careerIds = new Set<string>();
  for (const item of value.career) {
    if (!record(item) || !['id', 'role', 'company', 'years', 'outcome'].every(field => string(item[field], field === 'outcome' ? 10000 : 1000)) || careerIds.has(item.id as string)) return null;
    careerIds.add(item.id as string);
  }
  // Copy only the schema: storage never introduces arbitrary object properties.
  return {
    version: 1, name: value.name as string, role: value.role as string, location: value.location as string, availability: value.availability as string, bio: value.bio as string,
    isSample: value.isSample, pitches: Object.fromEntries(['Recruiter', 'Engineer', 'Collaborator', 'Curious'].map(mode => [mode, (value.pitches as Record<string, string>)[mode]])) as Profile['pitches'],
    capabilities: [...value.capabilities as string[]],
    ...(value.heroSubtitle !== undefined ? { heroSubtitle: value.heroSubtitle as string } : {}),
    ...(value.familiarSkills !== undefined ? { familiarSkills: [...value.familiarSkills as string[]] } : {}),
    ...(value.researchInterests !== undefined ? { researchInterests: [...value.researchInterests as string[]] } : {}),
    ...(value.contacts?{contacts:Object.fromEntries(Object.entries(value.contacts as Record<string,string>).filter(([k,v])=>['email','linkedin','github'].includes(k)&&!!v))}:{}),
    projects: value.projects.map(item => ({...Object.fromEntries(['id', 'title', 'year', 'category', 'metric', 'summary', 'problem', 'architecture', 'outcomes', 'lesson', 'stack'].map(field => [field, field === 'stack' ? [...item.stack] : item[field]])),...(item.concepts!==undefined?{concepts:item.concepts.map((concept:ProjectConcept)=>({title:concept.title,body:concept.body}))}:{}),...(item.status?{status:item.status}:{}),...(item.links?{links:item.links.map((link:EvidenceLink)=>({label:link.label,url:link.url}))}:{})}) as Artifact),
    career: value.career.map(item => ({ id: item.id, role: item.role, company: item.company, years: item.years, outcome: item.outcome })),
  };
}
function browserStorage(): ProfileStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
export function loadProfile(storage: ProfileStorage | null = browserStorage()): { profile: Profile; notice?: string } {
  const fallback = () => validateProfile(defaultProfile)!;
  try {
    if (!storage) return { profile: fallback(), notice: 'Browser storage is unavailable. Changes will last for this session only.' };
    const raw = storage.getItem(key);
    if (raw === null) return { profile: fallback() };
    const profile = raw.length <= 300000 ? validateProfile(JSON.parse(raw)) : null;
    if (profile) {
      const legacy=isUntouchedLegacySample(profile)||canonical(profile)===canonical(previousPortfolioProfile)||canonical(profile)===canonical(interactivePortfolioProfile);
      if(legacy){const updated=fallback();try{storage.setItem(key,JSON.stringify(updated));}catch{}return{profile:updated};}
      return { profile };
    }
  } catch { /* Corrupt JSON or blocked storage must not prevent startup. */ }
  return { profile: fallback(), notice: 'Saved identity could not be loaded. Showing the current portfolio.' };
}
export function persistProfile(profile: Profile, storage: ProfileStorage | null = browserStorage()): { ok: boolean; message: string } {
  const valid = validateProfile(profile);
  if (!valid) return { ok: false, message: 'Check all identity fields and the distinct artifact IDs. Text and list lengths are limited.' };
  try {
    const raw = JSON.stringify(valid);
    if (raw.length > 300000) return { ok: false, message: 'This identity exceeds the storage size limit.' };
    if (storage) { storage.setItem(key, raw); return { ok: true, message: 'Identity saved in this browser.' }; }
  } catch { /* Storage quota and privacy restrictions are recoverable. */ }
  return { ok: false, message: 'Browser storage is unavailable. Your identity remains active for this session.' };
}

/** Detect retired sample projects without discarding customized records automatically. */
export function hasLegacyDemoProjects(profile:Profile):boolean{
 return profile.projects.length===4&&legacySampleProfile.projects.every(seed=>profile.projects.some(project=>project.id===seed.id&&project.title===seed.title&&project.summary===seed.summary));
}
/** Explicit recovery preserves the previous saved record before replacing it. */
export function restorePublishedProfile(storage:ProfileStorage|null=browserStorage()):{profile?:Profile;message:string}{
 const profile=validateProfile(defaultProfile)!;
 try{
  if(storage){const raw=storage.getItem(key);if(raw){let current:unknown;try{current=JSON.parse(raw);}catch{current=null;}if(canonical(current)!==canonical(profile))storage.setItem('herald-profile-backup-before-refresh',raw);}
   storage.setItem(key,JSON.stringify(profile));
  }
  return{profile,message:storage?'Latest Kirtan portfolio loaded. The previous saved identity was backed up.':'Latest portfolio loaded for this session; browser storage is unavailable.'};
 }catch{return{message:'Could not back up the saved identity, so it was left unchanged. Allow browser storage and try again.'};}
}
