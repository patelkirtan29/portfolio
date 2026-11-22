import { describe, it, expect } from 'vitest';
import { reply, proclamation, questions } from './conversation';
import { defaultProfile } from './profile';
const edited = () => {
  const p = structuredClone(defaultProfile);
  p.name = 'Sam Lee'; p.bio = 'Builds accessible tools for libraries.'; p.location = 'Portland'; p.availability = 'Open to part-time library partnerships.';
  p.pitches.Engineer = 'Interfaces that respect readers.';
  p.projects[1] = { ...p.projects[1], title: 'Library Signal Workbench', summary: 'A catalog correction workspace.', architecture: 'A Rust service and SQLite.', outcomes: 'Reduced duplicate catalog entries.', lesson: 'SQLite simplified deployment but limited concurrent writes.', problem: 'Catalog corrections were scattered.', stack: ['Rust', 'SQLite'] };
  p.career = [{ id: 'career-1', role: 'Staff engineer', company: 'Library Lab', years: '2025–present', outcome: 'Created an accessible catalog.' }];
  return p;
};
describe('profile grounded conversation', () => {
  it('recognizes a renamed project and returns only its evidence and unlock ID', () => {
    const a = reply('Explain Library Signal Workbench', 'Engineer', 'Sharp & Technical', edited());
    expect(a.artifactId).toBe('artifact-02'); expect(a.unlockId).toBe('artifact-02'); expect(a.text).toContain('Rust');
  });
  it.each(['Tell me about Artifact 02 architecture', 'Tell me about library workbench'])('recognizes identifier or meaningful title overlap: %s', q => {
    expect(reply(q, 'Engineer', 'Measured & Regal', edited()).artifactId).toBe('artifact-02');
  });
  it('explicit artifact numbers outrank other project names and generic architecture', () => {
    const a = reply(`Compare ${defaultProfile.projects[0].title}: tell me Artifact 04 architecture`, 'Engineer', 'Sharp & Technical', edited());
    expect(a.artifactId).toBe('artifact-04'); expect(a.unlockId).toBe('artifact-04');
  });
  it('keeps per-project trade-offs through a follow-up', () => {
    const p = edited(); const first = reply('Artifact 02', 'Engineer', 'Sharp & Technical', p);
    const next = reply('Why that choice? Tell me the trade-offs', 'Engineer', 'Warm & Candid', p, first.context);
    expect(next.artifactId).toBe('artifact-02'); expect(next.text).toContain('limited concurrent writes'); expect(next.text).not.toContain('Redis');
  });
  it('uses latest facts for identity, availability, and career without stale owner facts', () => {
    const p = edited();
    const bio = reply('Who are you? Where are you based?', 'Curious', 'Measured & Regal', p);
    expect(bio.text).toContain('Sam Lee'); expect(bio.text).toContain('Portland'); expect(bio.text).toContain('libraries'); expect(bio.text).not.toContain('Alex');
    expect(reply('Are you open to new roles?', 'Recruiter', 'Warm & Candid', p).text).toContain('part-time');
    expect(reply('Tell me about your career and leadership', 'Recruiter', 'Sharp & Technical', p).text).toContain('Library Lab');
  });
  it('changes emphasis by visitor mode using only saved project fields', () => {
    const p = edited();
    expect(reply('Artifact 02', 'Recruiter', 'Measured & Regal', p).text).toContain('Reduced duplicate');
    expect(reply('Artifact 02', 'Engineer', 'Measured & Regal', p).text).toContain('SQLite');
    expect(reply('Artifact 02', 'Collaborator', 'Measured & Regal', p).text).toContain('Catalog corrections');
  });
  it('admits limits for unknown input even after a project conversation', () => {
    const a = reply('What is the weather in Paris?', 'Curious', 'Warm & Candid', edited(), { topic: 'artifact', artifactId: 'artifact-02' });
    expect(a.context.topic).toBe('unknown'); expect(a.text).toContain('don’t have'); expect(a.unlockId).toBeUndefined();
  });
  it('asks for a project when architecture has no clear subject', () => {
    const a = reply('What is your database stack?', 'Engineer', 'Sharp & Technical', edited());
    expect(a.artifactId).toBeUndefined(); expect(a.unlockId).toBeUndefined();
  });
  it('does not reuse previous artifact when an invalid artifact number is explicit', () => {
    const a = reply('Artifact 99 architecture', 'Engineer', 'Sharp & Technical', edited(), { topic: 'artifact', artifactId: 'artifact-02' });
    expect(a.unlockId).toBeUndefined(); expect(a.artifactId).toBeUndefined();
  });
  it('does not treat an unrelated why-question as a project follow-up', () => {
    const a = reply('Why is the sky blue?', 'Engineer', 'Sharp & Technical', edited(), { topic: 'artifact', artifactId: 'artifact-02' });
    expect(a.context.topic).toBe('unknown'); expect(a.unlockId).toBeUndefined();
  });
  it('generates current project suggestions and profile-driven opening with focus and tone', () => {
    const p = edited(); expect(questions('Engineer', p).join(' ')).toContain('Library Signal Workbench');
    const opening = proclamation('Sharp & Technical', 'Engineering', p, 'Engineer');
    expect(opening).toContain('Sam Lee'); expect(opening).toContain('Interfaces that respect readers');
    expect(opening).not.toBe(proclamation('Warm & Candid', 'Leadership', p));
  });
});
