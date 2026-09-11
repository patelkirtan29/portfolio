"use client";

// Decides whether the ambient layer (src/components/AmbientLayer.tsx) is
// allowed to animate. Two independent signals both force the static
// fallback, per the Phase 1 ambient-layer spec:
//   - `prefers-reduced-motion: reduce` — via the shared
//     `usePrefersReducedMotion` hook (src/lib/usePrefersReducedMotion.ts)
//   - the Save-Data client hint (`navigator.connection?.saveData`) — this
//     part stays local to this hook, since Save-Data isn't a concern any
//     other motion-gated piece on the site needs.
//
// Both are re-checked live via their respective `change` events (a user can
// toggle either mid-session), not just read once on mount.

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// `NetworkInformation`/`navigator.connection` is a non-standard, Chromium-only
// API not present in lib.dom.d.ts — declare just the bits we use.
interface NetworkInformationLike extends EventTarget {
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
}

/**
 * Returns `true` when the ambient layer should run its animated version,
 * `false` when it should freeze to the static fallback (reduced motion or
 * Save-Data).
 */
export function useAmbientMotion(): boolean {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const connection = (navigator as NavigatorWithConnection).connection;
    if (!connection) return;

    const evaluate = () => setSaveData(Boolean(connection.saveData));
    evaluate();

    connection.addEventListener("change", evaluate);
    return () => connection.removeEventListener("change", evaluate);
  }, []);

  return !prefersReducedMotion && !saveData;
}
