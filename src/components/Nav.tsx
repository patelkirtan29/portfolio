"use client";

import { ROOM_IDS, ROOM_LABELS, useCurrentRoom } from "@/lib/scroll";
import { useTheme } from "@/lib/theme";

/**
 * Persistent nav. Per the creative direction doc, the 3D Console owns primary
 * wayfinding on desktop, so this stays minimal there (fixed corner wordmark +
 * room links). On coarse-pointer (mobile/touch) devices the Console doesn't
 * mount at all, so this renders a room-index dot pager on the screen edge
 * instead.
 *
 * Current-room detection and the room id/label list are both single-sourced
 * from `@/lib/scroll` (`useCurrentRoom` / `ROOM_IDS` / `ROOM_LABELS`) rather
 * than this component's own `IntersectionObserver` + local array, so this nav
 * always agrees with the Console radar and any future room rename only needs
 * one edit. The theme toggle is likewise single-sourced from `@/lib/theme`'s
 * shared store, so this button and the ⌘K palette's "Toggle theme" action
 * can never drift out of sync.
 */
export default function Nav() {
  const activeId = useCurrentRoom() ?? "lobby";
  const { isDark, toggleTheme } = useTheme();

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
          {ROOM_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={activeId === id ? "true" : undefined}
              className={
                activeId === id
                  ? "text-accent-primary"
                  : "text-accent-secondary hover:text-foreground"
              }
            >
              {ROOM_LABELS[id]}
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
        {ROOM_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            aria-label={`Go to ${ROOM_LABELS[id]}`}
            aria-current={activeId === id ? "true" : undefined}
            className="group flex items-center justify-center p-1.5"
          >
            <span
              className={`block rounded-full transition-all ${
                activeId === id
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
