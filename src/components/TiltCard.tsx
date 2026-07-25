"use client";

// Cursor-tilt wrapper — cheap CSS 3D-transform depth/tilt for existing
// About/Contact cards, tying the site's depth language together (Phase 1
// spec, item 4). Wraps existing card content without changing markup
// semantics or the accessible interaction underneath.
//
// STUB — real pointer-tracking tilt transform (plus keyboard-focus parity
// and prefers-reduced-motion fallback) lands in the cursor-tilt build
// stream. Intentionally a pass-through (renders children unwrapped) so it
// is safe to import/wrap ahead of that work with zero visual effect.
import type { ReactNode } from "react";

type TiltCardProps = {
  children: ReactNode;
};

export default function TiltCard({ children }: TiltCardProps) {
  return <>{children}</>;
}
