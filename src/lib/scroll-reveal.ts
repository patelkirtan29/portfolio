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

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

/**
 * Registers GSAP's ScrollTrigger and SplitText plugins exactly once,
 * regardless of how many components call it. Safe to call from multiple
 * components/effects — subsequent calls are no-ops.
 *
 * STUB — this only performs plugin registration for now. The actual
 * scroll-triggered reveal timelines / kerning-safe split-text helpers used
 * by Home/About/Work land in the scroll-choreography build stream, likely
 * as additional exports from this same module.
 */
export function registerGsap(): typeof gsap {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    registered = true;
  }
  return gsap;
}

export { gsap, ScrollTrigger, SplitText };
