"use client";

// Decides whether the ambient layer (src/components/AmbientLayer.tsx) is
// allowed to animate. Two independent signals both force the static
// fallback, per the Phase 1 ambient-layer spec:
//   - `prefers-reduced-motion: reduce`
//   - the Save-Data client hint (`navigator.connection?.saveData`)
//
// Both are re-checked live via their respective `change` events (a user can
// toggle either mid-session), not just read once on mount.

import { useEffect, useState } from "react";

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
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;

    const evaluate = () => {
      const reducedMotion = media.matches;
      const saveData = Boolean(connection?.saveData);
      setMotionAllowed(!reducedMotion && !saveData);
    };

    evaluate();

    media.addEventListener("change", evaluate);
    connection?.addEventListener("change", evaluate);

    return () => {
      media.removeEventListener("change", evaluate);
      connection?.removeEventListener("change", evaluate);
    };
  }, []);

  return motionAllowed;
}
