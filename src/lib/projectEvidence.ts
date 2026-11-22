import type {Artifact} from './profile';
import {portfolioProfile} from './portfolioData';
/** Dedicated studies describe the supplied evidence, never arbitrary edited records. */
export function canShowDedicatedStudy(artifact:Artifact):boolean{
 const original=portfolioProfile.projects.find(project=>project.id===artifact.id);
 if(!original)return false;
 return (['title','summary','architecture','outcomes','metric','lesson','status','problem','category','year'] as const).every(field=>artifact[field]===original[field])&&JSON.stringify(artifact.stack)===JSON.stringify(original.stack);
}
