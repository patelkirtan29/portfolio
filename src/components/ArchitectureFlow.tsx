import {useId} from 'react';
import type {Artifact} from '../lib/profile';
import './architecture-flow.css';
import {canShowDedicatedStudy} from '../lib/projectEvidence';
const flows:Record<string,{nodes:string[];note:string}>={
 'artifact-01':{nodes:['Smart-seq2 / 10x','Preprocess genes','GeneAttention','Six-state classifier','UDA objectives','Qualified evaluation'],note:'Conceptual model and evaluation workflow. Expert-labelled source and pseudo-labelled target scores remain distinct.'},
 'artifact-02':{nodes:['Next.js client','UserSocket / Channel','Registry lookup','QueryServer session','QuerySupervisor','pgvector HNSW'],note:'The socket rejoins a session-owned query. QuerySupervisor supervises QueryServer; it is not a sequential request hop. AWS multi-region architecture is a separate design.'},
 'artifact-03':{nodes:['Sibling requests','Batched indexer','Union gather','Prefix GPU shards','LSE reduce-scatter','Overlap scheduler'],note:'In progress · proposed design. The scheduler governs grouping and sharding; no measured speedup or accuracy results are available.'},
 'artifact-04':{nodes:['FAERS XML / ASCII','Parse & deduplicate','Age / weight treatment','Statistical analysis','PCA / signal scores','Plotly Dash'],note:'Reports, not patients. Age outliers are flagged and retained. Composite signals are inspired by PRR and do not establish causality.'},
 'artifact-05':{nodes:['Credential config','Worker token request','JWT issuance','Bearer validation','Go hub routes','llama.cpp worker'],note:'Kirtan’s merged PR #17 covers the authentication path and worker wiring within the larger inference hub.'},
 'artifact-06':{nodes:['Gmail / OAuth2','Llama 3 classifier','Stage & time extraction','Google Calendar','Company research','7 / 30-day briefs'],note:'Illustrative workflow: email classification and calendar creation share authenticated APIs; company research separately informs preparation briefs.'},
};
export default function ArchitectureFlow({artifact}:{artifact:Artifact}){
 const id=useId().replaceAll(':','');const flow=flows[artifact.id];if(!flow||!canShowDedicatedStudy(artifact))return null;
 const edges=artifact.id==='artifact-02'?[[0,1],[1,2],[2,3],[4,3],[3,5]]:artifact.id==='artifact-03'?[[0,1],[1,2],[2,3],[3,4],[5,1]]:artifact.id==='artifact-06'?[[0,1],[1,2],[2,3],[4,5]]:[[0,1],[1,2],[2,3],[3,4],[4,5]];
 const coords=[[12,20],[218,20],[424,20],[424,136],[218,136],[12,136]];
 return <figure className="architecture-flow"><svg viewBox="0 0 630 222" role="img" aria-label={`${artifact.title}: conceptual system architecture`}><defs><marker id={`arrow-${id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1L6 4L1 7" fill="none" stroke="currentColor"/></marker></defs>{edges.map(([a,b])=>{const [x,y]=coords[a],[tx,ty]=coords[b];const vertical=y!==ty;const x1=x+90,y1=y+32,x2=tx+90,y2=ty+32;return <path key={`${a}-${b}`} d={vertical?`M${x1} ${y1+32} Q${x1+35} ${(y1+y2)/2} ${x2} ${y2-32}`:`M${x1+(x2>x1?90:-90)} ${y1} L${x2+(x2>x1?-95:95)} ${y2}`} fill="none" stroke="currentColor" opacity=".45" markerEnd={`url(#arrow-${id})`}/>;})}{flow.nodes.map((node,i)=><g key={node} transform={`translate(${coords[i][0]} ${coords[i][1]})`}><rect width="180" height="64" rx="16"/><text x="14" y="20" className="flow-index">0{i+1}</text><text x="14" y="43">{node}</text></g>)}</svg><figcaption>{flow.note}</figcaption></figure>;
}
