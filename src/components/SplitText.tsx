"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

// GSAP's SplitText/ScrollTrigger plugins were historically part of the paid
// "Club GreenSock" bundle, but as of GreenSock joining Webflow (2025) both
// ship free in the standard `gsap` npm package — confirmed present here at
// node_modules/gsap/SplitText.js (installed version 3.15.0). So: the real
// GSAP SplitText is used below, not the manual `.split(" ")` fallback.
if (typeof window !== "undefined") {
  gsap.registerPlugin(GSAPSplitText, ScrollTrigger, CustomEase);

  // Shared easing curve — same cubic-bezier as Cursor.tsx / CommandPalette.tsx
  // / DigitFlip.tsx. GSAP's core ease parser doesn't accept a raw CSS
  // `cubic-bezier()` string, so the identical curve is registered once here
  // as a CustomEase (also free in this GSAP version) built from the SVG path
  // equivalent of `cubic-bezier(0.16, 1, 0.3, 1)` — "M0,0 C{x1},{y1} {x2},{y2} 1,1".
  CustomEase.create("maestro-ease", "M0,0 C0.16,1 0.3,1 1,1");
}

const MAESTRO_EASE = "maestro-ease";
const WORD_STAGGER_SECONDS = 0.025;

export interface SplitTextProps {
  /** Plain-text content to split. Word-level (not char-level) to preserve kerning. */
  children: string;
  className?: string;
  /** Seconds of delay added per word. Default 0.025s, per the type/motion spec. */
  stagger?: number;
  /** ScrollTrigger `start` position. Default "top 80%" (fires on scroll-into-view). */
  start?: string;
  /** Play once (default) vs. replay every time it re-enters the viewport. */
  once?: boolean;
}

/**
 * Wraps text in word-level spans and animates `y: 100% -> 0` + `opacity: 0 -> 1`
 * on scroll-into-view, staggered per word. Renders as an inline `<span>` so it
 * can be dropped inside an `<h1>`/`<h2>`/pull-quote wrapper owned by the
 * consumer, e.g. `<h1><SplitText>Some heading</SplitText></h1>`.
 */
export default function SplitText({ children, className, stagger = WORD_STAGGER_SECONDS, start = "top 80%", once = true }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Reduced motion: no split, no stagger — plain static text, per the
      // creative direction's "replaced with plain crossfades" rule.
      return;
    }

    const split = new GSAPSplitText(el, { type: "words", wordsClass: "split-text-word" });

    gsap.set(split.words, { yPercent: 100, opacity: 0 });

    const tween = gsap.to(split.words, {
      yPercent: 0,
      opacity: 1,
      duration: 0.9,
      ease: MAESTRO_EASE,
      stagger,
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: once ? "play none none none" : "play none none reverse",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      split.revert();
    };
  }, [children, start, stagger, once]);

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
