"use client";

// Work section desk-object "trinket" — small 3D toy-physics decoration for
// the existing accessible disclosure cards on /work (see ProjectCard.tsx).
// Purely additive/decorative: hover wobble + drag-and-settle via spring
// motion. Never replaces or gates the real keyboard-operable,
// screen-reader-labeled disclosure trigger underneath (aria-hidden below).
//
// This file is deliberately a thin, lazy-mount wrapper — it holds no
// three.js/@react-three/fiber imports itself. Two performance fixes live
// here, per the Phase 1 review:
//
// 1) Bundle deferral: the actual Canvas-bearing implementation
//    (TrinketCanvas.tsx) is loaded via a client-only `next/dynamic(...,
//    { ssr: false })` import, the same pattern
//    src/components/hero/HeroSceneLoader.tsx uses for the hero's
//    DeskCanvas. Previously `Trinket` (with its Canvas) was a plain
//    top-level import from ProjectCard.tsx, so the ~1.1MB combined
//    three.js/fiber chunks were script-tagged directly in /work's
//    server-rendered HTML shell — unlike the hero, which correctly
//    deferred. Routing the import through `dynamic()` here removes those
//    chunks from /work's initial HTML; they're now fetched client-side,
//    same as the hero's bundle.
//
// 2) Capped concurrent WebGL contexts: every ProjectCard used to mount its
//    own always-live <Canvas> with no visibility gating, so a long
//    Work-page session accumulates one live WebGL context per project
//    forever (browsers cap concurrent contexts, tighter on Safari). The
//    IntersectionObserver below only renders <TrinketCanvas> (and thus
//    only creates its WebGL context) while this trinket is in the
//    viewport or within `rootMargin` of it, and unmounts it (letting
//    React/R3F's default dispose-on-unmount behavior tear down the
//    context) once it's scrolled further away than that. The wrapper div
//    always reserves the final `size x size` footprint, mounted or not,
//    so there's no layout shift when the Canvas mounts/unmounts.
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Project } from "./projects";

const TrinketCanvas = dynamic(() => import("./TrinketCanvas"), { ssr: false });

export type TrinketProps = {
  project: Project;
  /** Pixel size of the (square) canvas — kept thumbnail/icon-sized. */
  size?: number;
};

// How far outside the actual viewport a trinket is still considered
// "near enough" to mount — a small buffer so the Canvas is already live by
// the time it scrolls into view, rather than popping in a frame late.
const ROOT_MARGIN = "200px";

export default function Trinket({ project, size = 64 }: TrinketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="shrink-0 select-none"
    >
      {isNearViewport && <TrinketCanvas project={project} size={size} />}
    </div>
  );
}
