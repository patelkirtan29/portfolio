"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useHasUnfolded } from "../UnfoldContext";

function createSoftDiscTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

let cachedTexture: THREE.CanvasTexture | null = null;
function getWispTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (!cachedTexture) cachedTexture = createSoftDiscTexture();
  return cachedTexture;
}

interface SteamWispProps {
  position: [number, number, number];
}

/**
 * Two low-opacity billboarded planes drifting up and dissipating on a 3s
 * loop, phase-offset from each other so it never looks mechanically
 * identical twice — per the Canva spec's idle-loop charm section. Gated
 * on `hasUnfolded` so steam only begins once the mug has popped up and
 * the whole unfold has settled.
 */
export function SteamWisp({ position }: SteamWispProps) {
  const hasUnfolded = useHasUnfolded();
  const texture = useMemo(() => getWispTexture(), []);
  const wisps = useRef<(THREE.Mesh | null)[]>([]);
  const phases = useMemo(() => [0, 1.5], []);

  useFrame(({ clock }) => {
    if (!hasUnfolded.current) return;
    const t = clock.elapsedTime;
    const cycle = 3;
    wisps.current.forEach((mesh, i) => {
      if (!mesh) return;
      const local = ((t + phases[i]) % cycle) / cycle; // 0..1
      // Relative to the parent <Billboard position={position}> anchor —
      // do not re-add the anchor position here. Rise distance is
      // deliberately small (this is a mug-sized wisp, not a smoke
      // plume) — 0.9 units read as detached floating orbs at this
      // scene's scale.
      mesh.position.set(Math.sin(local * Math.PI * 2 + i) * 0.02, local * 0.22, 0);
      const fade = Math.sin(local * Math.PI); // 0 -> 1 -> 0
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = fade * 0.22;
    });
  });

  if (!texture) return null;

  return (
    <>
      {phases.map((_, i) => (
        <Billboard key={i} position={position}>
          <mesh
            ref={(el) => {
              wisps.current[i] = el;
            }}
          >
            <planeGeometry args={[0.12, 0.16]} />
            <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}
