"use client";

// Work section desk-object "trinket" — small 3D toy-physics decoration for
// the existing accessible disclosure cards on /work (see ProjectCard.tsx).
// Purely additive/decorative: hover wobble + drag-and-settle via spring
// motion (no physics engine — see package.json / build report for the
// @react-spring/three choice). Never replaces or gates the real
// keyboard-operable, screen-reader-labeled disclosure trigger underneath.
//
// STUB — real trinket geometry/spring behavior lands in the work-trinket
// build stream. Intentionally inert (returns null) so it is safe to
// import/mount ahead of that work without any visual or bundle-size effect.
export type TrinketProps = {
  variant?: string;
};

export default function Trinket(props: TrinketProps) {
  void props;
  return null;
}
