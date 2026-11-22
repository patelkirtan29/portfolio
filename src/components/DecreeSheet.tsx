import { useId } from 'react';
import type { Artifact } from '../lib/profile';
import './council-visuals.css';
import ArchitectureFlow from './ArchitectureFlow';
import ProjectConcepts from './ProjectConcepts';

export default function DecreeSheet({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  const headingId = useId();
  return <aside className="council-decree" aria-labelledby={headingId}>
    <header className="council-decree__header">
      <span className="council-decree__eyebrow">DECREE UNLOCKED / {artifact.id.replace('artifact-', '').padStart(2, '0')}</span>
      <button type="button" onClick={onClose} aria-label="Close decree">Close <span aria-hidden="true">×</span></button>
    </header>
    <p className="council-decree__edition">{artifact.category} <span>· {artifact.year}</span></p>
    <h2 id={headingId}>{artifact.title}</h2>{artifact.status&&<p className="council-decree__caption">{artifact.status}</p>}
    <p className="council-decree__intro">{artifact.summary}</p>
    <section><h3>01 / The constraint</h3><p>{artifact.problem}</p></section>
    <section><h3>02 / System composition</h3>
      <ArchitectureFlow artifact={artifact}/><ol className="council-decree__flow" aria-label="Technology stack; ordering does not imply a verified data flow">
        {artifact.stack.map((technology, index) => <li key={`${index}-${technology}`}><span className="council-decree__node-index">{String(index + 1).padStart(2, '0')}</span><span>{technology}</span></li>)}
      </ol>
      <p className="council-decree__caption">Stack inventory · relationships described below</p>
      <p>{artifact.architecture}</p>
    </section>
    <section><h3>03 / The trade-off</h3><p>{artifact.lesson}</p></section>
    <section><h3>04 / Evidence & telemetry</h3>
      <table><caption className="council-visually-hidden">Supplied project evidence and telemetry</caption><tbody>
        <tr><th scope="row">Project evidence</th><td>{artifact.metric}</td></tr>
        <tr><th scope="row">p99 latency</th><td>Not supplied</td></tr>
        <tr><th scope="row">Uptime</th><td>Not supplied</td></tr>
      </tbody></table>
      <p>{artifact.outcomes}</p>
    </section>
    <ProjectConcepts artifact={artifact}/><div className="decree-source-links">{artifact.links?.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div><footer className="council-decree__footer">From the current project record <span aria-hidden="true">✳</span></footer>
  </aside>;
}
