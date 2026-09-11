"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";
import { useHasUnfolded } from "../UnfoldContext";

interface PlantProps {
  potRef: RefObject<Group | null>;
  leafRefs: RefObject<Group | null>[];
}

/** A shallow leaf silhouette with a folded-paper crease down the middle. */
function useLeafGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.14, 0.18, 0.05, 0.42);
    shape.quadraticCurveTo(0.02, 0.5, 0, 0.52);
    shape.quadraticCurveTo(-0.02, 0.5, -0.05, 0.42);
    shape.quadraticCurveTo(-0.14, 0.18, 0, 0);
    const geometry = new THREE.ShapeGeometry(shape, 8);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      // Fold crease down the central vein — this, plus the flat toon
      // shading, is what reads as "folded paper" rather than a flat
      // cutout silhouette.
      position.setZ(i, -Math.abs(x) * 0.09);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

/**
 * Small potted plant — three folded-paper leaves in warm olive-green.
 * Per the Canva spec's honest asset-strategy note, this is a primitive
 * (procedural-geometry) build rather than a hand-modeled .glb; see the
 * hero build report for the tradeoff.
 */
export function Plant({ potRef, leafRefs }: PlantProps) {
  const hasUnfolded = useHasUnfolded();
  const gradientMap = getToonGradientMap();
  const leafGeometry = useLeafGeometry();
  const leafAngles = useMemo(() => [-0.5, 0, 0.5], []);

  useFrame(({ clock }) => {
    if (!hasUnfolded.current || !potRef.current) return;
    // Whole pot group sways ±2° on a 6s sine — idle-loop charm, deliberately tiny.
    potRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * THREE.MathUtils.degToRad(2);
  });

  return (
    <group position={[1.55, -0.36, -0.5]}>
      <group ref={potRef}>
        {/* Half-height (0.12) offset so the pot's bottom face sits at the
           group origin — the shared desk-surface reference plane. */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.22, 0.17, 0.24, 8]} />
          <meshToonMaterial color={palette.terracotta} gradientMap={gradientMap} />
          <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
        </mesh>
        {leafAngles.map((angle, i) => (
          <group
            key={i}
            ref={leafRefs[i]}
            position={[Math.sin(angle) * 0.06, 0.22, Math.cos(angle) * 0.06]}
            rotation={[0, angle, 0]}
          >
            <mesh geometry={leafGeometry}>
              <meshToonMaterial
                color={i === 1 ? palette.olive : palette.oliveDark}
                gradientMap={gradientMap}
                side={THREE.DoubleSide}
              />
              <Outlines thickness={1} color={palette.outline} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
