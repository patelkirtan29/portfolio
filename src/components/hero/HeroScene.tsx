"use client";

import { useEffect, useRef, useState } from "react";
import { DeskCanvas } from "./DeskCanvas";
import { ReducedMotionFallback } from "./ReducedMotionFallback";
import { useCursorParallax } from "./hooks/useCursorParallax";
import { useScrollExit } from "./hooks/useScrollExit";

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
  // Lazy initializer reads the preference synchronously on first render
  // (this component only ever runs client-side — it's dynamically
  // imported with `ssr: false` — so `window` is always available here).
  // The effect below only *subscribes* to later changes; it never calls
  // setState synchronously from the effect body itself.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [ready, setReady] = useState(false);

  const parallaxTarget = useCursorParallax();
  const scrollProgress = useScrollExit(containerRef);

  // Keep the reduced-motion preference live in case the OS setting
  // changes mid-session (the initial read happens in the lazy useState
  // initializer above, not here).
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Defer the actual Canvas mount until the browser is idle (or a short
  // timeout as a fallback) so the ~600KB+ three.js/fiber bundle and its
  // first render never compete with the hero headline/copy for paint
  // time.
  useEffect(() => {
    if (prefersReducedMotion !== false) return;
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
    if (prefersReducedMotion !== false) return;
    const el = containerRef.current;
    if (!el) return;
    el.style.opacity = "0";
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion !== false || !ready) return;
    const el = containerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion, ready]);

  useEffect(() => {
    if (prefersReducedMotion !== false || !ready) return;
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

  // Avoid a hydration flash / layout shift: reserve the same footprint
  // until we know the user's motion preference.
  if (prefersReducedMotion === null) {
    return <div aria-hidden="true" className="h-[42vh] max-h-[420px] min-h-[280px] w-full" />;
  }

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
      className="h-[42vh] max-h-[420px] min-h-[280px] w-full overflow-hidden rounded-2xl transition-opacity duration-700 ease-out"
    >
      {ready && <DeskCanvas parallaxTarget={parallaxTarget} scrollProgress={scrollProgress} />}
    </div>
  );
}
