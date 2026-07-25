import * as THREE from "three";

let cachedGradientMap: THREE.DataTexture | null = null;

/**
 * Shared 3-step toon gradient map for every `meshToonMaterial` in the
 * scene. Cached at module scope so every object reuses the same tiny
 * texture instead of each allocating its own — cheap, and keeps the
 * flat-shaded "risograph" banding consistent across all six objects per
 * the Canva spec's material section.
 */
export function getToonGradientMap(): THREE.DataTexture {
  if (cachedGradientMap) return cachedGradientMap;

  const steps = 3;
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round(((i + 1) / steps) * 255);
  }

  const texture = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  cachedGradientMap = texture;
  return texture;
}
