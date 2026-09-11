"use client";

import { useEffect, useRef, useState } from "react";
import { DeskCanvas } from "./DeskCanvas";
import { ReducedMotionFallback } from "./ReducedMotionFallback";
import { useCursorParallax } from "./hooks/useCursorParallax";
import { useScrollExit } from "./hooks/useScrollExit";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Home hero — warm, low-poly paper-craft desk scene (Phase 1 spec, Canva
// concept: laptop/plant/mug/lamp/books/sticky-note, unfolds like a
// pop-up book on load, idles with small charm loops after) executed with
// the Figma spec's technical rigor: ACES tone mapping + sRGB output,
// damped-lerp cursor parallax, a coordinated scroll-exit (dolly + fade),
// capped DPR, and the full accessibility checklist. See
// workspace/portfolio_redesign/phase1_spectacle/hero_concept_{canva,figma}.md
//
// Mounts/unmounts with the Home route only — NOT a cross-route
// persistent canvas (see AmbientLayer for the sitewide ambient layer,
// which is separate). This component is itself loaded via
// `next/dynamic({ ssr: false })` from page.tsx; it additionally defers
// its own heavy Canvas mount by one idle tick below so the surrounding
// hero copy always paints first.
const SCROLL_FADE_START = 0.6;

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Shared, live-reactive reduced-motion detection (src/lib/
  // usePrefersReducedMotion.ts). This component only ever runs
  // client-side (dynamically imported with `ssr: false` — see
  // HeroSceneLoader.tsx), so there is no hydration boundary to reconcile
  // here: the hook's client `getSnapshot` is already correct on this
  // component's very first render, with no intermediate "unknown" state
  // to gate on (the tri-state `boolean | null` this used to carry was
  // dead code for exactly that reason — replaced by this shared hook).
  const prefersReducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  const parallaxTarget = useCursorParallax();
  const scrollProgress = useScrollExit(containerRef);

  // Defer the actual Canvas mount until the browser is idle (or a short
  // timeout as a fallback) so the ~600KB+ three.js/fiber bundle and its
  // first render never compete with the hero headline/copy for paint
  // time.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (win.requestIdleCallback) {
      const handle = win.requestIdleCallback(() => setReady(true));
      return () => win.cancelIdleCallback?.(handle);
    }
    const timeout = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(timeout);
  }, [prefersReducedMotion]);

  // Mount-in fade + scroll-exit fade both applied imperatively to the
  // same DOM node, deliberately outside React state/render — scrolling
  // must never trigger a React re-render of this subtree.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = containerRef.current;
    if (!el) return;
    el.style.opacity = "0";
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || !ready) return;
    const el = containerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion, ready]);

  useEffect(() => {
    if (prefersReducedMotion || !ready) return;
    let frame = 0;
    const applyScrollFade = () => {
      frame = 0;
      const el = containerRef.current;
      if (!el) return;
      const p = scrollProgress.current;
      const fade = 1 - Math.min(1, Math.max(0, (p - SCROLL_FADE_START) / (1 - SCROLL_FADE_START)));
      el.style.opacity = String(fade);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(applyScrollFade);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion, ready, scrollProgress]);

  if (prefersReducedMotion) {
    return (
      <div aria-hidden="true" role="presentation" className="w-full">
        <ReducedMotionFallback />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      // Deliberately not full-viewport, unlike both hero concept docs'
      // "full-viewport React Three Fiber scene" framing. Home is
      // documented (CREATIVE_DIRECTION_V2.md §6) as "a status/intro
      // moment, explicitly NOT a full 'Now' dashboard" — a full-viewport
      // 3D takeover would blow out that already-agreed-on compact,
      // centered Home layout (the existing `max-w-5xl` content column in
      // page.tsx). So the hero is deliberately boxed to a fraction of the
      // viewport (`42vh`, capped at `420px`) and laid out inline above the
      // H1, inside that same column, rather than resized to fill the
      // screen. This is a dimension/layout decision only — no code here
      // changes as a result of this comment.
      className="h-[42vh] max-h-[420px] min-h-[280px] w-full overflow-hidden rounded-2xl transition-opacity duration-700 ease-out"
    >
      {ready && <DeskCanvas parallaxTarget={parallaxTarget} scrollProgress={scrollProgress} />}
    </div>
  );
}
