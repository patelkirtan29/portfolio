'use client';

import { useRef, useState, useEffect } from 'react';

interface PhysicsElement {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  spacer: HTMLElement;
}

export default function GravityEffect() {
  const [active, setActive] = useState(false);
  const stateRef = useRef<PhysicsElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const removersRef = useRef<(() => void)[] | null>(null);
  const dragRef = useRef<{
    el: PhysicsElement;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    pointerId?: number;
  } | null>(null);

  function startPhysics(elements: PhysicsElement[]) {
    if (rafRef.current !== null) return;

    function frame() {
      const winH = window.innerHeight;

      for (const obj of elements) {
        if (dragRef.current?.el === obj) continue;

        obj.vy += 0.4;
        obj.vx *= 0.97;
        obj.x += obj.vx;
        obj.y += obj.vy;

        const maxY = winH - obj.height;
        if (obj.y >= maxY) {
          obj.y = maxY;
          obj.vy = -Math.abs(obj.vy) * 0.6;
          obj.vx *= 0.85;
          if (Math.abs(obj.vy) < 1) obj.vy = 0;
        }

        const maxX = window.innerWidth - obj.width;
        if (obj.x < 0) { obj.x = 0; obj.vx = Math.abs(obj.vx) * 0.6; }
        if (obj.x > maxX) { obj.x = maxX; obj.vx = -Math.abs(obj.vx) * 0.6; }

        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function makeDraggable(obj: PhysicsElement) {
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = obj.el.getBoundingClientRect();
      dragRef.current = {
        el: obj,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: performance.now(),
        pointerId: e.pointerId,
      };
      try { obj.el.setPointerCapture(e.pointerId); } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragRef.current?.el !== obj) return;
      const now = performance.now();
      const dt = now - dragRef.current.lastTime || 16;
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;

      obj.vx = ((e.clientX - dragRef.current.lastX) / dt) * 16;
      obj.vy = ((e.clientY - dragRef.current.lastY) / dt) * 16;

      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      dragRef.current.lastTime = now;

      obj.x = newX;
      obj.y = newY;
      obj.el.style.transform = `translate(${newX}px, ${newY}px)`;
    };

    const onPointerUp = () => {
      if (dragRef.current?.el === obj) {
        try {
          if (typeof dragRef.current.pointerId === 'number') {
            obj.el.releasePointerCapture(dragRef.current.pointerId);
          }
        } catch {}
        dragRef.current = null;
      }
    };

    obj.el.addEventListener('pointerdown', onPointerDown);
    obj.el.addEventListener('pointermove', onPointerMove);
    obj.el.addEventListener('pointerup', onPointerUp);

    return () => {
      try {
        if (dragRef.current?.el === obj && typeof dragRef.current.pointerId === 'number') {
          obj.el.releasePointerCapture(dragRef.current.pointerId);
        }
      } catch {}
      obj.el.removeEventListener('pointerdown', onPointerDown);
      obj.el.removeEventListener('pointermove', onPointerMove);
      obj.el.removeEventListener('pointerup', onPointerUp);
    };
  }

  function activate() {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('[data-gravity]'),
    );
    if (targets.length === 0) return;

    const physicsEls: PhysicsElement[] = targets.map((el) => {
      const rect = el.getBoundingClientRect();

      // Create a spacer to hold the layout space
      const spacer = document.createElement('div');
      spacer.style.width = `${rect.width}px`;
      spacer.style.height = `${rect.height}px`;
      spacer.style.display = 'block';
      el.parentElement?.insertBefore(spacer, el);

      // Detach element to fixed position
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.margin = '0';
      el.style.zIndex = '40';
      el.style.cursor = 'grab';
      el.style.userSelect = 'none';
      el.style.width = `${rect.width}px`;
      el.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      document.body.appendChild(el);

      return {
        el,
        x: rect.left,
        y: rect.top,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        width: rect.width,
        height: rect.height,
        spacer,
      };
    });

    stateRef.current = physicsEls;
    // keep remover functions so we can cleanly remove listeners later
    const removers = physicsEls.map(makeDraggable);
    removersRef.current = removers;
    startPhysics(physicsEls);
  }

  function deactivate() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragRef.current = null;

    // Remove pointer listeners
    if (removersRef.current) {
      removersRef.current.forEach((r) => r());
      removersRef.current = null;
    }

    for (const obj of stateRef.current) {
      obj.el.style.transition = 'transform 0.8s ease-in-out';
      obj.el.style.transform = 'translate(0px, 0px)';

      setTimeout(() => {
        obj.spacer.parentElement?.insertBefore(obj.el, obj.spacer);
        obj.spacer.remove();

        obj.el.style.position = '';
        obj.el.style.left = '';
        obj.el.style.top = '';
        obj.el.style.margin = '';
        obj.el.style.zIndex = '';
        obj.el.style.cursor = '';
        obj.el.style.userSelect = '';
        obj.el.style.width = '';
        obj.el.style.transition = '';
        obj.el.style.transform = '';
      }, 850);
    }

    stateRef.current = [];
  }

  // Ensure we cleanup if the component unmounts while active
  useEffect(() => {
    return () => {
      deactivate();
    };
  }, []);

  function toggle() {
    if (active) {
      deactivate();
      setActive(false);
    } else {
      activate();
      setActive(true);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={active ? 'Disable gravity effect' : 'Enable gravity effect'}
      title={active ? 'Reset gravity' : 'Go antigravity'}
      className="fixed bottom-4 right-4 z-50 rounded-full p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-md select-none"
    >
      {active ? (
        // Reset / up arrow icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      ) : (
        // G / gravity icon (down arrow)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
    </button>
  );
}
