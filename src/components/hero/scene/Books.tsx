"use client";

import type { RefObject } from "react";
import type { Group } from "three";
import { RoundedBox, Outlines } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";

interface BooksProps {
  groupRef: RefObject<Group | null>;
}

/**
 * Stack of two books, spines toward camera. The top one sits slightly
 * off-square — the "one slightly askew" human-touch detail from the
 * Canva spec — and carries the desaturated-coral spine highlight.
 */
export function Books({ groupRef }: BooksProps) {
  const gradientMap = getToonGradientMap();
  return (
    <group ref={groupRef} position={[-1.35, -0.36, 0.55]}>
      {/* Bottom book: half-height 0.08 offset so its bottom face sits at
         the group origin (the shared desk-surface reference plane),
         not centered through it. */}
      <RoundedBox args={[1.05, 0.16, 0.72]} radius={0.02} smoothness={2} position={[0, 0.08, 0]}>
        <meshToonMaterial color={palette.bookA} gradientMap={gradientMap} />
        <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
      </RoundedBox>
      {/* Top book: bottom book's full height (0.16) + its own half-height
         (0.07), plus the "one slightly askew" human-touch offset. */}
      <RoundedBox
        args={[0.92, 0.14, 0.62]}
        radius={0.02}
        smoothness={2}
        position={[0.05, 0.23, -0.03]}
        rotation={[0, 0.12, 0.05]}
      >
        <meshToonMaterial color={palette.coralHighlight} gradientMap={gradientMap} />
        <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
      </RoundedBox>
    </group>
  );
}
