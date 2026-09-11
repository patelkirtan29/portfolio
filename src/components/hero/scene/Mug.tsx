"use client";

import type { RefObject } from "react";
import type { Group } from "three";
import { Outlines } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";
import { SteamWisp } from "./SteamWisp";

interface MugProps {
  groupRef: RefObject<Group | null>;
}

/** Coffee mug, half-full, matte ceramic in the site's coral accent. */
export function Mug({ groupRef }: MugProps) {
  const gradientMap = getToonGradientMap();
  return (
    <group ref={groupRef} position={[0.75, -0.36, 0.7]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.14, 0.13, 0.2, 10]} />
        <meshToonMaterial color={palette.coralHighlight} gradientMap={gradientMap} />
        <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
      </mesh>
      {/* Coffee — half-full disc near the rim */}
      <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.125, 10]} />
        <meshToonMaterial color={palette.outline} gradientMap={gradientMap} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.16, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.02, 6, 12, Math.PI]} />
        <meshToonMaterial color={palette.coralHighlight} gradientMap={gradientMap} />
      </mesh>
      <SteamWisp position={[0, 0.28, 0]} />
    </group>
  );
}
