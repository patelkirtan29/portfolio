import {lazy,Suspense} from 'react';
import type {Artifact} from '../lib/profile';
import {canShowDedicatedStudy} from '../lib/projectEvidence';
import ProjectSimulation,{ProjectPreview} from './ProjectSimulation';
const ImmunoChamber=lazy(()=>import('./immunonet/ImmunoChamber'));
export default function ProjectStudy({artifact,preview=false,onNarrate,onStopNarration}:{artifact:Artifact;preview?:boolean;onNarrate?:(text:string)=>void;onStopNarration?:()=>void}){
 if(!preview&&artifact.id==='artifact-01'&&canShowDedicatedStudy(artifact))return <Suspense fallback={<div className="project-sim" role="status">Opening the ImmunoNet chamber…</div>}><ImmunoChamber artifact={artifact} onNarrate={onNarrate} onStopNarration={onStopNarration}/></Suspense>;
 if(canShowDedicatedStudy(artifact))return preview?<ProjectPreview artifactId={artifact.id} title={artifact.title}/>:<ProjectSimulation artifactId={artifact.id} title={artifact.title}/>;
 return <div className={`project-sim ${preview?'project-sim-preview':''}`}><p className="sim-eyebrow">{preview?'CURRENT STACK':'CURRENT EDITED PROJECT · STACK INVENTORY'}</p><div className="edited-stack">{artifact.stack.map((technology,i)=><span key={`${i}-${technology}`}>{technology}</span>)}</div>{!preview&&<p className="sim-caption">{artifact.architecture}</p>}</div>;
}
