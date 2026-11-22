import type {Artifact} from '../lib/profile';
import './project-concepts.css';
export default function ProjectConcepts({artifact,onNarrate}:{artifact:Artifact;onNarrate?:(text:string)=>void}){
 if(!artifact.concepts?.length)return null;
 return <section className="project-concepts" aria-label={`${artifact.title} detailed concepts`}><header><p className="concept-kicker">THE ENGINEERING MONOGRAPH</p><h3>Inside the system.</h3><p>Concepts, mechanisms, and the reasoning behind the implementation.</p><nav aria-label={`${artifact.title} concept index`}>{artifact.concepts.map((concept,index)=><a key={index} href={`#${artifact.id}-concept-${index}`}>{String(index+1).padStart(2,'0')} · {concept.title}</a>)}</nav></header>{artifact.concepts.map((concept,index)=><article id={`${artifact.id}-concept-${index}`} key={index}><span className="concept-kicker">{String(index+1).padStart(2,'0')} / CONCEPT NOTES</span><h4>{concept.title}</h4>{concept.body.split(/\n\s*\n/).map((paragraph,n)=><p key={n}>{paragraph}</p>)}{onNarrate&&<button type="button" onClick={()=>onNarrate(`${concept.title}. ${concept.body}`)}>Hear this concept ↗</button>}</article>)}</section>;
}
