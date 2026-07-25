"use client";

// Persistent, always-visible nav — CREATIVE_DIRECTION_V2.md §2, non-negotiable:
// "the metaphor never owns navigation." Plain-English labels are the real
// content; the 00/01/02/03 numbering is pure decoration next to each label,
// never a replacement for it (spec §4).
//
// Real Next.js routes (not scroll anchors) — this is a multi-page site, per
// the spec's "real routes, not a forced single-scroll page" rule.

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", index: "00", label: "Home" },
  { href: "/work", index: "01", label: "Work" },
  { href: "/about", index: "02", label: "About" },
  { href: "/contact", index: "03", label: "Contact" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-2 py-2 sm:gap-x-6 sm:px-4">
        {LINKS.map(({ href, index, label }) => {
          // Home ("/") should only be active on an exact match; every other
          // route treats its own path as a prefix so nested routes (e.g. a
          // future /work/slug) still mark Work as current.
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`group inline-flex items-baseline gap-1.5 rounded-sm py-1 font-sans text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary sm:text-base ${
                  isActive
                    ? "text-foreground"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`font-mono text-xs sm:text-sm ${
                    isActive ? "text-accent-primary" : "text-foreground/35"
                  }`}
                >
                  {index}
                </span>
                <span
                  className={
                    isActive
                      ? "border-b-2 border-accent-primary pb-0.5"
                      : "border-b-2 border-transparent pb-0.5"
                  }
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
