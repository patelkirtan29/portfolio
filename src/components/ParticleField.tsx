'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  va: number;
  rx: number;
  ry: number;
  alpha: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = 0;
    let H = 0;
    let particles: Particle[] = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const make = (): Particle => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      angle: Math.random() * Math.PI,
      va: (Math.random() - 0.5) * 0.006,
      rx: Math.random() * 1.2 + 0.8,
      ry: Math.random() * 4 + 2.5,
      alpha: Math.random() * 0.4 + 0.15,
    });

    const frame = () => {
      ctx.clearRect(0, 0, W, H);

      const isDark = document.documentElement.classList.contains('dark');
      const [r, g, b] = isDark ? [147, 197, 253] : [37, 99, 235];

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.va;

        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    particles = Array.from({ length: 140 }, make);
    frame();

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
