import { useEffect, useRef, useState } from 'react';
import './hairline.css';

interface Props {
  onSummon: () => void;
  disabled: boolean;
}

/** A header rule that becomes an acoustic string only in a visitor's presence. */
export default function AcousticHairline({ onSummon, disabled }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const callback = useRef(onSummon);
  const [near, setNear] = useState(false);
  const [focused, setFocused] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const activate = useRef<() => void>(() => {});
  callback.current = onSummon;

  useEffect(() => {
    const element = root.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const context = surface.getContext('2d');
    if (!context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1;
    let ratio = 1;
    let frame = 0;
    let dwell = 0;
    let active = false;
    let summoned = false;
    let pointerX = 0;
    let target = 0;
    let displacement = 0;
    let velocity = 0;
    let tick = 0;
    let lineColor = '';

    const clearDwell = () => { window.clearTimeout(dwell); dwell = 0; };
    const summon = () => {
      if (disabled || summoned) return;
      summoned = true;
      clearDwell();
      callback.current();
    };
    activate.current = summon;

    const paint = () => {
      frame = 0;
      context.clearRect(0, 0, width, 112);
      context.strokeStyle = lineColor;
      context.lineWidth = 1;
      context.beginPath();
      // Align the resting stroke to device pixels at every density.
      const baseline = (Math.round(48 * ratio) + ratio / 2) / ratio;
      for (let x = 0; x <= width; x += 2) {
        const distance = x - pointerX;
        const envelope = Math.exp(-distance * distance / (2 * 110 * 110));
        const ripple = reduced.matches ? 0 : Math.sin(distance * .045 - tick * .12) * Math.abs(velocity) * 1.8;
        const y = baseline + (displacement + ripple) * envelope;
        if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.lineTo(width, baseline);
      context.stroke();
      if (!reduced.matches) {
        velocity = (velocity + (target - displacement) * .075) * .82;
        displacement += velocity;
        tick += 1;
        if (Math.abs(displacement - target) > .025 || Math.abs(velocity) > .025) frame = requestAnimationFrame(paint);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const resize = () => {
      width = element.getBoundingClientRect().width;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.max(1, Math.round(width * ratio));
      surface.height = Math.round(112 * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      lineColor = getComputedStyle(element).getPropertyValue('--line').trim();
      schedule();
    };
    const leave = () => {
      active = false;
      target = 0;
      clearDwell();
      setNear(false);
      schedule();
    };
    const move = (event: PointerEvent) => {
      if (disabled || event.pointerType === 'touch') return;
      const box = element.getBoundingClientRect();
      const distance = event.clientY - box.top;
      const interactive = event.target instanceof Element && event.target.closest('a,button,input,textarea,select,[contenteditable="true"]');
      const within = Math.abs(distance) <= 26 && !interactive;
      if (!within) { if (active) leave(); return; }
      pointerX = event.clientX - box.left;
      target = reduced.matches ? 0 : Math.max(-13, Math.min(22, distance * .65));
      setNear(true);
      if (!active) { active = true; summoned = false; }
      if (Math.abs(distance) <= 9) {
        if (!dwell && !summoned && !drag.current) dwell = window.setTimeout(summon, 850);
      } else clearDwell();
      schedule();
    };
    const motion = () => { displacement = 0; velocity = 0; target = 0; schedule(); };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const theme = new MutationObserver(resize);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    reduced.addEventListener('change', motion);
    resize();
    return () => {
      clearDwell();
      cancelAnimationFrame(frame);
      observer.disconnect();
      theme.disconnect();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      reduced.removeEventListener('change', motion);
      activate.current = () => {};
      drag.current = null;
    };
  }, [disabled]);

  return <div ref={root} className="acoustic-hairline" data-awake={!disabled && (near || focused) ? 'true' : 'false'}>
    <canvas ref={canvas} aria-hidden="true" />
    <div className="acoustic-hairline-hitbar" role="button" tabIndex={disabled ? -1 : 0}
      aria-label="Summon Herald" aria-describedby="acoustic-hairline-caption" aria-disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!disabled) activate.current(); }
      }}
      onPointerDown={event => {
        if (disabled || event.button !== 0) return;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (drag.current?.id === event.pointerId && event.clientY - drag.current.y >= 28) {
          drag.current = null;
          activate.current();
        }
      }}
      onPointerUp={event => {
        const start = drag.current;
        drag.current = null;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12) activate.current();
      }}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}
      onClick={event => { if (event.detail === 0 && !disabled) activate.current(); }} />
    <span id="acoustic-hairline-caption" className="acoustic-hairline-caption">Say ‘Hey’, press /, or start typing to summon.</span>
  </div>;
}
