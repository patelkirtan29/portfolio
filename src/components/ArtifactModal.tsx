import { useEffect, useId, useRef } from 'react'
import type { Artifact } from '../lib/profile'
import type { SpeechControls } from '../lib/useSpeech'
import './exhibition.css'
import ProjectStudy from './ProjectStudy'
import ProjectConcepts from './ProjectConcepts'

type Props = { artifact: Artifact | null; unlocked: boolean; onClose: () => void; onUnlock: (id: string) => void; speech: SpeechControls; onAsk: (id: string) => void }

export default function ArtifactModal({ artifact, unlocked, onClose, onUnlock, speech, onAsk }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useId()
  const liveSpeech = useRef(speech)
  liveSpeech.current = speech
  useEffect(() => {
    if (!artifact) return
    const node = dialog.current
    if (!node) return
    const previous = document.activeElement as HTMLElement | null
    node.showModal()
    return () => {
      if (liveSpeech.current.activeKey === artifact.id) liveSpeech.current.stop()
      node.close()
      previous?.focus({ preventScroll: true })
    }
  }, [artifact?.id])
  if (!artifact) return null
  const narrating = speech.speaking && speech.activeKey === artifact.id
  const narration = `${artifact.title}. ${artifact.summary} The problem. ${artifact.problem} The architecture. ${artifact.architecture} The outcomes. ${artifact.outcomes}${unlocked ? ` Lessons learned. ${artifact.lesson}` : ''}`
  return <dialog ref={dialog} className="exhibition-dialog artifact-dialog" aria-labelledby={heading} data-lenis-prevent onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}>
    <div className="exhibition-topline"><span>THE EXHIBITION / {artifact.id.replace('artifact-', '')}</span><button type="button" className="exhibition-close" onClick={onClose} aria-label="Close artifact">Close <span aria-hidden="true">×</span></button></div>
    <div className="artifact-intro"><p className="exhibition-meta">{artifact.category} · {artifact.year}</p><h2 id={heading}>{artifact.title}</h2>{artifact.status&&<p className="exhibition-meta">{artifact.status}</p>}<p className="artifact-deck">{artifact.summary}</p></div>
    <ProjectStudy artifact={artifact} onNarrate={speech.supported?text=>speech.speak(text,{key:artifact.id}):undefined} onStopNarration={speech.stop}/>
    <div className="artifact-playback"><button type="button" className="exhibition-action" disabled={!speech.supported} onClick={() => narrating ? speech.stop() : speech.speak(narration, { key: artifact.id })}>{narrating ? 'Stop narration' : 'Hear Herald Narrate'} <span aria-hidden="true">{narrating ? 'Ⅱ' : '↗'}</span></button><span className={`exhibition-wave ${narrating ? 'is-speaking' : ''}`} aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ animationDelay: `${i * -.11}s`, height: `${8 + (i * 7 % 20)}px` }}/>)}</span></div>
    {!speech.supported && <p className="exhibition-note">Narration is unavailable in this browser. The full story is below.</p>}
    {narrating && <p className="exhibition-caption" aria-live="off">{speech.caption || artifact.summary}</p>}
    {speech.error && speech.activeKey === artifact.id && <p role="status" className="exhibition-note">{speech.error}</p>}
    <div className="artifact-story">{[['01', 'The problem', artifact.problem], ['02', 'The architecture', artifact.architecture], ['03', 'The outcomes', artifact.outcomes]].map(([index, title, copy]) => <section key={index}><span className="exhibition-meta">{index}</span><div><h3>{title}</h3><p>{copy}</p></div></section>)}</div>
    <ProjectConcepts artifact={artifact} onNarrate={speech.supported?text=>speech.speak(text,{key:artifact.id}):undefined}/><div className="artifact-source-links">{artifact.links?.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div><div className="artifact-stack"><span className="exhibition-meta">WORKING STACK</span><p>{artifact.stack.join(' / ')}</p></div>
    <section className="artifact-vault"><p className="exhibition-meta">{unlocked ? 'OPEN NOTES / REVEALED IN CONVERSATION' : 'LOCKED NOTES / CONTINUE THE CONVERSATION'}</p><h3>Deep Architecture &amp;<br/>Lessons Learned</h3>{unlocked ? <p className="artifact-lesson">{artifact.lesson}</p> : <><p>The decisions behind the diagram. The tradeoffs, the surprises, and what would change next time.</p><button type="button" className="exhibition-action" onClick={() => onUnlock(artifact.id)}>Unlock Architecture Decree <span aria-hidden="true">↗</span></button><p className="exhibition-note">A conversational reveal, freely available to every visitor.</p></>}</section>
    <footer className="artifact-footer"><span className="exhibition-meta">THERE IS ALWAYS MORE TO THE STORY.</span><button type="button" className="exhibition-text-button" onClick={() => onAsk(artifact.id)}>Ask about this artifact ↗</button></footer>
  </dialog>
}
