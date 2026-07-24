"use client";

/**
 * Room: Practice (About) — bio, philosophy, stack, working style.
 *
 * Copy below is placeholder/representative — a plausible solo-developer
 * "about" page, not the real bio. Swap for actual content before ship.
 *
 * Per the creative direction's one deliberate high-contrast moment
 * ("Lobby → Practice locally swaps the room's tokens to the light-mode
 * pair regardless of the visitor's global theme toggle"), this section
 * pins the light-mode token values via inline CSS custom properties. That
 * overrides the ancestor `.dark` class's cascade for exactly this subtree
 * (inline style wins on specificity) without touching `globals.css` or the
 * global theme toggle — every other room stays on the visitor's chosen mode.
 *
 * Headings get a fade+rise reveal on scroll-into-view via GSAP ScrollTrigger
 * (registered here since this room owns its own reveal instances; the shared
 * Lenis/ScrollTrigger sync lives in ScrollProvider). Reduced-motion visitors
 * get the content at full opacity with no animation at all.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/scroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Mirrors the light-mode column of the token table in FINAL_CREATIVE_DIRECTION.md.
// Duplicated intentionally (see BUILD_IDEAS_LOG for a follow-up to centralize
// this as a reusable class in globals.css, which is out of this stream's scope).
const PRACTICE_LIGHT_TOKENS = {
  "--background": "#f7ebdb",
  "--surface": "#efe0cc",
  "--foreground": "#141c2b",
  "--accent-primary": "#c85a3d",
  "--accent-emissive": "#ff6b42",
  "--accent-secondary": "#5c7080",
  "--muted": "#e5d6c7",
} as React.CSSProperties;

const SECTIONS = [
  {
    id: "bio",
    heading: "Who I am",
    body: "I'm a developer who likes the unglamorous middle of a project almost as much as the shipping part — the schema that makes the next six features easy, the error message that saves someone twenty minutes at 2am. I care about interfaces that feel considered, and about the invisible plumbing that lets them stay that way under real use.",
  },
  {
    id: "philosophy",
    heading: "How I think about the work",
    body: "Software is a series of small, reversible bets. I'd rather ship something narrow and learn from real usage than spend a week arguing for the “correct” architecture for a problem nobody's confirmed exists yet. Good taste shows up more in what you leave out than what you add.",
  },
  {
    id: "stack",
    heading: "What I reach for",
    body: "TypeScript and React on the front end, Node and Python on the back, Postgres for anything that needs to remember something. Three.js and GSAP when a page needs to feel alive rather than just correct. I pick boring tools for the parts that need to be reliable, and interesting ones for the parts that need to be memorable.",
  },
  {
    id: "working-style",
    heading: "How I work",
    body: "Small commits, a bias toward finishing, and a habit of narrating decisions in writing so future-me — or a teammate — isn't reverse-engineering intent six months later. Comfortable owning a feature end to end: design, build, ship, and watch what happens after.",
  },
] as const;

export default function Practice() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      targets.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="practice"
      ref={sectionRef}
      style={PRACTICE_LIGHT_TOKENS}
      aria-label="Room: Practice — about"
      className="min-h-screen w-full bg-background px-6 py-24 text-foreground transition-colors md:px-16 lg:px-24"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-16">
        <header data-reveal className="opacity-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-secondary">
            Room 02 — Practice
          </p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">About</h2>
        </header>

        {SECTIONS.map((section) => (
          <div key={section.id} className="flex flex-col gap-3">
            <h3
              data-reveal
              className="opacity-0 font-display text-2xl md:text-3xl"
            >
              {section.heading}
            </h3>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/90 md:text-lg">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
