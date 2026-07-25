"use client";

import type { RefObject } from "react";
import type { Group, PointLight } from "three";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";
import { useHasUnfolded } from "../UnfoldContext";

interface LampProps {
  armRef: RefObject<Group | null>;
  lightRef: RefObject<PointLight | null>;
}

const BASE_INTENSITY = 1.1;

/**
 * Desk lamp — articulated arm, tips up and "clicks on" as a warm
 * point-light flick (not a beam). Idle: light intensity breathes
 * 0.95–1.0 on an 8s cycle once the unfold has settled.
 */
export function Lamp({ armRef, lightRef }: LampProps) {
  const hasUnfolded = useHasUnfolded();
  const gradientMap = getToonGradientMap();

  useFrame(({ clock }) => {
    if (!hasUnfolded.current || !lightRef.current) return;
    const breathe = 0.95 + 0.05 * ((Math.sin(clock.elapsedTime * ((Math.PI * 2) / 8)) + 1) / 2);
    lightRef.current.intensity = breathe * BASE_INTENSITY;
  });

  return (
    <group position={[-1.6, -0.36, -0.6]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 8]} />
        <meshToonMaterial color={palette.terracotta} gradientMap={gradientMap} />
        <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
      </mesh>
      {/* Articulated arm — hinges upright from the base */}
      <group ref={armRef} position={[0, 0.04, 0]}>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.56, 6]} />
          <meshToonMaterial color={palette.bookB} gradientMap={gradientMap} />
          <Outlines thickness={1} color={palette.outline} toneMapped={false} />
        </mesh>
        <mesh position={[0.12, 0.56, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.16, 0.22, 8, 1, true]} />
          <meshToonMaterial color={palette.terracotta} gradientMap={gradientMap} side={THREE.DoubleSide} />
          <Outlines thickness={1.1} color={palette.outline} toneMapped={false} />
        </mesh>
        <pointLight
          ref={lightRef}
          position={[0.14, 0.5, 0]}
          color={palette.lampLight}
          intensity={0}
          distance={2.2}
          decay={2}
        />
      </group>
    </group>
  );
}
