"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

/* ------------------------------------------------------------------------ *
 * Shared cursor store
 *
 * `Cursor` is mounted once in `layout.tsx` as a sibling of `{children}`
 * (`<Cursor /><CommandPalette />{children}`), not as a wrapper around it —
 * so a React Context provider rooted at `<Cursor />` could never reach the
 * rest of the tree from that mount point. A tiny external store (module-
 * level state + subscriber set) is the pattern that actually works here,
 * with zero setup required by whoever renders `<Cursor />` — no
 * `<CursorProvider>` to remember to add anywhere.
 *
 * API for other streams:
 *
 *   import { useCursor } from "@/components/Cursor";
 *
 *   function ProjectCard() {
 *     const { setCursor } = useCursor();
 *     return (
 *       <a
 *         href="#"
 *         onMouseEnter={() => setCursor({ variant: "hover", label: "View" })}
 *         onMouseLeave={() => setCursor({ variant: "default" })}
 *       >
 *         ...
 *       </a>
 *     );
 *   }
 *
 * `setCursor` is also exported standalone (not just via the hook) for use
 * outside components (e.g. inside an existing event handler / effect).
 * ------------------------------------------------------------------------ */

export type CursorVariant = "default" | "hover" | "text";

export interface CursorState {
  variant: CursorVariant;
  /** Shown inside the morphed circle. Only meaningful for `variant: "hover"`. */
  label?: string;
  /** Raw viewport pointer position. Updated on every `mousemove` — see
   *  `setCursorCoords` below for why this has its own setter. */
  coords?: { x: number; y: number };
}

const DEFAULT_STATE: CursorState = { variant: "default" };

let cursorState: CursorState = DEFAULT_STATE;
const listeners = new Set<(state: CursorState) => void>();

function emit() {
  listeners.forEach((listener) => listener(cursorState));
}

/** Imperative setter — usable from anywhere, no hook required. Merges onto
 *  the existing state (rather than replacing it wholesale) so a hover/focus
 *  update never clobbers the last-known `coords`. */
export function setCursor(next: CursorState) {
  cursorState = { ...cursorState, ...next };
  emit();
}

/** Separate setter for high-frequency pointer coordinates. Patches only the
 *  `coords` key — kept distinct from `setCursor` (which represents discrete
 *  hover/focus variant changes) so raw mousemove traffic stays cheap and
 *  obviously separate from variant/label transitions, even though it still
 *  notifies the same `useCursor()` subscribers (the Gallery's coordinate HUD
 *  reads coords via that same hook). */
export function setCursorCoords(x: number, y: number) {
  cursorState = { ...cursorState, coords: { x, y } };
  emit();
}

/** Convenience reset back to the default dot state. */
export function resetCursor() {
  setCursor(DEFAULT_STATE);
}

/** Hook form of the store: current state + the same `setCursor` setter. */
export function useCursor() {
  const [snapshot, setSnapshot] = useState<CursorState>(cursorState);

  useEffect(() => {
    // No resync call needed here: `useState(cursorState)` above already
    // captures the current value at initial render, so this effect only
    // needs to subscribe for *future* changes.
    listeners.add(setSnapshot);
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  return { cursor: snapshot, setCursor };
}

// Shared easing curve — same cubic-bezier used by CommandPalette, SplitText
// (registered there as a GSAP CustomEase with the same control points) and
// DigitFlip.
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SIZE: Record<CursorVariant, { width: number; height: number; radius: number }> = {
  default: { width: 28, height: 28, radius: 9999 },
  hover: { width: 72, height: 72, radius: 9999 },
  text: { width: 3, height: 24, radius: 2 },
};

export default function Cursor() {
  const { cursor } = useCursor();
  const [isTouch, setIsTouch] = useState(true); // default true: render nothing until proven otherwise
  const [visible, setVisible] = useState(false);

  // Raw pointer position, spring-smoothed twice at different rates so the
  // ring visibly trails the leading dot ("small dot + trailing ring").
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const dotX = useSpring(x, { stiffness: 1000, damping: 50, mass: 0.2 });
  const dotY = useSpring(y, { stiffness: 1000, damping: 50, mass: 0.2 });
  const ringX = useSpring(x, { stiffness: 260, damping: 30, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 30, mass: 0.6 });

  // Must fully disable itself on touch devices: render nothing, native
  // cursor only. Checked via matchMedia (with a live listener for
  // convertible devices) rather than CSS alone, since we also need to skip
  // attaching mousemove listeners and restoring `cursor: none` on <body>.
  useEffect(() => {
    const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "none";

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setCursorCoords(e.clientX, e.clientY);
      setVisible(true);
    };
    const hide = () => setVisible(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", hide);
    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", hide);
    };
  }, [isTouch, x, y]);

  // All hooks above run unconditionally on every render (rules-of-hooks);
  // only the render output is skipped for touch devices.
  if (isTouch) return null;

  const { width, height, radius } = SIZE[cursor.variant];
  const showLabel = cursor.variant === "hover" && !!cursor.label;
  const showBar = cursor.variant === "text";

  return (
    <>
      {/* Positioning layer: framer-motion owns this element's transform via
          the x/y motion values. Never mix Tailwind translate utilities onto
          this node — they'd fight framer's own transform writes. */}
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999]" style={{ x: ringX, y: ringY }}>
        {/* Shape layer: Tailwind handles the -50% centering transform here;
            framer only animates width/height/borderRadius on this node, so
            the two never touch the same CSS property. */}
        <motion.div
          className="relative -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-accent-primary"
          style={{ borderColor: showBar ? "transparent" : undefined }}
          animate={{ width, height, borderRadius: radius, opacity: visible ? 1 : 0 }}
          transition={{
            width: { type: "spring", stiffness: 300, damping: 26 },
            height: { type: "spring", stiffness: 300, damping: 26 },
            borderRadius: { type: "spring", stiffness: 300, damping: 26 },
            opacity: { duration: 0.2, ease: EASE },
          }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-[inherit] bg-accent-primary"
            animate={{ opacity: cursor.variant === "hover" ? 1 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          />
          <AnimatePresence>
            {showLabel ? (
              <motion.span
                key="label"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="absolute inset-0 flex items-center justify-center whitespace-nowrap px-2 font-mono text-[10px] uppercase tracking-wide text-background"
              >
                {cursor.label}
              </motion.span>
            ) : null}
          </AnimatePresence>
          {showBar ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 bg-accent-primary"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : null}
        </motion.div>
      </motion.div>

      {/* Leading dot — same two-layer pattern (position vs. shape/centering). */}
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999]" style={{ x: dotX, y: dotY }}>
        <motion.div
          aria-hidden
          className="h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary"
          animate={{ opacity: visible && cursor.variant === "default" ? 1 : 0 }}
          transition={{ duration: 0.15, ease: EASE }}
        />
      </motion.div>
    </>
  );
}
