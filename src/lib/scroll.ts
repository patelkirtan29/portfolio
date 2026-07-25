"use client";

/**
 * Scroll Engine — single canonical scroll source for the site.
 *
 * A Lenis singleton plus a tiny external store (subscribe/getSnapshot, wired
 * through `useSyncExternalStore`) that other rooms/components read from
 * instead of standing up their own scroll listeners. This keeps "one scroll
 * system" true in practice, not just in the design doc.
 *
 * Stable exports other streams should code against:
 *   - ROOM_IDS / RoomId        canonical room id list, in page order
 *   - ROOM_LABELS              canonical human-readable label per room id
 *   - initLenis() / destroyLenis()   lifecycle (owned by ScrollProvider)
 *   - getLenis()               imperative access outside React (e.g. rAF loops)
 *   - scrollToRoom(id, opts?)  smooth-scroll (or native-scroll fallback) to a room
 *   - prefersReducedMotion()   shared reduced-motion check
 *   - useLenis()               hook -> Lenis instance | null
 *   - useScrollProgress()      hook -> number 0..1 (overall page scroll progress)
 *   - useCurrentRoom()         hook -> RoomId | null (room under viewport center)
 *   - useScrollVelocity()      hook -> number (signed Lenis velocity, last frame)
 */

import { useSyncExternalStore } from "react";
import Lenis, { type ScrollToOptions } from "lenis";

/** Canonical room ids, in page order. Must match each room section's `id` attribute. */
export const ROOM_IDS = ["lobby", "practice", "gallery", "signal"] as const;
export type RoomId = (typeof ROOM_IDS)[number];

/** Canonical human-readable label per room — single-sourced alongside `ROOM_IDS`
 *  so nav/palette/etc. never drift out of sync when a room is renamed. */
export const ROOM_LABELS: Record<RoomId, string> = {
  lobby: "Lobby",
  practice: "Practice",
  gallery: "Gallery",
  signal: "Signal",
};

interface ScrollState {
  lenis: Lenis | null;
  progress: number;
  velocity: number;
  currentRoom: RoomId | null;
}

type Listener = () => void;

let state: ScrollState = {
  lenis: null,
  progress: 0,
  velocity: 0,
  currentRoom: null,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<ScrollState>) {
  state = { ...state, ...partial };
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shared reduced-motion check — used by ScrollProvider (snap/lerp) and any room reveal. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function computeCurrentRoom(): RoomId | null {
  if (typeof document === "undefined") return null;
  const mid = window.innerHeight / 2;
  for (const id of ROOM_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= mid && rect.bottom >= mid) return id;
  }
  return null;
}

/**
 * Create (or return the existing) Lenis singleton. Idempotent, so it's safe
 * to call from an effect that may double-invoke in dev/Strict Mode.
 *
 * Does NOT start its own rAF loop — the caller (ScrollProvider) drives
 * `lenis.raf()` via `gsap.ticker` so there is exactly one animation clock
 * feeding both Lenis and ScrollTrigger.
 */
export function initLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (state.lenis) return state.lenis;

  const reduced = prefersReducedMotion();

  const lenis = new Lenis({
    smoothWheel: !reduced,
    syncTouch: false,
    lerp: reduced ? 1 : 0.1,
    autoRaf: false,
    anchors: true,
  });

  lenis.on("scroll", (instance) => {
    setState({
      progress: instance.progress,
      velocity: instance.velocity,
      currentRoom: computeCurrentRoom(),
    });
  });

  setState({ lenis, currentRoom: computeCurrentRoom() });
  return lenis;
}

/** Tear down the singleton. Safe to call even if never initialized. */
export function destroyLenis(): void {
  state.lenis?.destroy();
  setState({ lenis: null, progress: 0, velocity: 0, currentRoom: null });
}

/** Imperative access to the Lenis instance outside of React (event handlers, rAF loops). */
export function getLenis(): Lenis | null {
  return state.lenis;
}

/** Imperative snapshot of scroll progress (0..1) outside of React. */
export function getScrollProgress(): number {
  return state.progress;
}

/** Imperative snapshot of the room currently under the viewport's vertical center. */
export function getCurrentRoom(): RoomId | null {
  return state.currentRoom;
}

/**
 * Scroll (smoothly via Lenis, or natively if Lenis isn't active/initialized —
 * e.g. reduced-motion mode) to the given room's `id` element.
 */
export function scrollToRoom(id: RoomId | string, options?: ScrollToOptions): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = state.lenis;
  if (lenis && !prefersReducedMotion()) {
    lenis.scrollTo(el, { offset: 0, ...options });
  } else {
    el.scrollIntoView({ behavior: "auto", block: "start" });
  }
}

// ---- React hooks (external store) -----------------------------------------

/** Reactive Lenis instance — null before init (SSR / before ScrollProvider mounts) or if reduced motion never created one. */
export function useLenis(): Lenis | null {
  return useSyncExternalStore(
    subscribe,
    () => state.lenis,
    () => null,
  );
}

/** Reactive overall page scroll progress, 0..1. General-purpose whole-page progress signal for any consumer that needs it. */
export function useScrollProgress(): number {
  return useSyncExternalStore(
    subscribe,
    () => state.progress,
    () => 0,
  );
}

/** Reactive id of the room currently centered in the viewport, for wayfinding UI. */
export function useCurrentRoom(): RoomId | null {
  return useSyncExternalStore(
    subscribe,
    () => state.currentRoom,
    () => null,
  );
}

/** Reactive last-known Lenis velocity (signed; ~0 at rest). */
export function useScrollVelocity(): number {
  return useSyncExternalStore(
    subscribe,
    () => state.velocity,
    () => 0,
  );
}
