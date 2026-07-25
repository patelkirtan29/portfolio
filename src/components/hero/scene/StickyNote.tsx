"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { Group } from "three";
import { Outlines } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";

interface StickyNoteProps {
  groupRef: RefObject<Group | null>;
}

/**
 * The one deliberately imperfect object — curled at one corner, propped
 * askew against the laptop base, per the Canva spec's "signals lived-in,
 * not staged" note. The curl is a small vertex displacement on a
 * subdivided plane rather than a separate asset.
 */
export function StickyNote({ groupRef }: StickyNoteProps) {
  const gradientMap = getToonGradientMap();

  const geometry = useMemo(() => {
    const size = 0.3;
    const segments = 5;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const position = geo.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      // Curl just the top-right corner upward; everywhere else stays flat.
      const cornerFactor = Math.max(0, x / (size / 2)) * Math.max(0, y / (size / 2));
      position.setZ(i, cornerFactor ** 2 * 0.05);
    }
    position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group ref={groupRef} position={[-0.55, -0.34, 0.62]} rotation={[-1.4, 0, -0.08]}>
      <mesh geometry={geometry}>
        <meshToonMaterial color={palette.stickyNote} gradientMap={gradientMap} side={THREE.DoubleSide} />
        <Outlines thickness={1} color={palette.outline} toneMapped={false} />
      </mesh>
    </group>
  );
}
