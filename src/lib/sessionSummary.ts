import type { Profile } from './profile';

/** A local, copy-ready record. This function never sends or adds inferred facts. */
export function buildSessionSummary(profile: Profile, questions: string[], unlockedIds: string[], answers: string[] = []): string {
  const recorded = questions.map(question => question.trim()).filter(Boolean);
  const unlocked = new Set(unlockedIds);
  const lessons = profile.projects.filter(project => unlocked.has(project.id));
  return [
    `COUNCIL DISPATCH — ${profile.name}`,
    profile.isSample ? 'Fictional sample profile.' : '',
    '', 'PROJECT INDEX',
    ...profile.projects.map((project, index) => `${String(index + 1).padStart(2, '0')} · ${project.title}`),
    '', 'QUESTIONS',
    ...(recorded.length ? recorded.map((question, index) => `${index + 1}. ${question}${answers[index]?.trim()?`\nHerald: ${answers[index].trim()}`:''}`) : ['No questions recorded.']),
    '', 'UNLOCKED PROJECT LESSONS',
    ...(lessons.length ? lessons.map(project => `${project.title}${project.status?` — ${project.status}`:''}\n${project.lesson}${project.links?.length?`\n${project.links.map(link=>`${link.label}: ${link.url}`).join('\n')}`:''}`) : ['No project lessons unlocked.']),
  ].join('\n');
}

export function isDeepQuestion(text: string): boolean {
  return /\b(?:architectur(?:e|al)|technical|concepts?|detailed|implementation|database|stack|systems?\s+flow|deep|proof|trade[\s-]?offs?|lessons?|vault)\b/i.test(text);
}
