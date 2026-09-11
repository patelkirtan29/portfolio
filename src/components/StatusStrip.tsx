"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { motion, useAnimate } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Mock stat data — this is a from-scratch build with no metrics backend
 * wired up yet. The shape below ({ label, value, caption }[]) is written
 * to match what a real API response / server action would eventually
 * return, so swapping this constant for a real fetch later requires no
 * restructuring of the component below — just replace STATS with fetched
 * data of the same shape.
 *
 * Per the design-review correction in CREATIVE_DIRECTION_V2.md §5C: a raw
 * number ("1 push / 30d") reads as unimpressive on its own, so every stat
 * carries a one-line human caption alongside it.
 */
const STATS: { label: string; value: string; caption: string }[] = [
  { label: "commits", value: "1 push / 30d", caption: "steady, not flashy" },
  { label: "uptime", value: "99.98%", caption: "boring, in the best way" },
  {
    label: "response",
    value: "128ms TTFB",
    caption: "fast enough to disappear",
  },
  { label: "status", value: "shipping", caption: "small changes, often" },
];

/** How long one full marquee loop takes, in seconds. Kept slow — a visitor
 *  should be able to read each caption as it drifts by — per the ambient,
 *  non-competing brief in CREATIVE_DIRECTION_V2.md §5C. */
const MARQUEE_LOOP_SECONDS = 26;

/** Renders the simulated "last synced" heartbeat as a short human phrase. */
function formatSyncedAgo(seconds: number): string {
  if (seconds < 30) return "synced just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "synced under a minute ago";
  return `synced ${minutes}m ago`;
}

/** Shared markup for one stat+caption entry, reused for both the real
 *  list and its duplicate (see the marquee effect below for why there
 *  are two copies). Callers supply a unique `key` (prefixed per copy)
 *  since this component renders a single list item. */
function StatItem({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <li className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
      <span className="font-mono text-foreground">{stat.value}</span>
      <span className="font-mono text-[0.625rem] uppercase tracking-wide text-accent-secondary">
        {stat.label}
      </span>
      <span className="text-foreground/60">— {stat.caption}</span>
    </li>
  );
}

/**
 * Ambient status strip — CREATIVE_DIRECTION_V2.md §5C.
 *
 * Deliberately atmosphere, not navigation: a slim, quiet bar pinned to
 * the bottom of the viewport. It must never compete with the persistent
 * Nav for wayfinding attention, so it stays visually minor — small type,
 * muted color, no dashboard-style density.
 *
 * The stat+caption row drifts continuously, marquee-style, rather than
 * sitting static: the list is rendered twice back-to-back and translated
 * by exactly one copy's width (0% -> -50% of the doubled track), looping
 * with `repeat: Infinity` so the reset from -50% back to 0% lands on an
 * identical-looking frame and is invisible. The animation is driven
 * imperatively via `useAnimate` (rather than a declarative `animate`
 * prop) specifically so hover/focus pausing below can freeze and resume
 * it in place — `AnimationPlaybackControls.pause()/play()` preserve the
 * animation's elapsed time, whereas re-triggering a declarative keyframe
 * animation would restart it from "0%" and visibly jump.
 *
 * Accessibility (per §5C, applied exactly, extended to cover the new
 * motion):
 * - prefers-reduced-motion freezes every animation (entrance slide, the
 *   decorative pulse dot, the decorative signal counter, and now the
 *   marquee drift) to a static state — no motion at all. The duplicate
 *   marquee copy isn't even rendered in this case, so there's exactly
 *   one (static) copy of the stat list, same as before this change.
 * - The marquee's duplicate copy exists only so the loop reads as
 *   seamless; it's `aria-hidden` so assistive tech sees each stat once,
 *   not twice.
 * - The stat items carry no interactive/focusable elements, so
 *   duplicating them for the loop does not introduce duplicate tab
 *   stops.
 * - Hovering the strip, or focusing anything inside it via keyboard,
 *   pauses the drift so a curious or keyboard-navigating visitor isn't
 *   fighting a moving target; it resumes once neither applies.
 * - The one live-updating text region (the simulated "last synced"
 *   value) uses aria-live="polite", and only actually announces when the
 *   rendered phrase changes (roughly every 30-60s) rather than on every
 *   internal tick, so it doesn't spam assistive tech with decorative
 *   motion.
 * - The decorative signal readout is a purely cosmetic numeric flourish
 *   with no informational value, so it's aria-hidden.
 * - The marquee track clips its own overflow (rather than the page
 *   overflowing horizontally) at every viewport width, including narrow
 *   ones; under reduced motion it falls back to manual horizontal
 *   scrolling for that one region, matching the strip's pre-marquee
 *   behavior exactly.
 */
