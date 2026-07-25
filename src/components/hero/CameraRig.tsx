"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import type { ParallaxTarget } from "./hooks/useCursorParallax";

interface CameraRigProps {
  parallaxTarget: RefObject<ParallaxTarget>;
  scrollProgress: RefObject<number>;
}

// Figma spec's technical standard: damped lerp, not 1:1 — "a snappy 1:1
// cursor follow reads as a debug gizmo, not craft." Max offset caps the
// parallax so it's felt at the edges of the screen, not disorienting.
const MAX_OFFSET = 0.32;
const DAMPING = 0.04;
const BASE_Y = 0.9;

// Scroll-exit dolly range — camera pushes in slightly as the visitor
// scrolls past the hero (coordinated with the opacity fade in
// HeroScene.tsx, not a hard cut).
const DOLLY_FAR = 6.2;
const DOLLY_NEAR = 4.8;

/**
 * Camera-plane cursor parallax + scroll-exit dolly. Object rotation
 * (none exists here — the desk scene has no autonomous spin, per the
 * Canva spec's "purely entrance-then-idle" framing) stays untouched;
 * only camera position is offset, exactly per the Figma spec's
 * pseudocode.
 */
export function CameraRig({ parallaxTarget, scrollProgress }: CameraRigProps) {
  const { camera } = useThree();

  useFrame(() => {
    const target = parallaxTarget.current;
    const p = scrollProgress.current;

    const dollyZ = THREE.MathUtils.lerp(DOLLY_FAR, DOLLY_NEAR, p);
    const targetX = target.x * MAX_OFFSET;
    const targetY = BASE_Y + -target.y * MAX_OFFSET * 0.6;

    /* eslint-disable react-hooks/immutability -- `camera` is a three.js
       Object3D, not React-managed state. Mutating .position each frame
       inside useFrame is the standard @react-three/fiber pattern (avoids
       a React re-render per frame); the immutability rule doesn't
       distinguish three.js objects from React hook return values. */
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, DAMPING);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, DAMPING);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, dollyZ, DAMPING);
    camera.lookAt(0, 0.05, 0);
    /* eslint-enable react-hooks/immutability */
  });

  return null;
}
