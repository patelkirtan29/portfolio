"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Tracks 0..1 scroll progress across the hero container's own scroll
 * distance: 0 while the container's top is at (or below) the viewport
 * top, climbing to 1 once it has scrolled fully past the top of the
 * viewport — i.e. "as the visitor scrolls past the hero into the rest of
 * Home." This is scoped entirely to this component's mount lifecycle
 * (the listener is added/removed with it, tied to whatever mounts this
 * hook), so it never persists across routes or reaches outside the Home
 * page — there is no cross-route hand-off here by construction.
 */
export function useScrollExit(containerRef: RefObject<HTMLElement | null>): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distance = rect.height || 1;
      const raw = -rect.top / distance;
      progress.current = Math.min(1, Math.max(0, raw));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [containerRef]);

  return progress;
}
