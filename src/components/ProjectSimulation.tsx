import { useEffect, useId, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './project-simulation.css'

type Props = { artifactId: string; title?: string }
type Point = [number, number]
const names = ['Naive', 'Effector', 'Exhausted', 'Th1-like', 'Treg', 'Other CD4']
const centers: Point[] = [[110, 105], [250, 100], [390, 105], [110, 235], [250, 235], [390, 235]]
function Box({ x, y, w = 130, h = 56, label, sub, active = false }: { x: number; y: number; w?: number; h?: number; label: string; sub?: string; active?: boolean }) {
  return <g className={`sim-box ${active ? 'is-active' : ''}`}><rect x={x} y={y} width={w} height={h} rx="17"/><text x={x + w / 2} y={y + (sub ? 24 : h / 2 + 4)} textAnchor="middle">{label}</text>{sub && <text className="sim-small" x={x + w / 2} y={y + 42} textAnchor="middle">{sub}</text>}</g>
}
function Wire({ d, active = false, dashed = false }: { d: string; active?: boolean; dashed?: boolean }) { return <path className={`sim-wire ${active ? 'is-active' : ''}`} d={d} strokeDasharray={dashed ? '4 7' : undefined}/> }
function Controls({ options, value, onChange }: { options: string[]; value: number; onChange: (value: number) => void }) { return <div className="sim-tabs" role="group" aria-label="Diagram view">{options.map((label, i) => <button type="button" key={label} aria-pressed={value === i} onClick={() => onChange(i)}>{label}</button>)}</div> }
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduced(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  return reduced
}
function useReplay(last: number, reduced: boolean) {
  const [run, setRun] = useState(0)
  const [step, setStep] = useState(last)
  useEffect(() => {
    if (!run || reduced) { setStep(last); return }
    setStep(0)
    const timers = Array.from({ length: last }, (_, i) => window.setTimeout(() => setStep(i + 1), (i + 1) * 700))
    return () => timers.forEach(window.clearTimeout)
  }, [run, last, reduced])
  return { step, replay: () => setRun(value => value + 1) }
}
function Immuno({ preview = false }: { preview?: boolean }) {
  const [view, setView] = useState(1)
  return <>{!preview && <Controls options={['Raw 10x shift', 'Standardized + gene handling · +0.018 F1']} value={view} onChange={setView}/>}<svg viewBox="0 0 760 340" role="img" aria-label="Illustrative six-cluster T-cell projection and GeneAttention marker scan"><g className="sim-clusters">{centers.map(([cx, cy], cluster) => <g key={cluster}><ellipse cx={cx} cy={cy} rx="57" ry="42" className="sim-cluster-outline"/>{Array.from({ length: 20 }, (_, i) => { const angle = i * 2.4; const r = 9 + (i * 13 % 29); const shift = view ? 0 : (i % 3 === 0 ? 38 : -16); return <circle key={i} className={`sim-cell ${i % 3 === 0 ? 'sim-target' : ''}`} cx={cx + Math.cos(angle) * r + shift} cy={cy + Math.sin(angle) * r * .74 + (view ? 0 : (i % 4) * 7)} r={i % 3 === 0 ? 3.8 : 2.4}/> })}<text className="sim-small" x={cx} y={cy + 62} textAnchor="middle">{names[cluster]}</text></g>)}</g><path className="sim-divider" d="M480 40V305"/><text x="520" y="58" className="sim-eyebrow">GENEATTENTION</text>{['FOXP3', 'CCR7', 'CD8A', 'CD8B'].map((gene, i) => <g key={gene}><text x="520" y={105 + i * 48} className="sim-small">{gene}</text><rect className="sim-track" x="585" y={92 + i * 48} width="125" height="16" rx="8"/><rect className="sim-gene" x="585" y={92 + i * 48} width={55 + i * 19} height="16" rx="8"/></g>)}<rect className="sim-scan" x="580" y="80" width="3" height="190" rx="1.5"/><text x="520" y="303" className="sim-small">Canonical marker illustration</text></svg>{!preview && <p className="sim-caption">Illustrative cell layout, not a measured embedding. Preprocessing bundle (standardization, gene selection, and dead-gene handling): +0.018 F1. Held-out Smart-seq2: 0.896 macro-F1; 10x pseudo-labels: 0.439.</p>}</>
}
function Rag({ preview = false, reduced = false }: { preview?: boolean; reduced?: boolean }) {
  const [view, setView] = useState(0)
  const [stage, setStage] = useState(0)
  useEffect(() => { if (stage !== 1) return; if (reduced) { setStage(3); return } const lookup = window.setTimeout(() => setStage(2), 1300); return () => window.clearTimeout(lookup) }, [stage, reduced])
  useEffect(() => { if (stage !== 2) return; const reconnect = window.setTimeout(() => setStage(3), 1600); return () => window.clearTimeout(reconnect) }, [stage])
  return <>{!preview && <div className="sim-controls"><Controls options={['Elixir / OTP', 'AWS multi-region design']} value={view} onChange={setView}/>{view === 0 && <button className="sim-action" type="button" disabled={stage === 1 || stage === 2} onClick={() => setStage(1)}>Simulate socket drop ↗</button>}</div>}<svg viewBox="0 0 760 340" role="img" aria-label={view ? 'AWS multi-region architecture design with SNS SQS Lambda and Bedrock' : 'Fault tolerant query flow preserving QueryServer while UserSocket reconnects'}>{view ? <><text className="sim-eyebrow" x="36" y="38">SECONDARY ARCHITECTURE · DESIGN CONTRIBUTION</text><Wire d="M160 165H225M355 165H410M540 165H590" active/><Box x={30} y={137} label="Client"/><Box x={225} y={137} label="SNS" sub="regional fan-out"/>{[55, 235].map((y, i) => <g key={y}><Wire d={`M355 165Q385 165 385 ${y + 28}H410M540 ${y + 28}H590`}/><Box x={410} y={y} label="SQS → Lambda" sub={`Region ${i ? 'B' : 'A'}`}/><Box x={590} y={y} label="Bedrock" sub="retrieval + response"/></g>)}<text x="36" y="305" className="sim-small">Worked on multi-region design · no production latency claim</text></> : <><rect x="425" y="58" width="175" height="220" rx="42" className="sim-supervisor"/><text x="512" y="88" textAnchor="middle" className="sim-small">QuerySupervisor</text><Wire d="M145 165H205" active={stage !== 1 && stage !== 2} dashed={stage === 1 || stage === 2}/><Wire d="M335 165H445M575 165H625" active/><Wire d="M270 137V80Q270 48 332 48H365Q398 48 398 85V137" active={stage === 2} dashed/><Box x={15} y={137} label="Next.js client"/><Box x={205} y={137} label="UserSocket" sub={stage === 1 || stage === 2 ? 'connection dropped' : 'connected'}/><Box x={315} y={25} w={110} label="Registry"/><Box x={445} y={137} label="QueryServer" sub="query survives" active/><Box x={625} y={137} w={120} label="pgvector" sub="HNSW + filtering"/><circle className="sim-packet sim-query" cx="0" cy="0" r="5"/><text className="sim-eyebrow" x="35" y="301">{['QUERY PROCESS ≠ SOCKET LIFETIME', 'SOCKET LOST · QUERY REMAINS ALIVE', 'REGISTRY LOOKUP · REATTACHING', 'RECONNECTED · FILTERED RESULTS DELIVERED'][stage]}</text></>}</svg>{!preview && <p className="sim-caption" role="status">{view ? 'Worked on the SNS/SQS/Lambda/Bedrock multi-region architecture design. No measured production latency is claimed.' : <>{['Connected. Query process runs independently of the socket.', 'Socket dropped. QueryServer remains alive inside QuerySupervisor.', 'Looking up the surviving query through Registry.', 'Connection restored. Filtered results delivered.'][stage]} Illustrated fault recovery, not a running backend. Idle query processes reap after 10 minutes.</>}</p>}</>
}
function Sibyl({ preview = false, reduced = false }: { preview?: boolean; reduced?: boolean }) {
  const [view, setView] = useState(1)
  const svg = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!svg.current) return
    const node = svg.current
    const dots = Array.from(node.querySelectorAll<SVGCircleElement>('[data-flow-dot]'))
    const position = (dot: SVGCircleElement, progress: number) => {
      const path = node.querySelector<SVGPathElement>(`[data-flow-path="${dot.dataset.flowDot}"]`)
      if (!path) return
      const point = path.getPointAtLength(path.getTotalLength() * progress)
      dot.setAttribute('cx', String(point.x)); dot.setAttribute('cy', String(point.y))
    }
    dots.forEach(dot => position(dot, 1))
    if (reduced || preview) return
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ repeat: -1, repeatDelay: .7 })
      gsap.set(dots, { opacity: 0 })
      if (view) gsap.fromTo('.sim-gather-node', { scale: .75, transformOrigin: 'center' }, { scale: 1, duration: .6, ease: 'back.out(1.5)' })
      gsap.fromTo('.sim-gather-wire', { strokeDasharray: '5 5', strokeDashoffset: 50 }, { strokeDashoffset: 0, duration: .7, ease: 'power2.out' })
      dots.forEach(dot => {
        const progress = { value: 0 }
        const at = Number(dot.dataset.begin || 0)
        timeline.set(dot, { opacity: 1 }, at)
        timeline.fromTo(progress, { value: 0 }, { value: 1, duration: .95, ease: 'power1.inOut', onUpdate: () => position(dot, progress.value), immediateRender: false }, at)
        timeline.set(dot, { opacity: 0 }, at + 1)
      })
      timeline.fromTo('.sim-lse-result', { scale: .6, transformOrigin: 'center', opacity: .3 }, { scale: 1.35, opacity: 1, duration: .35, repeat: 1, yoyo: true }, 3)
    }, node)
    return () => context.revert()
  }, [view, reduced, preview])
  return <>{!preview && <Controls options={['Per-request sparse', 'SibylKV union gather']} value={view} onChange={setView}/>}<svg ref={svg} viewBox="0 0 760 340" role="img" aria-label="Design comparison of redundant sparse reads and overlap-aware union gather across four GPUs"><text x="28" y="32" className="sim-eyebrow">IN PROGRESS · DESIGN SIMULATION</text><rect x="28" y="55" width="704" height="28" rx="14" className="sim-prefix"/><text x="380" y="74" textAnchor="middle" className="sim-small">Shared prefix · 64K–1M tokens</text>{[0, 1, 2, 3].map(i => {
    const y = 115 + i * 43
    const read = view ? `M315 ${y}C365 ${y} 365 182 405 182` : `M315 ${y}H415`
    const shard = view ? `M505 182C523 182 515 ${y} 540 ${y}` : `M515 ${y}H540`
    const reduce = `M650 ${y}C725 ${y} 725 291 680 291H380`
    return <g key={i}><text x="30" y={y + 4} className="sim-small">Sibling {i + 1}</text>{Array.from({ length: 9 }, (_, b) => <rect key={b} x={105 + b * 23} y={y - 10} width="16" height="20" rx="7" className={(b + i) % 3 ? 'sim-kv selected' : 'sim-kv'}/>)}<path d={read} className="sim-wire sim-gather-wire is-active" data-flow-path={`read-${i}`}/><path d={shard} className="sim-wire is-active" data-flow-path={`shard-${i}`}/><path d={reduce} className="sim-wire is-active" data-flow-path={`reduce-${i}`}/><Box x={540} y={y - 16} w={110} h={32} label={`GPU ${i + 1}`} active/>{!view && <Box x={415} y={y - 16} w={100} h={32} label="Sparse read"/>}{['read', 'shard', 'reduce'].map((phase, p) => <circle key={phase} data-flow-dot={`${phase}-${i}`} data-begin={p + (p === 0 ? i * .08 : 0)} className={`sim-kv-packet sim-kv-phase-${p}`} cx={p === 2 ? 380 : p === 1 ? 540 : view ? 405 : 415} cy={p === 2 ? 291 : view && p === 0 ? 182 : y} r={p === 0 ? 4 : 3.5}/>)}</g>
  })}{view && <g className="sim-gather-node"><Box x={405} y={139} w={100} h={88} label="Union gather" sub="read shared KV" active/></g>}<circle className="sim-lse-result" cx="380" cy="291" r="7"/><text x="493" y="310" textAnchor="middle" className="sim-small">LSE reduce-scatter · merged output</text><text x="28" y="335" className="sim-small">Batched indexer → overlap-aware scheduler → prefix sharding</text></svg>{!preview && <p className="sim-caption">A proposed memory-access design; traveling packets illustrate reads, sharding, and LSE merging, not measured throughput. No measured speedup or accuracy result. Evaluation planned for Llama-3.1-8B on 1–4 GPUs using RULER and LongBench.</p>}</>
}

