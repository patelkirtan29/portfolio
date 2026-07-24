"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current epoch-ms clock, refreshed every `intervalMs`.
 *
 * This exists purely so HUD-style "Xm ago" readouts stay honest over time —
 * it is NOT the data-fetch ticker (Gallery data is fetched once per page
 * load, no auto-polling, per the creative direction's arbitrated call). It
 * only forces a re-render of already-fetched data's relative-time labels.
 *
 * Returns `null` until the first effect runs, so components never call
 * `Date.now()` directly during render (React Compiler's purity rule flags
 * that, and it also avoids SSR/client hydration mismatches).
 */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Deferred (not called synchronously in the effect body) so the initial
    // clock value arrives via a callback, same as the interval's later ticks.
    const initialId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(initialId);
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return now;
}