export default function StatusStrip() {
  // Respect (and track live changes to) the OS/browser reduced-motion
  // preference, per the spec's explicit a11y rule. Shared hook (src/lib/
  // usePrefersReducedMotion.ts) — a useSyncExternalStore subscription to
  // matchMedia's `change` event, same pattern this file used to
  // reimplement locally.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [secondsSinceSync, setSecondsSinceSync] = useState(0);
  const [signal, setSignal] = useState(0);
  const [isMarqueeSuspended, setIsMarqueeSuspended] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);

  // Simulated "last synced" heartbeat. This is meaningful state (a stand
  // -in for a real sync timestamp), not decorative motion, so it keeps
  // ticking regardless of prefers-reduced-motion — only *animation* is
  // frozen by that setting, not this text content.
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsSinceSync((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Purely decorative signal-strength flourish (aria-hidden below, see
  // JSX). It exists only as visual atmosphere, so — unlike the sync
  // heartbeat above — it's paused entirely under reduced motion rather
  // than merely losing its animation.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setSignal((s) => (s + 7) % 1000);
    }, 4000);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  // Continuous marquee drift across the doubled stat list. Skipped
  // entirely under reduced motion (and the duplicate copy isn't even
  // rendered in that case — see JSX below).
  useEffect(() => {
    if (prefersReducedMotion) return;
    const track = scope.current;
    if (!track) return;

    const controls = animate(
      track,
      { x: ["0%", "-50%"] },
      {
        duration: MARQUEE_LOOP_SECONDS,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      },
    );
    controlsRef.current = controls;

    return () => {
      controls.cancel();
      controlsRef.current = null;
    };
  }, [prefersReducedMotion, animate, scope]);

  // Pause on hover or keyboard focus, resume otherwise. Uses pause()/
  // play() (not re-creating the animation) so it freezes and resumes
  // from its current position instead of jumping back to the start.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const controls = controlsRef.current;
    if (!controls) return;
    if (isMarqueeSuspended) {
      controls.pause();
    } else {
      controls.play();
    }
  }, [isMarqueeSuspended, prefersReducedMotion]);

  const suspendMarquee = () => setIsMarqueeSuspended(true);
  const resumeMarquee = () => setIsMarqueeSuspended(false);
  // onBlur fires when focus moves *within* the strip too (e.g. between
  // two focusable children); only resume once focus has actually left
  // the strip entirely, not on every intra-strip focus handoff.
  const handleStripBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      resumeMarquee();
    }
  };

  return (
    <motion.footer
      initial={prefersReducedMotion ? false : { y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label="Site status"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-accent-secondary/20 bg-surface/95 backdrop-blur-sm"
    >
      <div
        onMouseEnter={suspendMarquee}
        onMouseLeave={resumeMarquee}
        onFocus={suspendMarquee}
        onBlur={handleStripBlur}
        className="mx-auto flex max-w-5xl items-center gap-4 px-2 py-1 text-xs sm:gap-6 sm:px-3"
      >
        {/* Decorative signal readout — chrome, not content: hidden from
            assistive tech and hidden first on narrow viewports. */}
        <span
          aria-hidden="true"
          className="hidden shrink-0 items-center gap-1 font-mono text-accent-secondary sm:flex"
        >
          <motion.span
            animate={
              prefersReducedMotion ? undefined : { opacity: [1, 0.35, 1] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent-secondary"
          />
          sig&middot;{String(signal).padStart(3, "0")}
        </span>

        {/* Marquee viewport: clips the doubled, drifting track so the
            animation never causes page-level horizontal overflow. Under
            reduced motion this falls back to the strip's original
            manual-scroll behavior instead of clipping. */}
        <div
          className={
            prefersReducedMotion
              ? "min-w-0 flex-1 overflow-x-auto"
              : "min-w-0 flex-1 overflow-hidden"
          }
        >
          <div ref={scope} className="flex w-max items-baseline gap-4 sm:gap-6">
            <ul className="m-0 flex shrink-0 list-none items-baseline gap-4 p-0 sm:gap-6">
              {STATS.map((stat) => (
                <StatItem key={`primary-${stat.label}`} stat={stat} />
              ))}
            </ul>
            {/* Duplicate copy powering the seamless loop — purely
                decorative repetition of the list above, so it's hidden
                from assistive tech to avoid announcing every stat
                twice. No focusable elements live in a stat item today,
                so this duplication introduces no duplicate tab stops. */}
            {!prefersReducedMotion && (
              <ul
                aria-hidden="true"
                className="m-0 flex shrink-0 list-none items-baseline gap-4 p-0 sm:gap-6"
              >
                {STATS.map((stat) => (
                  <StatItem key={`dup-${stat.label}`} stat={stat} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/*
          Visible on-page disclaimer — this is the one placeholder in the
          codebase that otherwise has no on-page note (STATS and the sync
          heartbeat above are simulated, see the component doc comment).
          Every other stream's placeholder content is disclosed in visible
          copy; this matches that convention rather than reading as real
          telemetry if it ships un-backed.
        */}
        <span className="shrink-0 whitespace-nowrap font-mono text-[0.625rem] italic text-foreground/40">
          illustrative example data
        </span>

        <span
          aria-live="polite"
          aria-atomic="true"
          className="ml-auto shrink-0 whitespace-nowrap font-mono text-[0.625rem] text-accent-secondary"
        >
          {formatSyncedAgo(secondsSinceSync)}
        </span>
      </div>
    </motion.footer>
  );
}
