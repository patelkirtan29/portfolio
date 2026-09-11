"use client";

import { Suspense } from "react";
import type { RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { DeskGroup } from "./DeskGroup";
import type { ParallaxTarget } from "./hooks/useCursorParallax";
import { palette } from "./colors";

interface DeskCanvasProps {
  parallaxTarget: RefObject<ParallaxTarget>;
  scrollProgress: RefObject<number>;
}

/**
 * <Canvas> setup — gl props, camera, lighting, post-processing. Color
 * management is the Figma spec's #1 non-negotiable: explicit ACES
 * Filmic tone mapping + sRGB output color space (Three's default linear
 * tone mapping reads flat/over-bright).
 *
 * Post-processing is deliberately minimal here: a single soft Vignette.
 * The Figma doc's Bloom/DepthOfField stack was written for its own
 * abstract lattice concept (bright emissive nodes on a dark void); this
 * scene is flat-shaded toon paper-craft with "no gradients, no specular
 * highlights" per the Canva spec, so adding bloom would fight the
 * intended look rather than support it. Vignette alone still satisfies
 * "proper post-processing" as a technical baseline (EffectComposer
 * wired correctly, not skipped) without gimmicking the paper-craft
 * material.
 */
export function DeskCanvas({ parallaxTarget, scrollProgress }: DeskCanvasProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={false}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [0, 0.9, 6.2], fov: 32, near: 0.1, far: 30 }}
    >
      <ambientLight intensity={0.55} color="#fff6ea" />
      <directionalLight position={[3, 4, 3]} intensity={1.1} color="#fff1de" />
      <Suspense fallback={null}>
        <DeskGroup />
        {/* -0.51 = desk surface (-0.36 local) + DeskGroup's outer -0.15
           offset, i.e. just under the desk top face. */}
        <ContactShadows
          position={[0, -0.51, 0]}
          opacity={0.35}
          scale={6}
          blur={2.6}
          far={1.2}
          resolution={256}
          color={palette.outline}
        />
      </Suspense>
      <CameraRig parallaxTarget={parallaxTarget} scrollProgress={scrollProgress} />
      <EffectComposer multisampling={0}>
        <Vignette eskil={false} offset={0.32} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
