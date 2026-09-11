"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export interface ParallaxTarget {
  /** -1..1 across the viewport width */
  x: number;
  /** -1..1 across the viewport height */
  y: number;
}

/**
 * Tracks the raw pointer position as a -1..1 target — the damped lerp
 * toward this target happens once per frame in CameraRig, not here. Per
 * the Figma spec's technical standard: "a snappy 1:1 cursor follow reads
 * as a debug gizmo, not craft," so this hook deliberately does *not*
 * smooth anything itself; it just reports where the cursor currently is.
 */
export function useCursorParallax(): RefObject<ParallaxTarget> {
  const target = useRef<ParallaxTarget>({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      target.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return target;
}
