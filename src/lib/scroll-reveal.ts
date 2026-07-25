// Shared GSAP registration utility — Phase 1 sitewide scroll choreography
// (see spectacle_ideas_*.md, "chosen Phase 1 scope" item 3).
//
// ScrollTrigger and SplitText are both bundled free in gsap@3.15.0 (GSAP's
// 2025 licensing change made all bonus plugins free for every user, no
// "Club GreenSock" paywall) — confirmed by their presence in
// node_modules/gsap/dist/{ScrollTrigger,SplitText}.js. Multiple components
// (Home/About headline reveals, Work card stagger, the ambient layer) need
// these plugins registered exactly once, so callers should use
// `registerGsap()` from here rather than each re-registering independently.
//
// This is a client-only module — gsap's plugins touch `window`/DOM APIs, so
// only call `registerGsap()` from "use client" components, ideally inside a
// useEffect/useLayoutEffect or a module that is itself dynamically imported
// with `ssr: false`.
"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

/**
 * Registers GSAP's ScrollTrigger and SplitText plugins exactly once,
 * regardless of how many components call it. Safe to call from multiple
 * components/effects — subsequent calls are no-ops.
 */
export function registerGsap(): typeof gsap {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    registered = true;
  }
  return gsap;
}

export { gsap, ScrollTrigger, SplitText };

// ---------------------------------------------------------------------------
// Kerning-safe, scroll-triggered word reveal
// (spectacle_ideas_*.md, "chosen Phase 1 scope" item 3)
// ---------------------------------------------------------------------------

export interface SplitTextRevealOptions {
  /**
   * Stagger between each word's entrance, in seconds. The 0.025s-per-word
   * interval is the specific craft detail called out in the brief
   * (creativewebmanual.com-style micro-interaction timing) — the
   * difference between "bespoke" and "generic fade-up" is in the decimal
   * places, so don't round this.
   */
  stagger?: number;
  /** ScrollTrigger start position — when the reveal begins as the element
   * enters the viewport. */
  start?: string;
  /** Distance (px) each word travels upward into its resting position. */
  yOffset?: number;
  /** Per-word animation duration, in seconds. */
  duration?: number;
}

const DEFAULT_STAGGER = 0.025;
const DEFAULT_START = "top 80%";
const DEFAULT_Y_OFFSET = 24;
const DEFAULT_DURATION = 0.8;
// A considered, non-default curve: steep initial deceleration with a soft
// tail, rather than library-default ease-in-out or linear — the other half
// of the "bespoke vs. generic" detail alongside the stagger interval.
const REVEAL_EASE = "power3.out";

/**
 * Splits the element's text into words (word-level — not character-level —
 * to preserve inter-letter kerning within each word) and reveals them with
 * a y + opacity tween as the element scrolls into view.
 *
 * Respects `prefers-reduced-motion`: skips the split/animation entirely and
 * leaves the text at full opacity, in its normal (unsplit) DOM form.
 *
 * Usage:
 * ```tsx
 * const headingRef = useRef<HTMLHeadingElement>(null);
 * useSplitTextReveal(headingRef);
 * return <h1 ref={headingRef}>...</h1>;
 * ```
 */
export function useSplitTextReveal<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: SplitTextRevealOptions = {},
): void {
  const {
    stagger = DEFAULT_STAGGER,
    start = DEFAULT_START,
    yOffset = DEFAULT_Y_OFFSET,
    duration = DEFAULT_DURATION,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      // No split, no animation — just show the real text immediately.
      el.style.opacity = "1";
      return;
    }

    const gsapInstance = registerGsap();
    let split: SplitText | null = null;

    const ctx = gsapInstance.context(() => {
      split = new SplitText(el, {
        type: "words",
        wordsClass: "split-word",
        // Let SplitText manage aria so screen readers see the original
        // text rather than a pile of per-word spans.
        aria: "auto",
      });

      gsapInstance.set(split.words, { opacity: 0, y: yOffset });

      gsapInstance.to(split.words, {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: el,
          start,
        },
      });
    }, el);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [ref, stagger, start, yOffset, duration]);
}
