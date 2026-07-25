"use client";

// Cursor-tilt wrapper — cheap CSS 3D-transform depth/tilt for existing
// About/Contact cards, tying the site's depth language together (Phase 1
// spec, item 4). Wraps existing card content without changing markup
// semantics or the accessible interaction underneath.
//
// How it works: a `perspective` parent + a card element whose
// `rotateX`/`rotateY`/`scale` are driven by pointer position relative to
// the card's bounding box, rAF-throttled and CSS-eased so it damps
// smoothly instead of jittering frame-to-frame. Box-shadow is
// interpolated alongside the tilt so the card visibly "lifts toward you"
// as it approaches peak tilt.
//
// Accessibility (per spectacle_ideas_google.md item 4):
// - Keyboard focus anywhere inside the card applies the exact same peak
//   elevated/tilted transform a mouse would reach at the most extreme
//   hover position — a keyboard user gets equivalent visual feedback,
//   never a lesser, flat state. Implemented via focus/blur listeners
//   (React's onFocus/onBlur use native focusin/focusout under the hood,
//   which bubble, so a listener on the wrapper reliably tracks focus
//   anywhere among its children) rather than pure CSS :focus-within, to
//   keep a single JS-driven source of truth for the transform instead of
//   fighting inline styles vs. cascade — the same rationale StatusStrip
//   uses relatedTarget on blur to distinguish "focus left the card
//   entirely" from "focus moved between two children inside it".
// - `prefers-reduced-motion: reduce` locks to one static, slightly
//   elevated transform set once — no pointermove tracking, no per-frame
//   recompute. Detected via the shared `usePrefersReducedMotion` hook
//   (src/lib/usePrefersReducedMotion.ts), so it also reacts live if the
//   OS setting changes.
// - Coarse/touch pointers (no cursor to track) get a static, slightly
//   elevated resting state instead of faked tilt — real tilt only
//   engages for fine pointers (mouse/trackpad), and pointer events are
//   also filtered by `pointerType` at the handler level as a second
//   guard for hybrid devices.
// - Does not add focusable elements, roles, or extra tab stops — it is a
//   pure decoration layer around the real, already-accessible markup
//   passed as children.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
};

/** Max rotation on either axis at full pointer-driven peak, in degrees.
 *  Within the spec's "subtle, not a dramatic swing" 6-10deg range. */
const MAX_TILT_DEG = 8;

/** Scale at full peak tilt (mouse peak or keyboard-focus peak). */
const PEAK_SCALE = 1.02;

/** Fixed rotation/scale used for the static "slightly elevated" states
 *  (prefers-reduced-motion). Deliberately less than the interactive
 *  peak so it reads as a resting lift, not the dynamic maximum. */
const REDUCED_MOTION_TILT_DEG = 4;
const REDUCED_MOTION_SCALE = 1.015;

/** Fixed scale for the touch/coarse-pointer resting state — no rotation
 *  at all (there's no cursor to derive a tilt direction from), just a
 *  soft, constant lift so the card doesn't look inert next to its
 *  pointer-reactive siblings on desktop. */
const TOUCH_SCALE = 1.015;

const REST_TRANSITION = "transform 150ms ease-out, box-shadow 200ms ease-out";

type ShadowLayer = { y: number; blur: number; spread: number; alpha: number };

const REST_SHADOW: ShadowLayer[] = [
  { y: 1, blur: 3, spread: 0, alpha: 0.12 },
  { y: 1, blur: 2, spread: -1, alpha: 0.08 },
];

