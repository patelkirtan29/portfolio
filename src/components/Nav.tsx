"use client";

import { useEffect, useState } from "react";

const rooms = [
  { id: "lobby", label: "Lobby" },
  { id: "practice", label: "Practice" },
  { id: "gallery", label: "Gallery" },
  { id: "signal", label: "Signal" },
];

/**
 * Persistent nav. Per the creative direction doc, the 3D Console owns primary
 * wayfinding on desktop, so this stays minimal there (fixed corner wordmark +
 * room links). On coarse-pointer (mobile/touch) devices the Console doesn't
 * mount at all, so this renders a room-index dot pager on the screen edge
 * instead, driven by IntersectionObserver against the room sections' ids.
 *
 * The light/dark theme toggle lives here too (toggles `.dark` on <html>,
 * matching Batch 0's class-based dark-mode strategy) since there's no other
 * obvious home for it yet — see the report for a note on relocating this
 * during integration if the Console or Command Palette want to own it.
 */
export default function Nav() {
  const [activeId, setActiveId] = useState("lobby");
  const [isDark, setIsDark] = useState(true);

  // Sync theme state with the actual DOM class + any stored preference.
  // Deliberate one-time exception to react-hooks/set-state-in-effect: the
  // stored preference and DOM class are only knowable client-side (SSR
  // always renders the layout.tsx default), so this reconciles React state
  // with that external source exactly once on mount.
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.classList.remove("dark");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(false);
    } else if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Room-index tracking, shared by both the desktop link list (active state)
  // and the mobile dot pager. Self-contained IntersectionObserver — does not
  // depend on the scroll-engine stream's @/lib/scroll module.
  useEffect(() => {
    const sections = rooms
      .map((r) => document.getElementById(r.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-10% 0px -10% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <>
      {/* Desktop: minimal corner wordmark + room links. Hidden on coarse
          pointers, where the dot pager below takes over instead. */}
      <nav
        aria-label="Primary"
        className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-4 font-mono text-xs uppercase tracking-wide [@media(pointer:coarse)]:hidden"
      >
        <a href="#lobby" className="text-foreground hover:text-accent-primary">
          kirtan.dev
        </a>
        <div className="flex items-center gap-6">
          {rooms.map((room) => (
            <a
              key={room.id}
              href={`#${room.id}`}
              aria-current={activeId === room.id ? "true" : undefined}
              className={
                activeId === room.id
                  ? "text-accent-primary"
                  : "text-accent-secondary hover:text-foreground"
              }
            >
              {room.label}
            </a>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-accent-secondary hover:text-foreground"
          >
            {isDark ? "dark" : "light"}
          </button>
        </div>
      </nav>

      {/* Mobile / coarse-pointer: the Console doesn't mount here, so this
          vertical dot pager on the screen edge is the wayfinding instrument. */}
      <nav
        aria-label="Room index"
        className="fixed top-1/2 right-4 z-50 hidden -translate-y-1/2 flex-col items-center gap-3 [@media(pointer:coarse)]:flex"
      >
        {rooms.map((room) => (
          <a
            key={room.id}
            href={`#${room.id}`}
            aria-label={`Go to ${room.label}`}
            aria-current={activeId === room.id ? "true" : undefined}
            className="group flex items-center justify-center p-1.5"
          >
            <span
              className={`block rounded-full transition-all ${
                activeId === room.id
                  ? "h-2.5 w-2.5 bg-accent-primary"
                  : "h-1.5 w-1.5 bg-accent-secondary/60 group-hover:bg-accent-secondary"
              }`}
            />
          </a>
        ))}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="mt-2 font-mono text-[10px] text-accent-secondary"
        >
          {isDark ? "L" : "D"}
        </button>
      </nav>
    </>
  );
}
