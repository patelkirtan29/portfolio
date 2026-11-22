import {describe,it,expect} from 'vitest';
import {legacySampleProfile} from './legacyProfile';
import {defaultProfile,loadProfile,restorePublishedProfile,hasLegacyDemoProjects} from './profile';
function storage(value:unknown){const values=new Map([['herald-profile-v2',JSON.stringify(value)]]);return{getItem:(key:string)=>values.get(key)||null,setItem:(key:string,next:string)=>{values.set(key,next);}};}
describe('old saved demo recovery',()=>{
 it('migrates an unchanged demo saved with its sample checkbox off',()=>{const old={...structuredClone(legacySampleProfile),isSample:false};expect(loadProfile(storage(old)).profile.name).toBe('Kirtan Patel');});
 it('detects the old four-project demo even when its owner fields changed',()=>{const old=structuredClone(legacySampleProfile);old.name='Kirtan Patel';old.projects[0].lesson='A customized note';expect(hasLegacyDemoProjects(old)).toBe(true);expect(loadProfile(storage(old)).profile.projects[0].lesson).toBe('A customized note');expect(hasLegacyDemoProjects(defaultProfile)).toBe(false);});
 it('backs up saved edits before explicitly loading the latest published portfolio',()=>{const old=structuredClone(legacySampleProfile);old.projects[0].lesson='My note';const s=storage(old);const result=restorePublishedProfile(s);expect(result.profile?.projects).toHaveLength(6);expect(s.getItem('herald-profile-backup-before-refresh')).toBe(JSON.stringify(old));expect(loadProfile(s).profile.name).toBe('Kirtan Patel');});
});