const PEAK_SHADOW: ShadowLayer[] = [
  { y: 20, blur: 32, spread: -8, alpha: 0.35 },
  { y: 8, blur: 16, spread: -6, alpha: 0.25 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolates between the resting and peak two-layer shadow, driven by
 *  `t` (0 = resting, 1 = full peak) so shadow depth grows continuously
 *  alongside tilt magnitude rather than snapping between two states. */
function buildShadow(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return REST_SHADOW.map((rest, i) => {
    const peak = PEAK_SHADOW[i];
    const y = lerp(rest.y, peak.y, clamped);
    const blur = lerp(rest.blur, peak.blur, clamped);
    const spread = lerp(rest.spread, peak.spread, clamped);
    const alpha = lerp(rest.alpha, peak.alpha, clamped);
    return `0 ${y}px ${blur}px ${spread}px rgba(0,0,0,${alpha.toFixed(3)})`;
  }).join(", ");
}

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeToMediaQuery(query: string) {
  return (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };
}

function getMediaQuerySnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

// SSR has no window/matchMedia; default to "motion allowed" / "fine
// pointer assumed" on the server and let the client snapshot correct it
// immediately post-hydration (same fallback rationale as StatusStrip).
function getServerSnapshotFalse() {
  return false;
}

type Tilt = { rx: number; ry: number; scale: number; t: number };

const RESTING: Tilt = { rx: 0, ry: 0, scale: 1, t: 0 };
const FOCUS_PEAK: Tilt = {
  rx: -MAX_TILT_DEG,
  ry: MAX_TILT_DEG,
  scale: PEAK_SCALE,
  t: 1,
};
const REDUCED_MOTION_STATIC: Tilt = {
  rx: -REDUCED_MOTION_TILT_DEG,
  ry: REDUCED_MOTION_TILT_DEG,
  scale: REDUCED_MOTION_SCALE,
  t: 0.5,
};
const TOUCH_STATIC: Tilt = { rx: 0, ry: 0, scale: TOUCH_SCALE, t: 0.35 };

export default function TiltCard({ children, className }: TiltCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasFinePointer = useSyncExternalStore(
    subscribeToMediaQuery(FINE_POINTER_QUERY),
    getMediaQuerySnapshot(FINE_POINTER_QUERY),
    getServerSnapshotFalse,
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [pointerTilt, setPointerTilt] = useState<Tilt>(RESTING);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !hasFinePointer) return;
      if (event.pointerType !== "mouse" && event.pointerType !== "pen")
        return;

      const card = cardRef.current;
      if (!card) return;

      const clientX = event.clientX;
      const clientY = event.clientY;

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const normX = Math.min(
          1,
          Math.max(-1, (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)),
        );
        const normY = Math.min(
          1,
          Math.max(-1, (clientY - (rect.top + rect.height / 2)) / (rect.height / 2)),
        );

        const ry = normX * MAX_TILT_DEG;
        const rx = -normY * MAX_TILT_DEG;
        const magnitude = Math.min(
          1,
          Math.max(Math.abs(rx), Math.abs(ry)) / MAX_TILT_DEG,
        );
        const scale = lerp(1, PEAK_SCALE, magnitude);

        setPointerTilt({ rx, ry, scale, t: magnitude });
      });
    },
    [prefersReducedMotion, hasFinePointer],
  );

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setPointerTilt(RESTING);
  }, []);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    // Only clear focus state once focus has actually left the card
    // entirely — Tab moving between two focusable children inside the
    // card fires blur-then-focus on this same wrapper, and we don't
    // want that intra-card handoff to visibly drop the elevated state
    // for a frame (same pattern as StatusStrip's handleStripBlur).
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocused(false);
    }
  }, []);

  const tilt: Tilt = useMemo(() => {
    if (prefersReducedMotion) return REDUCED_MOTION_STATIC;
    if (!hasFinePointer) return TOUCH_STATIC;
    if (isFocused) return FOCUS_PEAK;
    return pointerTilt;
  }, [prefersReducedMotion, hasFinePointer, isFocused, pointerTilt]);

  // Only the interactive, pointer-tracked state benefits from the rAF
  // throttle *and* a snappier release transition; the static states
  // (reduced-motion / touch / focus-peak) are set once and can transition
  // in smoothly like any other value change.
  const style = {
    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.scale})`,
    boxShadow: buildShadow(tilt.t),
    transition: REST_TRANSITION,
    transformStyle: "preserve-3d" as const,
    willChange: "transform, box-shadow",
  };

  return (
    <div className={className} style={{ perspective: "1000px" }}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
