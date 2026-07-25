"use client";

// Small client wrapper around `useSplitTextReveal` (src/lib/scroll-reveal.ts)
// so Home/About headings can opt into the sitewide scroll-triggered,
// kerning-safe word reveal (spectacle_ideas_*.md, Phase 1 scope item 3)
// without forcing their parent pages to become client components.
//
// SSR/no-JS output is the original heading markup with the original text —
// SplitText only runs client-side after mount, and `prefers-reduced-motion`
// skips it entirely — so nothing regresses for crawlers, no-JS clients, or
// motion-sensitive users.

import { useRef, type ReactNode } from "react";
import { useSplitTextReveal } from "@/lib/scroll-reveal";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface RevealTextProps {
  /** Heading tag to render — h1/h2/etc. Defaults to h2. */
  as?: HeadingTag;
  className?: string;
  children: ReactNode;
}

export default function RevealText({
  as: Tag = "h2",
  className,
  children,
}: RevealTextProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useSplitTextReveal(ref);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
