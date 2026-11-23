import {lazy,Suspense} from 'react';
import type {Artifact} from '../lib/profile';
import {canShowDedicatedStudy} from '../lib/projectEvidence';
import ProjectSimulation,{ProjectPreview} from './ProjectSimulation';
const ImmunoChamber=lazy(()=>import('./immunonet/ImmunoChamber'));
const RagChamber=lazy(()=>import('./rag/RagChamber'));
const SibylChamber=lazy(()=>import('./sibyl/SibylChamber'));
const FaersChamber=lazy(()=>import('./faers/FaersChamber'));
const chambers={'artifact-01':ImmunoChamber,'artifact-02':RagChamber,'artifact-03':SibylChamber,'artifact-04':FaersChamber};
export default function ProjectStudy({artifact,preview=false,onNarrate,onStopNarration}:{artifact:Artifact;preview?:boolean;onNarrate?:(text:string)=>void;onStopNarration?:()=>void}){
 const Chamber=chambers[artifact.id as keyof typeof chambers];
 if(!preview&&Chamber&&canShowDedicatedStudy(artifact))return <Suspense fallback={<div className="project-sim" role="status">Opening the {artifact.title} chamber…</div>}><Chamber artifact={artifact} onNarrate={onNarrate} onStopNarration={onStopNarration}/></Suspense>;
 if(canShowDedicatedStudy(artifact))return preview?<ProjectPreview artifactId={artifact.id} title={artifact.title}/>:<ProjectSimulation artifactId={artifact.id} title={artifact.title}/>;
 return <div className={`project-sim ${preview?'project-sim-preview':''}`}><p className="sim-eyebrow">{preview?'CURRENT STACK':'CURRENT EDITED PROJECT · STACK INVENTORY'}</p><div className="edited-stack">{artifact.stack.map((technology,i)=><span key={`${i}-${technology}`}>{technology}</span>)}</div>{!preview&&<p className="sim-caption">{artifact.architecture}</p>}</div>;
}