function Faers({ preview = false }: { preview?: boolean }) {
  const [view, setView] = useState(0)
  const network: Point[] = [[230, 120], [230, 230], [500, 80], [540, 170], [480, 270]]
  return <>{!preview && <Controls options={['Deduplication funnel', 'PCA projection', 'Drug–reaction network']} value={view} onChange={setView}/>}<svg viewBox="0 0 760 340" role="img" aria-label={['Deduplication funnel from drug and reaction records to unique safety reports', 'Illustrative PCA projection showing five components explaining 89 percent variance', 'Illustrative association network, not causal evidence'][view]}>{view === 0 ? <><Box x={30} y={65} w={185} label="1.9M drug records" sub="XML / ASCII"/><Box x={30} y={210} w={185} label="1.3M reaction records" sub="XML / ASCII"/><Wire d="M215 93Q280 93 300 155M215 238Q280 238 300 180" active/><path d="M300 102Q300 90 314 90H435Q450 90 450 102V140Q450 150 440 160L405 202V240Q405 251 393 251H358Q345 251 345 240V202L310 160Q300 150 300 140Z" className="sim-funnel"/><text x="375" y="132" textAnchor="middle">iterparse</text><text x="375" y="154" textAnchor="middle" className="sim-small">deduplicate</text><Wire d="M405 230Q470 230 510 172" active/><Box x={510} y={130} w={220} h={82} label="385,288 unique reports" sub="Safety reports · not patients" active/><text x="510" y="255" className="sim-small">~9% age outliers flagged</text>{Array.from({ length: 12 }, (_, i) => <circle key={i} className="sim-record" cx={250 + i % 4 * 12} cy={118 + Math.floor(i / 4) * 40} r="2.7"/>)}</> : view === 1 ? <><path d="M85 45V280H470" className="sim-divider"/>{Array.from({ length: 72 }, (_, i) => <circle key={i} className="sim-cell" cx={125 + (i * 47 % 290)} cy={80 + (i * 31 % 150) + Math.sin(i) * 22} r={i % 8 ? 3 : 5}/>)}<text x="90" y="310" className="sim-small">Illustrative projection · component sizes not plotted</text><text x="510" y="80">5 components</text><text x="510" y="107" className="sim-small">89% total explained variance</text>{[0, 1, 2, 3, 4].map((_, i) => <g key={i}><text x="510" y={153 + i * 31} className="sim-small">PC{i + 1}</text><rect x="552" y={140 + i * 31} width="120" height="16" rx="8" className="sim-gene"/></g>)}</> : <>{network.slice(0, 2).flatMap(([x, y], i) => network.slice(2).map(([tx, ty], j) => <Wire key={`${i}-${j}`} d={`M${x} ${y}Q380 ${y + j * 20} ${tx} ${ty}`} active={(i + j) % 2 === 0}/>))}{network.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={i < 2 ? 37 : 27} className="sim-network-node"/><text x={x} y={y + 4} textAnchor="middle" className="sim-small">{i < 2 ? `Drug ${i + 1}` : `Reaction ${i - 1}`}</text></g>)}<text x="380" y="325" textAnchor="middle" className="sim-small">Illustrative associations · signals are not causation</text></>}</svg>{!preview && <p className="sim-caption">FAERS reports can flag patterns, not establish causality. The composite signal score is inspired by the FDA’s PRR framework; it is not a validated PRR.</p>}</>
}
function GoLlama({ preview = false, reduced = false }: { preview?: boolean; reduced?: boolean }) {
  const { step, replay } = useReplay(4, reduced)
  return <>{!preview && <div className="sim-controls"><span className="sim-eyebrow">MERGED CONTRIBUTION · AUTH PR #17</span><button type="button" className="sim-action" onClick={replay}>Simulate worker auth ↗</button></div>}<svg viewBox="0 0 760 340" role="img" aria-label="Authentication sequence from credential store through JWT token endpoint and bearer middleware to inference workers"><Wire d="M170 97H235M365 97H435M565 97Q600 97 600 175H450" active/><Box x={30} y={68} w={140} label="Credential store" active={step >= 1}/><Box x={235} y={68} label="Token endpoint" sub="JWT issuance" active={step >= 2}/><Box x={435} y={68} label="Bearer middleware" sub="validate token" active={step >= 3}/><circle cx="380" cy="224" r="57" className={`sim-hub ${step >= 3 ? 'is-active' : ''}`}/><text x="380" y="222" textAnchor="middle">Go hub</text><text x="380" y="242" textAnchor="middle" className="sim-small">PR #17 · Auth</text>{[[110, 248], [610, 248], [380, 309]].map(([x, y], i) => <g key={i}><Wire d={`M380 224Q${x} 190 ${x} ${y}`} active={step >= 4}/><Box x={x - 70} y={y - 16} w={140} h={32} label={`llama.cpp worker ${i + 1}`} active={step >= 4}/></g>)}{step < 4 && <circle cx={[80, 200, 400, 600][step]} cy="97" r="6" className="sim-packet"/>}</svg>{!preview && <p className="sim-caption" role="status">{['Reading configured worker credentials.', 'Requesting a worker token.', 'Issuing a signed JWT.', 'Validating Bearer credentials at middleware.', 'Authenticated requests can reach the worker proxy.'][step]} Illustrative replay; no credentials are transmitted.</p>}</>
}
function JobAgent({ preview = false, reduced = false }: { preview?: boolean; reduced?: boolean }) {
  const { step, replay } = useReplay(3, reduced)
  const svg = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!svg.current || reduced || preview) return
    const context = gsap.context(() => {
      if (step === 0) {
        gsap.fromTo('.sim-envelope', { x: -50, opacity: 0 }, { x: 100, opacity: 1, duration: .55, stagger: .07, ease: 'power2.in' })
        gsap.fromTo('.sim-agent-packet', { attr: { cx: 120, cy: 168 }, opacity: 0 }, { attr: { cx: 245, cy: 168 }, opacity: 1, duration: .65, ease: 'power2.inOut' })
      }
      if (step === 1) {
        gsap.fromTo('.sim-stage-tag', { x: -40, scale: .7, transformOrigin: 'center', opacity: 0 }, { x: 0, scale: 1, opacity: 1, duration: .45, stagger: .06, ease: 'back.out(1.4)' })
        gsap.fromTo('.sim-agent-packet', { attr: { cx: 310, cy: 168 }, opacity: 1 }, { attr: { cx: 575, cy: 140 }, opacity: 1, duration: .65, ease: 'power2.inOut' })
      }
      if (step === 2) gsap.fromTo('.sim-agent-event', { x: -50, y: 12, scale: .3, transformOrigin: 'center' }, { x: 0, y: 0, scale: 1, duration: .5, stagger: .06, ease: 'back.out(1.8)' })
      if (step === 3) gsap.fromTo('.sim-study-brief', { y: -35, scaleY: .04, opacity: 0, transformOrigin: 'top center' }, { y: 0, scaleY: 1, opacity: 1, duration: .7, stagger: .14, ease: 'power3.out' })
    }, svg)
    return () => context.revert()
  }, [step, reduced, preview])
  return <>{!preview && <div className="sim-controls"><span className="sim-eyebrow">EMAIL → INTERVIEW PREPARATION</span><button type="button" className="sim-action" onClick={replay}>Replay agent flow ↻</button></div>}<svg ref={svg} viewBox="0 0 760 340" role="img" aria-label="Email classifier routes interview stages to calendar events and seven and thirty day study briefs">{[0, 1, 2].map(i => <g key={i} className="sim-envelope"><rect x={30 + i * 12} y={105 + i * 21} width="65" height="44" rx="12" className="sim-mail"/><path d={`M${35 + i * 12} ${112 + i * 21}l27 18 27-18`} className="sim-wire"/></g>)}<Wire d="M120 168H180M308 168H360M515 168H570" active/><circle cx="245" cy="168" r="64" className="sim-classifier"/><circle cx="245" cy="168" r="72" className="sim-classifier-orbit"/><text x="245" y="164" textAnchor="middle">Ollama</text><text x="245" y="186" textAnchor="middle" className="sim-small">Llama 3 classifier</text>{['Screen', 'Technical', 'Final'].map((label, i) => <g className="sim-stage-tag" key={label} opacity={step >= 1 ? 1 : .15}><Box x={365} y={75 + i * 69} w={130} h={38} label={label}/></g>)}<rect x="565" y="50" width="165" height="155" rx="20" className="sim-calendar"/><text x="647" y="78" textAnchor="middle" className="sim-small">GOOGLE CALENDAR</text>{[0, 1, 2, 3, 4].map(i => <g key={i}><text x={584 + i * 29} y="104" textAnchor="middle" className="sim-small">{['M', 'T', 'W', 'T', 'F'][i]}</text><path d={`M${584 + i * 29} 118V184`} className="sim-calendar-line"/></g>)}{step >= 2 && [0, 1, 2].map(i => <rect key={i} x={575 + i * 49} y={123 + i * 18} width="40" height="20" rx="9" className="sim-event sim-agent-event"/>)}<Wire d="M648 205V245" active={step >= 3}/>{[0, 1].map(i => <g key={i} className="sim-study-brief" opacity={step >= 3 ? 1 : .15}><Box x={525 + i * 15} y={250 + i * 40} w={200} h={30} label={`${i ? '30' : '7'}-day study brief`} active={!i}/></g>)}{step < 2 && <circle className="sim-agent-packet" cx="120" cy="168" r="5"/>}<text x="32" y="308" className="sim-small">Gmail + Calendar OAuth2 workflow</text></svg>{!preview && <p className="sim-caption" role="status">{['Incoming interview emails enter the local classifier.', 'The classifier identifies Screen, Technical, or Final stages.', 'Interview events are added to a calendar.', 'The workflow prepares 7-day and 30-day study briefs.'][step]} Illustrated workflow; this exhibition does not connect to your inbox or calendar.</p>}</>
}

