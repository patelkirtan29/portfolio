import type { Artifact, Profile, EvidenceLink } from './profile';
export type Mode = 'Recruiter' | 'Engineer' | 'Collaborator' | 'Curious';
export type Tone = 'Measured & Regal' | 'Sharp & Technical' | 'Warm & Candid';
export type Focus = 'Engineering' | 'Product & Design' | 'Leadership';
export type ConversationContext = { topic: string; artifactId?: string };
export type Answer = { text: string; context: ConversationContext; artifactId?: string; unlockId?: string;sources?:EvidenceLink[] };
export const lensLabels: Record<Mode,string> = {Recruiter:'Recruiter',Engineer:'ML Engineer',Collaborator:'Systems & Bio',Curious:'Curious'};
export const modes: Mode[] = ['Recruiter', 'Engineer', 'Collaborator', 'Curious'];
export const tones: Tone[] = ['Measured & Regal', 'Sharp & Technical', 'Warm & Candid'];
export const focuses: Focus[] = ['Engineering', 'Product & Design', 'Leadership'];
const normalize = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (s: string) => normalize(s).split(' ').filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'about', 'project', 'artifact', 'tell', 'what', 'your', 'this', 'that'].includes(w));
const technical = /\b(stack|architect\w*|database|technical|systems?|code|latency|trade\s*offs?|tradeoffs?)\b/;
const deeper = /\b(why|trade\s*offs?|tradeoffs?|choice|lesson|lessons|learn\w*|fail\w*|vault|notes|deeper|more|expand)\b/;
function matchingConcept(q:string,artifact:Artifact){return artifact.concepts?.map(section=>({section,score:words(section.title).filter(word=>!['architecture','system','concept','concepts','design','overview','mechanism'].includes(word)&&words(q).includes(word)).length})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score)[0]?.section;}
function matchingProject(q: string, profile: Profile): Artifact | undefined {
  const explicit = q.match(/\bartifact\s*(\d{1,2})\b/);
  if (explicit) return profile.projects.find(a => a.id === `artifact-${String(Number(explicit[1])).padStart(2,'0')}`);
  const complete = profile.projects.filter(a => ` ${q} `.includes(` ${normalize(a.title)} `));
  if (complete.length === 1) return complete[0];
  const queryWords = new Set(words(q));
  const scored = profile.projects.map(project => {
    const titleWords = [...new Set(words(project.title))];
    const matches = titleWords.filter(w => queryWords.has(w)).length;
    return { project, score: matches >= Math.min(2, titleWords.length) && matches > 0 ? matches / titleWords.length : 0 };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 && scored[0].score > (scored[1]?.score ?? 0) ? scored[0].project : undefined;
}
const cadence = (text: string, tone: Tone) => tone === 'Warm & Candid' ? `Happy to. ${text}` : tone === 'Measured & Regal' ? `Certainly. ${text}` : text;
export function proclamation(tone: Tone, focus: Focus, profile: Profile, mode: Mode = 'Curious'): string {
  const subject = { Engineering: 'architecture and technical decisions', 'Product & Design': 'problems, interfaces and outcomes', Leadership: 'career, capabilities and delivery' }[focus];
  const opening = tone === 'Warm & Candid' ? `Hi, I’m ${profile.name}’s Herald.` : tone === 'Sharp & Technical' ? `Meet ${profile.name}.` : `Allow me to introduce ${profile.name}.`;
  return `${opening} ${profile.role}. ${profile.pitches[mode]} We can explore ${subject}.${profile.isSample ? ' This is a fictional sample profile.' : ''}`;
}
export function questions(mode: Mode, profile: Profile): string[] {
  const names = profile.projects.map(a => a.title);
  if (mode === 'Engineer') return [`Walk me through ${names[0]} architecture`, `What were the trade-offs in ${names[1]}?`, `Explain ${names[2]}`];
  if (mode === 'Recruiter') return [`What outcomes came from ${names[0]}?`, 'Tell me about your career', 'Are you open to new roles?'];
  if (mode === 'Collaborator') return [`What problem does ${names[1]} solve?`, `Tell me about ${names[3]}`, 'What are your capabilities?'];
  return ['What’s your story?', `Tell me about ${names[2]}`, `What did ${names[3]} teach you?`];
}
export function reply(question: string, mode: Mode, tone: Tone, profile: Profile, context?: ConversationContext): Answer {
  const q = normalize(question);
  const direct = matchingProject(q, profile);
  const followup = /^(why|how so|tell me more|more|go on|explain further|can you expand|what about that)$/.test(q) || /\b(choice|decision|approach|trade\s*offs?|tradeoffs?|lesson|lessons|vault|notes|deeper|expand)\b/.test(q) || technical.test(q);
  const reference = q.match(/\bartifact\s*(\d+)\b/);
  const invalidReference = Boolean(reference && !profile.projects.some(p=>p.id===`artifact-${String(Number(reference[1])).padStart(2,'0')}`));
  const ownerTopic = /\b(career|leadership|lead|team|mentor|experience|capabilities|skills|research|interests|exploring|familiar|available|availability|roles|hiring|contact|salary|bio|story|background|yourself|who|based|location)\b/.test(q);
  const contextualProject=context?.artifactId?profile.projects.find(project=>project.id===context.artifactId):undefined;
  const conceptFollowup=!!contextualProject&&!!matchingConcept(q,contextualProject);
  const artifact = invalidReference ? undefined : direct ?? (!ownerTopic && (followup||conceptFollowup) && context?.artifactId ? profile.projects.find(a => a.id === context.artifactId) : undefined);
  const sample = profile.isSample ? 'Fictional sample project. ' : '';
  if (artifact) {
    const isTechnical = technical.test(q);
    const concept=matchingConcept(q,artifact);
    let detail: string;
    if (/\b(github|repo|repository|source|links?)\b/.test(q)) detail=artifact.links?.length?`Source links: ${artifact.links.map(link=>`${link.label}: ${link.url}`).join(' · ')}`:'No public repository or source link is supplied for this project yet.';
    else if (concept) detail=`${concept.title}: ${concept.body}`;
    else if (/\b(concepts?|detailed|in detail)\b/.test(q)&&artifact.concepts?.length) detail=`${artifact.architecture} Detailed concepts: ${artifact.concepts.map(section=>`${section.title}: ${section.body.split(/(?<=[.!?])\s/)[0]}`).join(' ')} Ask about any of these concepts for the full explanation.`;
    else if (/\b(accuracy|metrics?|f1|scores?|benchmarks?|results?|evaluation|speedups?|throughput|performance)\b/.test(q)) detail=`${artifact.summary} Results: ${artifact.outcomes}`;
    else if (deeper.test(q)) detail = `${artifact.architecture} Deep notes: ${artifact.lesson}`;
    else if (isTechnical || mode === 'Engineer') detail = `${artifact.summary} Architecture: ${artifact.architecture} Stack: ${artifact.stack.join(', ')}.`;
    else if (mode === 'Recruiter' || /\b(outcomes?|impact|results?)\b/.test(q)) detail = `${artifact.summary} Outcomes: ${artifact.outcomes}`;
    else if (mode === 'Collaborator' || /\b(problem|design)\b/.test(q)) detail = `Problem: ${artifact.problem} ${artifact.summary} Outcomes: ${artifact.outcomes}`;
    else detail = `${artifact.summary} ${artifact.problem} Lesson: ${artifact.lesson}`;
    return { text: cadence(`${sample}${artifact.title}.${artifact.status?` ${artifact.status}.`: ""} ${detail}`, tone), context: { topic: isTechnical ? 'architecture' : 'artifact', artifactId: artifact.id }, artifactId: artifact.id, unlockId: artifact.id, sources:artifact.links?.map(link=>({...link})) };
  }
  let topic = 'unknown';
  let text = 'I don’t have that information in the saved profile. I can discuss the current projects, career, bio, capabilities or availability. Please name a project or ask about one of those topics.';
  if (/\b(research|interests|exploring|explore next|ideas)\b/.test(q)) {
    topic='research';text=`${profile.name}. Exploring next — ideas and research interests: ${profile.researchInterests?.length?profile.researchInterests.join('; '):'No research interests are supplied in this saved profile.'} These are interests, separate from completed projects.`;
  } else if (/\b(skills|capabilities|familiar|toolkit|cuda|cudnn|tensorrt)\b/.test(q)) {
    topic='skills';text=`${profile.name}. Project-proven capabilities: ${profile.capabilities.join('; ')}.${profile.familiarSkills?.length?` Also familiar with: ${profile.familiarSkills.join('; ')}. Familiarity is separate from demonstrated project experience.`:''}`;
  } else if (/\b(contact|email|linkedin|github|reach)\b/.test(q)) {
    topic='contact';const c=profile.contacts;const supplied=[c?.email&&`Email: ${c.email}`,c?.linkedin&&`LinkedIn: ${c.linkedin}`,c?.github&&`GitHub: ${c.github}`].filter(Boolean);text=`${profile.name}. ${supplied.length?supplied.join(' · '):'I don’t have contact details in this saved profile.'}`;
  } else if (/\b(available|availability|roles?|hiring|salary|open to)\b/.test(q)) {
    topic = 'availability'; text = `${profile.name}. ${profile.availability} Location: ${profile.location}.`;
    if (/\b(salary|contact)\b/.test(q)) text += ' I don’t have additional salary or contact details beyond this saved availability.';
  } else if (/\b(career|leadership|lead|team|mentor|experience|capabilities|skills)\b/.test(q)) {
    topic = 'career'; text = `${profile.name}. ${profile.career.map(entry => `${entry.years}: ${entry.role}, ${entry.company}. ${entry.outcome}`).join(' ')} Capabilities: ${profile.capabilities.join(', ')}.`;
  } else if (/\b(bio|story|background|yourself|who|based|location|hello|hi|values|philosophy)\b/.test(q)) {
    topic = 'bio'; text = `${profile.name}. ${profile.role}. ${profile.bio} Location: ${profile.location}.`;
  } else if (technical.test(q) || /\b(projects?|proud|build together)\b/.test(q)) {
    topic = technical.test(q) ? 'architecture' : 'artifact'; text = `Which project would you like to explore? ${profile.projects.map(a => `${a.id.replace('artifact-', 'Artifact ')}: ${a.title}`).join('; ')}.`;
  } else if (followup && context && ['bio', 'career', 'availability', 'contact', 'skills', 'research'].includes(context.topic)) {
    return reply(context.topic, mode, tone, profile);
  }
  return { text: topic === 'unknown' ? text : cadence(`${profile.isSample ? 'Fictional sample profile. ' : ''}${text}`, tone), context: { topic } };
}
