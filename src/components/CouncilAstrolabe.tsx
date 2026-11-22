import { useEffect, useRef } from 'react';
import './council-visuals.css';

type Props = { speaking: boolean; artifactId?: string | null; projects: Array<{ id: string; title: string }>; assembleFrom?: number };

/** Assembly runs 600–1100ms after the reveal starts: scattered rings and nodes lock into orbit. */
function assembly(from: number | undefined, now: number) {
  if (from === undefined || !Number.isFinite(from)) return 1;
  const t = Math.max(0, Math.min(1, (now - from - 600) / 500));
  return 1 - (1 - t) ** 3;
}

export default function CouncilAstrolabe({ speaking, artifactId, projects, assembleFrom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const live = useRef({ speaking, artifactId, projects, assembleFrom });
  live.current = { speaking, artifactId, projects, assembleFrom };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let width = 0;
    let height = 0;
    let phase = 0;
    let previous = 0;
    let disposed = false;
    const tau = Math.PI * 2;

    function draw(time: number) {
      if (disposed || !context || !canvas) return;
      if (!motion.matches) phase += Math.min(40, Math.max(0, time - previous)) / 1000;
      previous = time;
      context.clearRect(0, 0, width, height);
      const lock = motion.matches ? 1 : assembly(live.current.assembleFrom, performance.now());
      const loose = 1 - lock;
      context.globalAlpha = lock;
      const cx = width / 2, cy = height / 2;
      const radius = Math.min(width, height) * .36 * (1 + loose * .55);
      const active = live.current.projects.slice(0, 12).findIndex(project => project.id === live.current.artifactId);
      const spin = motion.matches ? .36 : phase * .055 + .36;
      const resonance = live.current.speaking ? (motion.matches ? .65 : .65 + Math.sin(phase * 7) * .22) : .16;
      const stroke = (alpha: number) => { context.strokeStyle = `rgba(229,229,229,${alpha})`; context.lineWidth = .65; };
      const circle = (r: number, alpha: number) => { stroke(alpha); context.beginPath(); context.arc(cx, cy, r, 0, tau); context.stroke(); };
      // A still pool under the instrument. Speech disturbs its concentric field.
      for (let ring = 1; ring <= 8; ring++) {
        const ripple = motion.matches ? 0 : (phase * .13 % 1);
        circle(radius * (.09 + (ring + ripple) * .073), (1 - ring / 10) * (.055 + resonance * .10));
      }
      circle(radius * .89, .12);
      circle(radius * 1.065, .20);
      circle(radius * 1.13, .13);
      for (let degree = 0; degree < 360; degree += 2) {
        const angle = degree * Math.PI / 180 - Math.PI / 2;
        const major = degree % 30 === 0, medium = degree % 10 === 0;
        const r = radius * 1.065;
        const length = major ? 10 : medium ? 6 : 2.5;
        stroke(major ? .55 : medium ? .30 : .16);
        context.beginPath(); context.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        context.lineTo(cx + Math.cos(angle) * (r - length), cy + Math.sin(angle) * (r - length)); context.stroke();
        if (major) {
          context.save(); context.translate(cx + Math.cos(angle) * radius * 1.20, cy + Math.sin(angle) * radius * 1.20);
          context.fillStyle = 'rgba(224,224,224,.43)'; context.font = '8px ui-monospace, monospace'; context.textAlign = 'center'; context.textBaseline = 'middle';
          context.fillText(degree === 0 ? '0° / 360°' : `${degree}°`, 0, 0); context.restore();
        }
      }
      // Three independently inclined great circles make a turning wire gyroscope.
      for (let axis = 0; axis < 3; axis++) {
        const rotation = spin + axis * Math.PI / 3 + loose * (axis + 1) * 1.4 * (axis % 2 ? -1 : 1);
        const tilt = Math.min(1, .28 + Math.abs(Math.sin(spin * .7 + axis * 1.6)) * .45 + loose * .5);
        context.save(); context.translate(cx, cy); context.rotate(rotation);
        stroke(.40); context.beginPath(); context.ellipse(0, 0, radius * .77, radius * .77 * tilt, 0, 0, tau); context.stroke();
        stroke(.11); context.beginPath(); context.ellipse(0, 0, radius * .75, radius * .75 * tilt, 0, 0, tau); context.stroke();
        context.restore();
      }
      stroke(.38); context.beginPath(); context.moveTo(cx - 7, cy); context.lineTo(cx + 7, cy); context.moveTo(cx, cy - 7); context.lineTo(cx, cy + 7); context.stroke();
      circle(3, .55);
      const nodes = live.current.projects.slice(0, 12);
      nodes.forEach((project, index) => {
        const angle = index * tau / Math.max(1, nodes.length) - Math.PI / 4 + spin * .22 + loose * Math.PI;
        const orbit = radius * .92 * (1 + loose * .7);
        const x = cx + Math.cos(angle) * orbit, y = cy + Math.sin(angle) * orbit;
        if (index === active) {
          context.save(); context.shadowColor='#f5f5f5';context.shadowBlur=live.current.speaking?12:5;
          stroke(.88); context.lineWidth = 1;
          context.beginPath(); context.moveTo(cx, cy); context.lineTo(x, y); context.stroke();context.restore();
          stroke(.30); context.beginPath(); context.arc(x, y, 19 + resonance * 3, 0, tau); context.stroke();
        }
        context.fillStyle = '#090909'; context.beginPath(); context.arc(x, y, 12, 0, tau); context.fill();
        stroke(index === active ? .95 : .35); context.beginPath(); context.arc(x, y, 12, 0, tau); context.stroke();
        context.fillStyle = index === active ? '#fafafa' : 'rgba(229,229,229,.65)'; context.font = '9px ui-monospace, monospace'; context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillText(project.id.replace('artifact-',''), x, y + .5);
      });
      if (live.current.speaking) {
        stroke(.4); context.beginPath();
        for (let sample = 0; sample <= 80; sample++) {
          const x = cx - radius * .32 + sample / 80 * radius * .64;
          const envelope = Math.sin(sample / 80 * Math.PI) ** 2;
          const y = cy + Math.sin(sample * .68 + (motion.matches ? 0 : phase * 8)) * envelope * radius * .055 * resonance;
          if (sample === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      }
      // The lock: one bright ring pulse as the instrument comes together.
      if (lock > .7 && lock < 1) { context.globalAlpha = 1; stroke((1 - lock) * 2.2); context.beginPath(); context.arc(cx, cy, radius * 1.065, 0, tau); context.stroke(); }
      context.globalAlpha = 1;
      if (!motion.matches) frame = requestAnimationFrame(draw);
    }
    const redraw = () => {
      cancelAnimationFrame(frame);
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      previous = performance.now(); draw(previous);
    };
    redrawRef.current = redraw;
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    motion.addEventListener('change', redraw);
    redraw();
    return () => { disposed = true; redrawRef.current = null; cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener('change', redraw); };
  }, []);

  // Redraw a static reduced-motion canvas when the current artifact changes.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) redrawRef.current?.();
  }, [speaking, artifactId, projects]);

  return <div className="council-astrolabe" aria-hidden="true"><canvas ref={canvasRef} /><span className="council-astrolabe__caption">{speaking ? 'VOICE / RESONATING' : artifactId ? 'ARCHIVE / VECTOR LOCKED' : 'COUNCIL / AWAITING SIGNAL'}</span></div>;
}
