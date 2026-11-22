import {describe,it,expect} from 'vitest';
import {defaultProfile} from './profile';
import {canShowDedicatedStudy} from './projectEvidence';
describe('project study evidence boundary',()=>{
 it('allows the six current records',()=>{for(const artifact of defaultProfile.projects)expect(canShowDedicatedStudy(artifact)).toBe(true);});
 it.each(['title','summary','architecture','outcomes','metric','lesson','status','problem'] as const)('hides original diagrams after editing %s',field=>{const artifact={...defaultProfile.projects[0],[field]:'Edited evidence'};expect(canShowDedicatedStudy(artifact)).toBe(false);});
 it('hides stale diagrams for stack edits or unknown IDs',()=>{expect(canShowDedicatedStudy({...defaultProfile.projects[0],stack:['A different model']})).toBe(false);expect(canShowDedicatedStudy({...defaultProfile.projects[0],id:'artifact-12'})).toBe(false);});
});
