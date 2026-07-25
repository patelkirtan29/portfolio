"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// SSR has no window/matchMedia; default to "motion allowed" on the server
// and let the client snapshot (above) correct it post-hydration.
function getReducedMotionServerSnapshot() {
  return false;
}

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

/** Renders the simulated "last synced" heartbeat as a short human phrase. */
function formatSyncedAgo(seconds: number): string {
  if (seconds < 30) return "synced just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "synced under a minute ago";
  return `synced ${minutes}m ago`;
}

/**
 * Ambient status strip — CREATIVE_DIRECTION_V2.md §5C.
 *
 * Deliberately atmosphere, not navigation: a slim, quiet bar pinned to
 * the bottom of the viewport. It must never compete with the persistent
 * Nav for wayfinding attention, so it stays visually minor — small type,
 * muted color, no dashboard-style density.
 *
 * Accessibility (per §5C, applied exactly):
 * - prefers-reduced-motion freezes every animation (entrance slide, the
 *   decorative pulse dot, the decorative signal counter) to a static
 *   state — no motion at all, just a plain static strip.
 * - The one live-updating text region (the simulated "last synced"
 *   value) uses aria-live="polite", and only actually announces when the
 *   rendered phrase changes (roughly every 30-60s) rather than on every
 *   internal tick, so it doesn't spam assistive tech with decorative
 *   motion.
 * - The decorative signal readout is a purely cosmetic numeric flourish
 *   with no informational value, so it's aria-hidden.
 * - On narrow viewports the strip scrolls horizontally instead of
 *   wrapping or overflowing, and the decorative readout hides first.
 */
export default function StatusStrip() {
  // Respect (and track live changes to) the OS/browser reduced-motion
  // preference, per the spec's explicit a11y rule. useSyncExternalStore
  // (rather than useState + useEffect) keeps this a pure subscription to
  // an external API with no synchronous setState-in-effect.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [secondsSinceSync, setSecondsSinceSync] = useState(0);
  const [signal, setSignal] = useState(0);

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

  return (
    <motion.footer
      initial={prefersReducedMotion ? false : { y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label="Site status"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-accent-secondary/20 bg-surface/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-2 py-1 text-xs sm:gap-6 sm:px-3">
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

        <ul className="m-0 flex shrink-0 list-none items-baseline gap-4 p-0 sm:gap-6">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex shrink-0 items-baseline gap-2 whitespace-nowrap"
            >
              <span className="font-mono text-foreground">{stat.value}</span>
              <span className="font-mono text-[0.625rem] uppercase tracking-wide text-accent-secondary">
                {stat.label}
              </span>
              <span className="text-foreground/60">— {stat.caption}</span>
            </li>
          ))}
        </ul>

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
