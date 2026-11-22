# V2 integration contracts (parent-set)

Root staging: /Users/kirtan/Documents/Codex/2026-11-18/mak/work/herald

## Domain: lib/profile.ts
Mode = 'Recruiter'|'Engineer'|'Collaborator'|'Curious'; Tone = 'Measured & Regal'|'Sharp & Technical'|'Warm & Candid'; Focus='Engineering'|'Product & Design'|'Leadership'. Types exported from conversation.ts (profile.ts can declare Mode locally or type-import).
Artifact {id:string;title:string;year:string;category:string;metric:string;summary:string;problem:string;architecture:string;outcomes:string;stack:string[];lesson:string}
CareerEntry {id:string;role:string;company:string;years:string;outcome:string}
Profile {version:1;name:string;role:string;location:string;availability:string;bio:string;pitches:Record<Mode,string>;capabilities:string[];projects:Artifact[];career:CareerEntry[];isSample:boolean}
Exports defaultProfile:Profile, validateProfile(value:unknown):Profile|null, loadProfile():{profile:Profile;notice?:string}, persistProfile(profile:Profile):{ok:boolean;message:string}. Storage key herald-profile-v2. Exactly four artifacts; stable IDs artifact-01..04; nonempty name/title etc, bounded user strings. Guard missing global localStorage in tests via dependency argument optional.

## Domain: lib/conversation.ts
Export modes:Mode[], tones:Tone[], focuses:Focus[].
ConversationContext {topic:string;artifactId?:string}
Answer {text:string;context:ConversationContext;artifactId?:string;unlockId?:string}
reply(question:string,mode:Mode,tone:Tone,profile:Profile,context?:ConversationContext):Answer
proclamation(tone:Tone,focus:Focus,profile:Profile,mode?:Mode):string
questions(mode:Mode,profile:Profile):string[]
Artifact query returns evidence artifactId and unlockId for that artifact. Follow-ups retain context. All facts current profile, never hardcoded Alex.

## Shared speech (parent-owned): lib/useSpeech.ts
export type SpeechControls={supported:boolean;enabled:boolean;setEnabled:(v:boolean)=>void;speaking:boolean;activeKey:string|null;caption:string;speak:(text:string,options?:{key?:string;tone?:Tone})=>void;stop:()=>void;error:string}
export function useSpeech():SpeechControls. Global one instance at App root, passed to child components. speaking follows actual utterance start/end/error; callback identity prevents stale state. Explicit speak works when automatic enabled=false; setting enabled=false stops current utterance. Caption boundary based, full text fallback.

## Modals (helper-owned)
ArtifactModal default export props {artifact:Artifact|null;unlocked:boolean;onClose:()=>void;onUnlock:(id:string)=>void;speech:SpeechControls;onAsk:(id:string)=>void}. Open whenever artifact not null. 'Unlock via Herald' calls onUnlock(id) (parent handoff closes exhibition, opens chat with preloaded question). onAsk asks about project similarly. Notes reflect unlocked prop; narration uses speech.speak(...,{key:artifact.id}).
IdentityEditor default export props {open:boolean;profile:Profile;onClose:()=>void;onSave:(next:Profile)=>{ok:boolean;message:string}}. Editor initialized fresh from profile per opening. Parent onSave updates live profile even if persistence fails; editor shows returned status and does not auto-close on failure. All identity/pitches/artifact fields editable, career/capabilities too. No nested modals.
Both use native dialog and data-lenis-prevent, Escape/backdrop/focus-restoration, own scroll lock fallback, CSS grayscale variables, imported exhibition.css. Parent CSS vars --paper --surface --ink --muted --line --accent (accent same as ink), --serif --mono. Parent root handles Lenis stop when any modal open.

## Graphics (helper-owned)
AcousticField({speaking?:boolean,scrollProgress?:number}):JSX; Crest({small?:boolean,speaking?:boolean}):JSX; WireSphere({speaking?:boolean}):JSX.
Existing lifecycle tests retained. Grayscale, theme reactive, reduced-motion, dpr<=2, spring-damped pointer, context-loss CSS fallback.

## Conversation chamber (new integration)
ConversationDrawer default export props {open:boolean;onClose:()=>void;mode:Mode;tone:Tone;focus:Focus;profile:Profile;speech:SpeechControls;onUnlock:(id:string)=>void;onArtifact:(id:string)=>void;request:{serial:number;artifactId:string}|null}. Remains mounted. Request on open sends a deterministic current artifact question once per serial; reply unlock callback on answer.unlockId; evidence button onArtifact. Parent handles profile reset via key, global body lock and Lenis; do NOT own body overflow. Preserve native dialog focus trap/backdrop/Escape and data-lenis-prevent. Speech shared, not raw speechSynthesis. Use current Profile facts and questions(mode,profile). Ring, captions, chips, microphone recognition fallback. onUnlock marks vault state only (does not navigate); onArtifact transitions to exhibition.
