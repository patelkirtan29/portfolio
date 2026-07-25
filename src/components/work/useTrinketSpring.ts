// Toy-physics spring hook for Trinket.tsx.
//
// Two gestures, both bouncy rather than stiff (spectacle_ideas_canva.md item
// #2 calls out bruno-simon.com's "squash-and-stretch... you can't help but
// nudge it" quality as the thing worth borrowing):
//   - wobble(): a quick rotation impulse for hover / touch-tap, springing
//     back to rest.
//   - drag(x, y) / settle(): 1:1 follow while the pointer is down, then a
//     bouncy flick-and-settle back to the resting pose on release.
//
// When `reducedMotion` is true every method becomes a no-op and the spring
// stays pinned at its resting values, so the caller can render the shape
// fully static/inert without special-casing JSX.
import { useSpring } from "@react-spring/three";
import { useCallback } from "react";

// Note: the spring is kept as five flat scalar keys (rx/ry/rz/px/py) rather
// than array-valued `rotation`/`position` springs. @react-spring/three's
// AnimatedProps typing for a <a.group>'s `rotation`/`position` props doesn't
// accept a single SpringValue<[number,number,number]> — the well-typed path
// is binding each axis's scalar SpringValue to r3f's dot-notation vector
// props (`rotation-x`, `position-y`, etc.), which Trinket.tsx does.
const REST = { rx: 0, ry: 0, rz: 0, px: 0, py: 0 };

// Loose tension / low friction = toy-like bounce, not a stiff snap-back.
const SETTLE_CONFIG = { tension: 190, friction: 11 };
const WOBBLE_OUT_CONFIG = { tension: 320, friction: 7 };
const WOBBLE_BACK_CONFIG = { tension: 170, friction: 10 };

export type TrinketSpring = ReturnType<typeof useTrinketSpring>;

export function useTrinketSpring(reducedMotion: boolean) {
  const [{ rx, ry, rz, px, py }, api] = useSpring(() => ({
    ...REST,
    config: SETTLE_CONFIG,
  }));

  const wobble = useCallback(() => {
    if (reducedMotion) return;
    void api.start({
      to: async (next) => {
        await next({ rx: 0.32, ry: 0.5, rz: -0.22, config: WOBBLE_OUT_CONFIG });
        await next({ rx: REST.rx, ry: REST.ry, rz: REST.rz, config: WOBBLE_BACK_CONFIG });
      },
    });
  }, [api, reducedMotion]);

  /** Follow the pointer 1:1 while dragging (small offsets — a "nudge", not a throw). */
  const drag = useCallback(
    (x: number, y: number) => {
      if (reducedMotion) return;
      api.start({
        px: x,
        py: y,
        rx: y * 0.6,
        ry: x * 0.6,
        rz: x * 0.15,
        immediate: true,
      });
    },
    [api, reducedMotion],
  );

  /** Flick-and-settle back to rest with a bouncy spring on pointer release. */
  const settle = useCallback(() => {
    if (reducedMotion) return;
    void api.start({
      ...REST,
      config: SETTLE_CONFIG,
    });
  }, [api, reducedMotion]);

  return { rx, ry, rz, px, py, wobble, drag, settle };
}
