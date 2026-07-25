"use client";

/**
 * Shallow-routed `?project=slug` store for the Gallery's flagship project
 * detail modal (see `ProjectModal.tsx` / FINAL_CREATIVE_DIRECTION.md section 2
 * / BUILD_IDEAS_DECISIONS.md item 4).
 *
 * Next's App Router has no legacy `shallow: true` navigation option, and
 * routing this through `router.push`/`replace` would risk a real navigation
 * (this page's Server Component fetches GitHub data — see `src/lib/github.ts`
 * — and a router-driven query change is exactly the kind of "full
 * navigation/re-render of server data" the spec calls out to avoid). So the
 * URL is updated by hand via `history.pushState`/`replaceState`, which
 * Next's router does not observe — meaning `useSearchParams()` would not
 * reactively reflect these changes. Instead this is a tiny module-level
 * external store (module state + subscriber `Set`, `useSyncExternalStore`),
 * the same pattern already used by `@/lib/scroll` and `@/lib/theme` and
 * `Cursor.tsx`'s `useCursor()` — so `CommandPalette.tsx` (which has no
 * access to Gallery's component tree) can close an open modal from its own
 * "jump to room" action without any prop-drilling or context.
 *
 * - `openProjectModal(slug)` pushes a new, back-button-undoable history
 *   entry (per spec: "clicking a card pushes `?project={repo.name}` via
 *   `history.pushState`").
 * - `closeProjectModal()` rewrites the URL via `replaceState` instead —
 *   closing (Escape / backdrop click / the ⌘K "jump to room" interop) should
 *   never itself become a fresh "back" target, only *opening* one should.
 *   This also sidesteps a real edge case: if the page was loaded directly
 *   from a shared `?project=slug` link, there is no same-page history entry
 *   to go back to, so closing via `history.back()` would navigate the
 *   visitor off the page entirely.
 * - A `popstate` listener re-syncs from `window.location` so real
 *   browser back/forward navigation is reflected correctly (closes the
 *   modal on back, reopens it on forward).
 */

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("project");
}

function getServerSnapshot(): string | null {
  return null;
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", emit);
}

/** Open the modal for `slug`, pushing a new back-button-undoable URL entry. */
export function openProjectModal(slug: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("project", slug);
  window.history.pushState(window.history.state, "", url);
  emit();
}

/** Close the modal (no-op if already closed), rewriting the URL in place. */
export function closeProjectModal(): void {
  if (typeof window === "undefined") return;
  if (readFromLocation() === null) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("project");
  window.history.replaceState(window.history.state, "", url);
  emit();
}

/** Reactive currently-open project slug (or null), synced with the URL. */
export function useOpenProjectSlug(): string | null {
  return useSyncExternalStore(subscribe, readFromLocation, getServerSnapshot);
}
