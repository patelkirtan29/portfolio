import { useEffect, useRef } from 'react';
import { REVEAL_TIMING, revealQuote, revealMetrics } from '../lib/councilReveal';
import './reveal.css';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;
const easeInOut = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

type Props = { startedAt: number; originY: number; metrics?: string[] };

/**
 * Beats 1–2 of the Résumé Implosion, painted beneath the live Council shell.
 * Pointer-transparent: the command line underneath keeps focus and input.
 */
export default function CouncilReveal({ startedAt, originY, metrics = [...revealMetrics] }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const surface = canvas.current;
    const context = surface?.getContext('2d');
    if (!surface || !context) return;
    let frame = 0, width = 1, height = 1, disposed = false;

    const paint = () => {
      frame = 0;
      if (disposed) return;
      const elapsed = Math.max(0, performance.now() - startedAt);
      const middle = height / 2;
      const origin = Math.max(0, Math.min(height, originY));
      context.clearRect(0, 0, width, height);

      // Beat 1a — the hairline unfurls downward into the obsidian chamber.
      const down = easeOut(elapsed / 380);
      const up = easeOut((elapsed - 240) / 280);
      const top = origin * (1 - up);
      const bottom = origin + (height - origin) * down;
      context.fillStyle = '#090909';
      context.fillRect(0, top, width, bottom - top);
      if (down < 1) {
        context.globalAlpha = 1 - down * .6;
        context.fillStyle = '#f5f5f5';
        context.fillRect(0, bottom - .5, width, 1);
        context.globalAlpha = 1;
      }

      context.save();
      context.beginPath(); context.rect(0, top, width, bottom - top); context.clip();

      // Beat 1b — cold telemetry ticks, then collapses inward behind the slice.
      const front = width * easeInOut((elapsed - REVEAL_TIMING.slice) / (REVEAL_TIMING.assemble - REVEAL_TIMING.slice - 40));
      if (elapsed < REVEAL_TIMING.assemble + 80) {
        const columnWidth = width < 650 ? 155 : 200;
        const columns = Math.ceil(width / columnWidth) + 1;
        const rows = Math.ceil(height / 22) + 1;
        const tick = Math.floor(elapsed / 70);
        context.font = `${width < 650 ? 9 : 10.5}px "DM Mono", ui-monospace, monospace`;
        context.textBaseline = 'middle';
        context.fillStyle = '#f5f5f5';
        for (let column = 0; column < columns; column += 1) {
          const x = column * columnWidth - 10;
          const collapse = easeInOut((front - x) / (width * .22));
          for (let row = 0; row < rows; row += 1) {
            const y = row * 22 + 11 - (elapsed * .05 % 22);
            const brightness = .12 + ((column * 13 + row * 7) % 11) / 26;
            const alpha = brightness * (1 - collapse) * clamp(elapsed / 90);
            if (alpha < .01) continue;
            context.globalAlpha = alpha;
            context.fillText(metrics[(column + row + tick) % Math.max(1, metrics.length)] || "PROFILE / ARCHIVE", x, middle + (y - middle) * (1 - collapse * .96));
          }
        }
        context.globalAlpha = 1;
      }

      // The luminous voice wave: slices left→right, then calms into stillness.
      if (elapsed >= REVEAL_TIMING.slice && elapsed < 1000) {
        const calm = easeInOut((elapsed - REVEAL_TIMING.assemble) / 380);
        const amplitude = Math.min(26, height * .04) * (1 - calm);
        context.globalAlpha = 1 - calm;
        context.strokeStyle = '#f5f5f5';
        context.lineWidth = 1.2;
        context.shadowColor = '#ffffff';
        context.shadowBlur = 14;
        context.beginPath();
        for (let x = 0; x <= front; x += 3) {
          const distance = (x - front) / Math.max(1, width);
          const envelope = Math.exp(-distance * distance * 30) * .85 + .15;
          const y = middle + Math.sin(x * .05 - elapsed * .03) * Math.sin(x * .011 + elapsed * .004) * amplitude * envelope;
          if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
        context.shadowBlur = 0;
        context.globalAlpha = 1;
      }
      context.restore();

      if (elapsed < REVEAL_TIMING.settle) frame = requestAnimationFrame(paint);
    };

    const resize = () => {
      const box = surface.getBoundingClientRect();
      width = Math.max(1, box.width); height = Math.max(1, box.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Resizing keeps the original clock; only the surface is rebuilt.
      if (frame) cancelAnimationFrame(frame);
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [startedAt, originY, metrics]);

  return <div className="council-reveal" aria-hidden="true">
    <canvas ref={canvas} />
    <p className="council-reveal-quote">{revealQuote}</p>
  </div>;
}
