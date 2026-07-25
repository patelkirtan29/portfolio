"use client";

import { useCursor } from "@/components/Cursor";
import { useCurrentRoom } from "@/lib/scroll";

/**
 * Live mono coordinate readout, scoped to the Gallery room (per the creative
 * direction's "live mono coordinate readout scoped to the Gallery room and
 * open project modals" — the modal half lands whenever `?project=slug`
 * shallow routing is built; this HUD already reads `useCursor()`, which any
 * future modal-scoped instance can reuse as-is).
 *
 * Reads coordinates off the shared `Cursor.tsx` store (`setCursorCoords`,
 * wired into its existing `mousemove` listener) rather than standing up a
 * second listener — see BUILD_IDEAS_DECISIONS.md item 3.
 *
 * z-index: `z-[60]` — comfortably above room content/the Console's shrunk
 * radar widget (`z-40`) and `Nav` (`z-50`, preserving this HUD's prior
 * stacking relative to both), but well *below* `ProjectModal`'s `z-[9990]`
 * and `CommandPalette`'s `z-[9998]`. This used to sit at `z-[9998]` — the
 * same layer as the command palette — which meant this fixed bottom-right
 * readout would render on top of (and visually clash with) an open project
 * modal's backdrop instead of being cleanly covered by it. Lowering it here
 * lets the modal (and the palette) properly overlay this HUD instead.
 */
export default function CoordinateHUD() {
  const { cursor } = useCursor();
  const currentRoom = useCurrentRoom();

  if (currentRoom !== "gallery" || !cursor.coords) return null;

  const { x, y } = cursor.coords;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-4 right-4 z-[60] hidden select-none rounded border border-[var(--muted)] bg-[var(--background)]/80 px-2 py-1 font-mono text-[11px] tabular-nums text-[var(--accent-secondary)] backdrop-blur-sm sm:block"
    >
      X {String(Math.round(x)).padStart(4, "0")} · Y {String(Math.round(y)).padStart(4, "0")}
    </div>
  );
}
