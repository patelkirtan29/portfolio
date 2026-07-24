"use client";

/**
 * Shared theme store — single source of truth for the site's light/dark
 * mode toggle. Same module-level-state-plus-listener-`Set` pattern already
 * proven in this codebase by `Cursor.tsx`'s `useCursor()` — no `<Provider>`
 * needed since `Nav.tsx` and `CommandPalette.tsx` mount independently and
 * both need to read/write the same bit.
 *
 * `toggleTheme` is the *only* place that both flips
 * `document.documentElement`'s `.dark` class AND writes
 * `localStorage.setItem("theme", ...)`. Before this store existed, `Nav.tsx`
 * mirrored theme into its own `isDark` state + `localStorage`, while
 * `CommandPalette.tsx`'s toggle only touched `classList` — a ⌘K theme
 * change was silently reverted on the next page load because Nav's mount
 * effect reconciled from stale `localStorage`. Routing both surfaces through
 * this one store fixes that for good.
 */

import { useEffect, useState } from "react";

interface ThemeState {
  isDark: boolean;
}

// SSR-safe default: layout.tsx renders `<html class="dark">` server-side, so
// `true` matches first paint until the mount-time reconciliation below reads
// the visitor's actual stored preference (only knowable client-side).
let themeState: ThemeState = { isDark: true };
const listeners = new Set<(state: ThemeState) => void>();

function emit() {
  listeners.forEach((listener) => listener(themeState));
}

function setThemeState(next: ThemeState) {
  themeState = next;
  emit();
}

let hasHydrated = false;

/** Reconciles React/module state with the actual DOM class + stored
 *  preference exactly once, no matter how many components call `useTheme()`. */
function hydrateFromStorage() {
  if (hasHydrated) return;
  hasHydrated = true;

  const stored = window.localStorage.getItem("theme");
  if (stored === "light") {
    document.documentElement.classList.remove("dark");
    setThemeState({ isDark: false });
  } else if (stored === "dark") {
    document.documentElement.classList.add("dark");
    setThemeState({ isDark: true });
  } else {
    setThemeState({ isDark: document.documentElement.classList.contains("dark") });
  }
}

/** Imperative toggle — flips the DOM class, persists the choice, and
 *  notifies every `useTheme()` subscriber. */
export function toggleTheme() {
  const next = !themeState.isDark;
  document.documentElement.classList.toggle("dark", next);
  window.localStorage.setItem("theme", next ? "dark" : "light");
  setThemeState({ isDark: next });
}

/** Hook form of the store: current `isDark` + the shared `toggleTheme`. */
export function useTheme() {
  const [snapshot, setSnapshot] = useState<ThemeState>(themeState);

  useEffect(() => {
    listeners.add(setSnapshot);
    hydrateFromStorage();
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  return { isDark: snapshot.isDark, toggleTheme };
}
