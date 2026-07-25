"use client";

import { createContext, useContext } from "react";
import type { RefObject } from "react";

/**
 * A ref (not state) carrying whether the GSAP unfold timeline has
 * completed. Idle-loop behaviors (steam wisp, plant sway, cursor blink,
 * breathing lamp light) all gate on this inside their own `useFrame`
 * callbacks — reading a ref costs nothing per-frame and avoids the
 * re-render churn a boolean piece of state would cause across the whole
 * scene tree the moment the unfold finishes.
 */
export const UnfoldContext = createContext<RefObject<boolean> | null>(null);

export function useHasUnfolded(): RefObject<boolean> {
  const ctx = useContext(UnfoldContext);
  if (!ctx) {
    throw new Error("useHasUnfolded must be used within <DeskGroup>'s UnfoldContext.Provider");
  }
  return ctx;
}
