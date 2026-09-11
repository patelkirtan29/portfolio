"use client";

// Shared `prefers-reduced-motion` detection, used by every motion-gated
// piece sitewide (hero, trinkets' host cards, ambient layer, status strip,
// tilt cards, scroll reveals). Previously reimplemented five separate times
// (TiltCard.tsx, StatusStrip.tsx, useAmbientMotion.ts, HeroScene.tsx, and a
// non-reactive one-shot read in scroll-reveal.ts) — consolidated here so
// there is exactly one live-reactive implementation to maintain.
//
// Pattern: `useSyncExternalStore` subscribed to `matchMedia`'s `change`
// event, matching the best of the five prior implementations (TiltCard's/
// StatusStrip's near-identical hooks). This is the correct primitive for
// "external, mutable, possibly-SSR'd boolean" — unlike a `useState` +
// `useEffect` pair, it has no window where a stale value can render, and
// React's contract for `getServerSnapshot` means it degrades safely when a
// call site does render on the server.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// SSR has no window/matchMedia; default to "motion allowed" on the server
// and let the client snapshot correct it immediately (same fallback
// rationale every prior local implementation used).
function getServerSnapshot() {
  return false;
}

/**
 * Live-reactive `prefers-reduced-motion: reduce` read, shared across the
 * whole site. Reacts immediately if the OS/browser setting changes
 * mid-session — it is never a one-shot check.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
