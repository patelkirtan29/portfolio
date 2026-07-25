"use client";

/**
 * ScrollProvider — wires up the site's single scroll system.
 *
 * - Initializes the Lenis singleton (src/lib/scroll.ts) and drives it from
 *   `gsap.ticker` (the officially recommended Lenis+GSAP integration), so
 *   there is exactly one animation clock feeding both Lenis and ScrollTrigger.
 * - Registers `gsap/ScrollTrigger` and keeps it in sync with Lenis's scroll
 *   event, so any ScrollTrigger instance created by other rooms (reveals,
 *   Gallery re-flow, etc.) reads from the same clock.
 * - Implements room-snap pacing on top of Lenis's velocity/idle behavior
 *   instead of native CSS `scroll-snap-type` (which fights Lenis's input
 *   interception): once scroll velocity settles near zero and the viewport
 *   is within a small band of a room boundary, it nudges the rest of the
 *   way there with `scrollToRoom`.
 * - Respects `prefers-reduced-motion`: no Lenis smoothing, no snap-jumping —
 *   native scroll takes over entirely. ScrollTrigger still works in this
 *   mode (it falls back to listening to native window scroll).
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ROOM_IDS, destroyLenis, initLenis, prefersReducedMotion, scrollToRoom } from "@/lib/scroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** How long (ms) velocity must stay under the threshold before we try to snap. */
const SNAP_IDLE_MS = 120;
/** Lenis velocity magnitude below which scroll is considered "settled." */
const SNAP_VELOCITY_THRESHOLD = 0.05;
/** Fraction of viewport height around a room's top edge that counts as "near enough" to snap. */
const SNAP_ZONE_RATIO = 0.12;
/**
 * Room-boundary distances are only trusted if the document hasn't reflowed
 * in the last this-many ms. Guards against async content (e.g. Gallery's
 * GitHub-backed grid landing) growing the page height right as `trySnap`
 * evaluates boundary distances — a room edge that *looks* inside the snap
 * zone at that instant may just be a layout-in-flux artifact, not the user's
 * genuine resting position.
 */
const LAYOUT_SETTLE_MS = 250;

export default function ScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnapping = useRef(false);
  const lastLayoutChangeAt = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Native scroll only: no Lenis instance, no snap-jumping. ScrollTrigger
      // still works fine against native window scroll for any room reveals.
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => cancelAnimationFrame(raf);
    }

    const lenis = initLenis();
    if (!lenis) return;

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const onScrollTriggerSync = () => ScrollTrigger.update();
    lenis.on("scroll", onScrollTriggerSync);

    const trySnap = () => {
      if (isSnapping.current) return;
      if (Math.abs(lenis.velocity) > SNAP_VELOCITY_THRESHOLD) return;
      // Defense-in-depth against async reflows (e.g. Gallery's GitHub data
      // landing and growing document height): don't trust boundary-distance
      // math computed while the layout is still settling.
      if (performance.now() - lastLayoutChangeAt.current < LAYOUT_SETTLE_MS) return;

      const viewportHeight = window.innerHeight;
      const zone = viewportHeight * SNAP_ZONE_RATIO;

      for (const id of ROOM_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const distanceFromTop = Math.abs(el.getBoundingClientRect().top);
        if (distanceFromTop > 0 && distanceFromTop < zone) {
          isSnapping.current = true;
          scrollToRoom(id, {
            duration: 0.8,
            onComplete: () => {
              isSnapping.current = false;
            },
          });
          return;
        }
      }
    };

    const onScrollForSnap = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(trySnap, SNAP_IDLE_MS);
    };
    lenis.on("scroll", onScrollForSnap);

    // Track document reflows (e.g. Gallery's async GitHub grid landing) so
    // `trySnap` can refuse to trust boundary distances computed mid-flux.
    lastLayoutChangeAt.current = performance.now();
    const resizeObserver = new ResizeObserver(() => {
      lastLayoutChangeAt.current = performance.now();
    });
    resizeObserver.observe(document.body);

    const refreshRaf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshRaf);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      resizeObserver.disconnect();
      lenis.off("scroll", onScrollTriggerSync);
      lenis.off("scroll", onScrollForSnap);
      gsap.ticker.remove(onTick);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
