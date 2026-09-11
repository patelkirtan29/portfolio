"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { RoundedBox, Outlines, Html } from "@react-three/drei";
import { palette } from "../colors";
import { getToonGradientMap } from "../materials/toonMaterial";

interface LaptopProps {
  lidRef: RefObject<Group | null>;
}

// Total unfold runtime (Canva spec §1 stagger table) — the cursor only
// starts blinking once the whole scene has settled, so nothing competes
// with it for attention while things are still moving.
const UNFOLD_TOTAL_MS = 1650;

/**
 * Laptop — a hinged-lid primitive (flat base box + flat lid box rotating
 * on a hinge point) rather than a hand-modeled .glb. Per the Canva spec's
 * own asset-strategy note this was one of the two objects worth
 * hand-modeling given more time; the primitive substitute is a
 * deliberate, time-boxed scope call for this pass (see hero build
 * report).
 */
export function Laptop({ lidRef }: LaptopProps) {
  const gradientMap = getToonGradientMap();
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowCursor(true), UNFOLD_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <group position={[-0.1, -0.36, 0.15]}>
      {/* Base */}
      <RoundedBox args={[1.15, 0.06, 0.78]} radius={0.02} smoothness={2} position={[0, 0.03, 0]}>
        <meshToonMaterial color={palette.bookB} gradientMap={gradientMap} />
        <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
      </RoundedBox>

      {/* Lid — hinges from the back edge of the base. Lid box position.y
         is +0.03 (its own half-height) so its bottom face rests flush on
         the hinge plane when closed, instead of straddling/overlapping
         into the base. */}
      <group position={[0, 0.06, -0.38]} ref={lidRef}>
        <RoundedBox args={[1.15, 0.06, 0.76]} radius={0.02} smoothness={2} position={[0, 0.03, 0.38]}>
          <meshToonMaterial color={palette.bookB} gradientMap={gradientMap} />
          <Outlines thickness={1.2} color={palette.outline} toneMapped={false} />
        </RoundedBox>

        {/*
          Screen face — the lid's INNER face, which (per a real laptop)
          faces down (-Y, toward the keyboard) when closed, then swings
          to face the viewer once the lid rotates open on its hinge.
          rotation.x = +90° gives the plane a -Y-facing normal in the
          lid's own local space; combined with the lid group's open
          rotation (-100° about X, applied one level up), that normal
          ends up pointing toward the camera (+Z-ish, slightly +Y) once
          open. `side={THREE.DoubleSide}` is a deliberate safety net —
          primitive hinge geometry like this is easy to get subtly wrong,
          and there's no harm in the screen being visible from both
          sides. Flat-shaded warm cream, no UI chrome, per the Canva spec.
        */}
        <mesh position={[0, -0.001, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.02, 0.66]} />
          <meshToonMaterial color={palette.screen} gradientMap={gradientMap} side={THREE.DoubleSide} />
        </mesh>

        {showCursor && (
          <Html
            transform
            occlude={false}
            position={[-0.32, -0.001, 0.38]}
            rotation={[Math.PI / 2, 0, 0]}
            style={{ pointerEvents: "none" }}
          >
            {/* Cursor blink is CSS-timed (not GSAP/useFrame) — cheaper,
               per the Canva spec's idle-loop section. */}
            <style>{`
              @keyframes maestroHeroCursorBlink {
                0%, 49% { opacity: 1; }
                50%, 100% { opacity: 0; }
              }
            `}</style>
            <div
              style={{
                width: 6,
                height: 16,
                background: palette.cursor,
                animation: "maestroHeroCursorBlink 1s steps(1, end) infinite",
              }}
            />
          </Html>
        )}
      </group>
    </group>
  );
}