function Diagram({ artifactId, preview, reduced }: Props & { preview?: boolean; reduced?: boolean }) { switch (artifactId) { case 'artifact-01': return <Immuno preview={preview}/>; case 'artifact-02': return <Rag preview={preview} reduced={reduced}/>; case 'artifact-03': return <Sibyl preview={preview} reduced={reduced}/>; case 'artifact-04': return <Faers preview={preview}/>; case 'artifact-05': return <GoLlama preview={preview} reduced={reduced}/>; case 'artifact-06': return <JobAgent preview={preview} reduced={reduced}/>; default: return <p className="sim-caption">Architecture study available in the project notes below.</p> } }
export function ProjectPreview({ artifactId, title }: Props) { return <div className="project-sim project-sim-preview" aria-label={`${title || 'Project'} architecture preview`}><Diagram artifactId={artifactId} preview reduced/></div> }
export default function ProjectSimulation({ artifactId, title }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const caption = useId()
  useEffect(() => { if (reduced || !root.current) return; const context = gsap.context(() => { gsap.fromTo('svg', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .65, ease: 'power2.out' }); const cells=root.current?.querySelectorAll('.sim-cell'); if(cells?.length) gsap.fromTo(cells, { scale: .2, x: (i: number) => (i * 29 % 110) - 55, y: (i: number) => (i * 43 % 90) - 45, transformOrigin: 'center' }, { scale: 1, x: 0, y: 0, duration: .9, stagger: .004, ease: 'power2.out' }) }, root); return () => context.revert() }, [artifactId, reduced])
  return <div ref={root} className={`project-sim ${reduced ? 'sim-reduced' : ''}`} aria-describedby={caption}><div className="sim-heading"><span>FIG. {artifactId.slice(-2)} / INTERACTIVE SYSTEM STUDY</span><span id={caption}>Illustrative · not live telemetry</span></div><Diagram key={artifactId} artifactId={artifactId} title={title} reduced={reduced}/></div>
}
