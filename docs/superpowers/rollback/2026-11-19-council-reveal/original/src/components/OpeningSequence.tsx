import { useEffect, useRef } from 'react';
import './opening.css';

const DURATION = 2200;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** Procedural figures are a typographic overture, never claims about the owner. */
function ledgerValue(column: number, row: number, tick: number) {
  const seed = (column * 7919 + row * 104729 + tick * (row % 7 + 3)) >>> 0;
  switch ((column + row) % 5) {
    case 0: return `${1994 + seed % 33} / ${String(seed % 12 + 1).padStart(2, '0')}`;
    case 1: return `${(seed % 99999).toLocaleString('en-US').padStart(6, '0')} +`;
    case 2: return `${(seed % 9800 / 100).toFixed(2)} %`;
    case 3: return `${(seed % 9000 / 10).toFixed(1)} ms`;
    default: return `${String(seed % 24).padStart(2, '0')}:${String(seed % 60).padStart(2, '0')}:${String((seed >>> 4) % 60).padStart(2, '0')}`;
  }
}

export default function OpeningSequence() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = root.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const context = surface.getContext('2d');
    if (!context) {
      element.dataset.fallback = 'true';
      return;
    }
    const started = performance.now();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let width = 1;
    let height = 1;
    let ratio = 1;
    let lineColor = 'rgba(10,10,10,.12)';
    let disposed = false;

    const paint = (now: number) => {
      frame = 0;
      if (disposed) return;
      const elapsed = Math.min(DURATION, Math.max(0, now - started));
      const beat = elapsed < 1000 ? 'ledger' : elapsed < 1600 ? 'voice' : 'reveal';
      if (element.dataset.beat !== beat) element.dataset.beat = beat;
      const dissolve = ease((elapsed - 1000) / 600);
      const reveal = ease((elapsed - 1600) / 600);
      const middle = height / 2;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#090909';
      // Separate opaque curtains expose the real, already-mounted page.
      if (elapsed < 1600) context.fillRect(0, 0, width, height);
      else {
        context.fillRect(0, 0, width, middle * (1 - reveal));
        const lower = middle + (height - middle) * reveal;
        context.fillRect(0, lower, width, height - lower);
      }

      if (elapsed < 1600) {
        const columns = Math.ceil(width / 116) + 1;
        const rows = Math.ceil(height / 24) + 1;
        const tick = Math.floor(Math.min(elapsed, 1000) / 42);
        const rowOffset = (height % 24) / 2;
        context.font = '11px "DM Mono", monospace';
        context.textBaseline = 'middle';
        context.fillStyle = '#f5f5f5';
        for (let row = 0; row < rows; row += 1) {
          const originY = row * 24 + rowOffset - (Math.min(elapsed, 1000) * .065 % 24);
          const direction = originY < middle ? -1 : 1;
          const distance = Math.abs(originY - middle);
          // The acoustic cut clears the center first, then throws the ledger out.
          const sliced = clamp((dissolve * (middle + 100) - distance) / 105);
          for (let column = 0; column < columns; column += 1) {
            const brightness = .16 + ((column * 13 + row * 7) % 11) / 23;
            context.globalAlpha = brightness * (1 - dissolve) * (1 - sliced);
            const spread = (column - columns / 2) * dissolve * 32;
            context.fillText(ledgerValue(column, row, tick), column * 116 - 14 + spread,
              originY + direction * dissolve * (38 + distance * .13));
          }
        }
        context.globalAlpha = 1;
      }

      if (elapsed >= 1000) {
        const slice = clamp((elapsed - 1000) / 600);
        const baseline = middle + (64.5 - middle) * reveal;
        const amplitude = elapsed < 1600
          ? Math.sin(Math.PI * slice) * Math.min(34, height * .055)
          : 3 * (1 - reveal) ** 3;
        const wave = () => {
          context.beginPath();
          for (let x = 0; x < width; x += 2) {
            const position = (x - width / 2) / Math.max(1, width);
            const envelope = Math.exp(-position * position * 24);
            const y = baseline + Math.sin(x * .045 - (elapsed - 1000) * .013) * envelope * amplitude;
            if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
          }
          context.lineTo(width, baseline);
          context.stroke();
        };
        context.lineWidth = 1;
        context.strokeStyle = '#f5f5f5';
        context.globalAlpha = 1 - reveal;
        wave();
        context.strokeStyle = lineColor;
        context.globalAlpha = reveal;
        wave();
        context.globalAlpha = 1;
      }
      if (elapsed < DURATION && !motion.matches) frame = requestAnimationFrame(paint);
    };
    const resize = () => {
      const box = element.getBoundingClientRect();
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      lineColor = getComputedStyle(element).getPropertyValue('--line').trim() || lineColor;
      // Resize preserves the original clock and the pending animation frame.
      if (frame) cancelAnimationFrame(frame);
      paint(performance.now());
    };
    const theme = new MutationObserver(() => {lineColor = getComputedStyle(element).getPropertyValue('--line').trim() || lineColor;});
    theme.observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      theme.disconnect();
    };
  }, []);

  return <div className="herald-opening" ref={root} data-beat="ledger" aria-label="Herald opening">
    <canvas ref={canvas} aria-hidden="true" />
    <span className="herald-opening-index" aria-hidden="true">HERALD / AN ILLUSTRATIVE LEDGER</span>
    <p className="herald-opening-quote">Why read the numbers when you can ask the Herald?</p>
    <button className="herald-opening-skip" type="button" aria-label="Skip opening">Skip opening <span aria-hidden="true">↗</span></button>
  </div>;
}
