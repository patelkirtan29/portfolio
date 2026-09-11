"use client";

import type { RefObject } from "react";
import type { Group } from "three";
import { RoundedBox, Outlines } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";

interface DeskProps {
  groupRef: RefObject<Group | null>;
}

/**
 * The desk slab — the "page" the rest of the scene unfolds from. A
 * single beveled cream slab; drei's RoundedBox gives the soft
 * paper-craft edge bevel the Canva spec calls for without a full
 * CSG/bevel-modifier pipeline.
 */
// Slab is 0.16 deep and centered on its own origin, so a slab position
// of -0.44 puts its top face at exactly -0.36 — the shared "desk
// surface" plane every other object's group position sits on (Books,
// Laptop, Mug, Lamp all use y=-0.36 as their own bottom-face reference).
const SLAB_Y = -0.44;

export function Desk({ groupRef }: DeskProps) {
  const gradientMap = getToonGradientMap();
  return (
    <group ref={groupRef} position={[0, SLAB_Y, 0]}>
      <RoundedBox args={[4.4, 0.16, 2.6]} radius={0.05} smoothness={2}>
        <meshToonMaterial color={palette.desk} gradientMap={gradientMap} />
        <Outlines thickness={1.3} color={palette.outline} toneMapped={false} />
      </RoundedBox>
    </group>
  );
}
