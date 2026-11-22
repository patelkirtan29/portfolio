import {describe,it,expect} from 'vitest';
import {defaultProfile,loadProfile,validateProfile} from './profile';
import {reply} from './conversation';
import {previousPortfolioProfile} from './previousPortfolio';
import {legacySampleProfile} from './legacyProfile';
function legacy(){return structuredClone(legacySampleProfile);}
const stored=(value:unknown)=>({getItem:()=>JSON.stringify(value),setItem:()=>{}});
describe('Kirtan portfolio content and migration',()=>{
 it('replaces sample data with all six supplied projects',()=>{expect(defaultProfile.name).toBe('Kirtan Patel');expect(defaultProfile.isSample).toBe(false);expect(defaultProfile.location).toContain('Arlington');expect(defaultProfile.projects).toHaveLength(6);expect(defaultProfile.projects[0].title).toContain('ImmunoNet');expect(defaultProfile.projects[5].title).toContain('Job Intelligence');});
 it('migrates the identifiable Alex seed but preserves customized owners',()=>{expect(loadProfile(stored(legacy())).profile.name).toBe('Kirtan Patel');const custom=legacy();custom.name='Custom Owner';custom.isSample=false;expect(loadProfile(stored(custom)).profile.name).toBe('Custom Owner');});
 it('preserves safe contacts, project status and evidence links through validation',()=>{const input={...structuredClone(defaultProfile),contacts:{email:'patelkirtan0810@gmail.com',linkedin:'https://www.linkedin.com/in/kirtan29/',github:'https://github.com/patelkirtan29'}};input.projects[0]={...input.projects[0],status:'Course project',links:[{label:'Source',url:'https://github.com/patelkirtan29/NNDL-Immunonet'}]};const p=validateProfile(input);expect(p?.contacts?.email).toBe('patelkirtan0810@gmail.com');expect(p?.projects[0].links?.[0].url).toContain('NNDL-Immunonet');expect(p?.projects[0].status).toBe('Course project');});
 it('rejects unsafe source link schemes',()=>{const input=structuredClone(defaultProfile);input.projects[0]={...input.projects[0],links:[{label:'Bad',url:'javascript:alert(1)'}]};expect(validateProfile(input)).toBe(null);});
 it('routes sixth artifact and contact questions to current profile facts',()=>{const answer=reply('Show Artifact 06 architecture','Engineer','Sharp & Technical',defaultProfile);expect(answer.artifactId).toBe('artifact-06');expect(answer.text).toMatch(/Ollama|FastAPI/);expect(reply('How can I contact you?','Recruiter','Sharp & Technical',defaultProfile).text).toContain('patelkirtan0810@gmail.com');});
 it('keeps scientific metrics and in-progress work qualified',()=>{const immuno=defaultProfile.projects[0],sibyl=defaultProfile.projects[2];expect(immuno.outcomes).toContain('0.896');expect(immuno.outcomes).toContain('0.439');expect(immuno.outcomes.toLowerCase()).toContain('held-out');expect(immuno.outcomes.toLowerCase()).toContain('pseudo');expect(sibyl.status?.toLowerCase()).toContain('progress');expect(sibyl.metric).not.toMatch(/\d+(?:\.\d+)?\s*[x×]/);expect(sibyl.outcomes.toLowerCase()).toMatch(/no .*results|no .*speedup|results .*not|not .*results|evaluation .*planned/);});
});

describe('portfolio refresh review regressions',()=>{
 it.each(['role','availability','contacts','architecture','career'])('preserves edits to legacy sample %s',field=>{const p=legacy();if(field==='role')p.role='My customized role';if(field==='availability')p.availability='My customized availability';if(field==='contacts')p.contacts={email:'custom@example.com'};if(field==='architecture')p.projects[0].architecture='My customized architecture';if(field==='career')p.career[0].outcome='My customized outcome';expect(loadProfile(stored(p)).profile).toEqual(validateProfile(p));});
 it('answers direct repository questions and attaches current source links',()=>{const a=reply('What is ImmunoNet GitHub?','Engineer','Sharp & Technical',defaultProfile);expect(a.text).toContain('https://github.com/patelkirtan29/NNDL-Immunonet');expect(a.sources?.[0].url).toContain('NNDL-Immunonet');});
});

describe('interactive edition seed upgrade',()=>{
 it('upgrades the untouched Kirtan seed and preserves an edited seed',()=>{
  const storage=stored(structuredClone(previousPortfolioProfile));
  expect(loadProfile(storage).profile.heroSubtitle).toBe(defaultProfile.heroSubtitle);
  const edited=structuredClone(previousPortfolioProfile);edited.projects[0].lesson='My revised interpretation.';
  expect(loadProfile(stored(edited)).profile.projects[0].lesson).toBe('My revised interpretation.');
 });
});

describe('distinct skills and research replies',()=>{
 it('labels familiar tools separately from proven capabilities',()=>{const text=reply('What are your skills?','Engineer','Sharp & Technical',defaultProfile).text;expect(text).toContain('Project-proven');expect(text).toContain('Also familiar with');expect(text).toContain('CUDA');});
 it('describes next research directions as interests instead of completed projects',()=>{const text=reply('What are your research interests?','Curious','Sharp & Technical',defaultProfile).text;expect(text).toContain('Exploring next');expect(text).toContain('interests');expect(text).toContain('AlphaFold');});
});
