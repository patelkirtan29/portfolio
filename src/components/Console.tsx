"use client";

/**
 * Console — the site's signature 3D navigation instrument ("Mission Console").
 *
 * Four low-poly nodes (icosahedron / torus / octahedron / box) orbit a
 * central point light in plain Three.js. Each node maps to one room
 * (Home/Lobby, About/Practice, Projects/Gallery, Contact/Signal). The visual
 * accessible surface is a layer of real DOM <button>s kept in sync with the
 * projected screen position of each mesh every animation frame — the
 * <canvas> itself is purely decorative (`aria-hidden`).
 *
 * This module is meant to be loaded via `next/dynamic(() => import(...), {
 * ssr: false })` from `rooms/Lobby.tsx`, wrapped in `<Suspense>`, and only on
 * fine-pointer (non-mobile) devices — see Lobby.tsx for that gate. Because
 * this whole module is only ever fetched behind that dynamic import, it is
 * safe to statically import `three` here: doing so does not block initial
 * content paint, since the chunk containing this file (and three) is never
 * requested until Lobby decides a 3D-capable device is looking at it.
 *
 * ASSUMPTION / INTEGRATION NOTE — scroll source:
 * The creative direction calls for Lenis to be the single canonical scroll
 * source, and for a `useLenis()` hook to live at `@/lib/scroll` (owned by
 * Stream 2 / Scroll Engine, built concurrently in a sibling worktree — that
 * file does not exist here yet). Rather than import a module that doesn't
 * exist in this worktree (which would break `npm run build`), this file
 * implements a local, dependency-free stand-in — `useConsoleShrinkProgress`
 * below — that watches native `scroll`/`resize` events against the Lobby
 * section's bounding rect to produce the same [0, 1] shrink signal a real
 * `useLenis()`-backed hook would. When Stream 2's hook lands during
 * integration, swap the body of `useConsoleShrinkProgress` for a read off
 * the shared Lenis instance so the Console shrink and the room-snap/reveal
 * system read from one clock instead of two.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCurrentRoom, useScrollProgress } from "@/lib/scroll";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

type RoomId = "lobby" | "practice" | "gallery" | "signal";

interface ConsoleNodeConfig {
  id: RoomId;
  label: string;
  href: string;
  geometry: "icosahedron" | "torus" | "octahedron" | "box";
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
}

/** Home/About/Projects/Contact -> Lobby/Practice/Gallery/Signal, in the
 *  icosahedron/torus/octahedron/box order called out in the creative brief. */
const CONSOLE_NODES: ConsoleNodeConfig[] = [
  { id: "lobby", label: "Home", href: "#lobby", geometry: "icosahedron", orbitRadius: 2.6, orbitSpeed: 0.22, phase: 0 },
  { id: "practice", label: "About", href: "#practice", geometry: "torus", orbitRadius: 2.6, orbitSpeed: 0.22, phase: Math.PI / 2 },
  { id: "gallery", label: "Projects", href: "#gallery", geometry: "octahedron", orbitRadius: 2.6, orbitSpeed: 0.22, phase: Math.PI },
  { id: "signal", label: "Contact", href: "#signal", geometry: "box", orbitRadius: 2.6, orbitSpeed: 0.22, phase: (3 * Math.PI) / 2 },
];

const SCENE_BACKGROUND = 0x0d1420;
const NODE_BASE_COLOR = 0x5c7080;
const ACCENT_EMISSIVE = 0xff6b42;
const BLOOM_LAYER = 1;
const FLOURISH_DURATION_MS = 1600;
const RADAR_SIZE_PX = 132;
const RADAR_MARGIN_PX = 24;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function subscribeReducedMotion(callback: () => void): () => void {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/** `useSyncExternalStore` reads `matchMedia` without ever calling `setState`
 *  synchronously inside an effect body (flagged by
 *  `react-hooks/set-state-in-effect`) and stays SSR-safe via the
 *  server-snapshot fallback, even though this module only ever mounts
 *  client-side. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

/** INTEGRATION: was a local, dependency-free rAF/`getBoundingClientRect`
 *  stand-in (see file header note) for Stream 2's `useLenis()`-backed scroll
 *  source. Now that `@/lib/scroll` exists, this reads off the shared Lenis
 *  singleton's `useScrollProgress()` so the Console shrink and the
 *  room-snap/reveal system read from one clock instead of two. */
function useConsoleShrinkProgress(): number {
  return useScrollProgress();
}

/** Full-bleed-hero -> fixed-corner-radar CSS transform for a given progress. */
function getShrinkTransform(progress: number): string {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minDim = Math.min(vw, vh);
  const scale = 1 - progress * (1 - RADAR_SIZE_PX / minDim);
  const targetX = vw / 2 - RADAR_MARGIN_PX - RADAR_SIZE_PX / 2;
  const targetY = vh / 2 - RADAR_MARGIN_PX - RADAR_SIZE_PX / 2;
  const translateX = progress * targetX;
  const translateY = progress * targetY;
  return `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
}

/** One soft, one-time oscillator chime. No audio library needed for a
 *  single tone; silently no-ops if Web Audio is unavailable/blocked. */
function playCompletionChime() {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 — soft, not alarming
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.35);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // Delight-only embellishment — never load-bearing, so we fail silently.
  }
}

function easeInOutHump(t: number): number {
  // 0 -> 1 -> 0 hump across [0, 1], used to swing into and back out of the
  // one-time "nodes align" flourish.
  return Math.sin(Math.min(Math.max(t, 0), 1) * Math.PI);
}

function makeNodeGeometry(kind: ConsoleNodeConfig["geometry"]): THREE.BufferGeometry {
  switch (kind) {
    case "icosahedron":
      return new THREE.IcosahedronGeometry(0.55, 0);
    case "torus":
      return new THREE.TorusGeometry(0.42, 0.16, 6, 8);
    case "octahedron":
      return new THREE.OctahedronGeometry(0.62, 0);
    case "box":
      return new THREE.BoxGeometry(0.82, 0.82, 0.82);
    default:
      return new THREE.IcosahedronGeometry(0.55, 0);
  }
}

interface LiveNode {
  config: ConsoleNodeConfig;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Console() {
  const shrinkProgress = useConsoleShrinkProgress();
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const readoutRef = useRef<HTMLDivElement | null>(null);

  const [hoveredId, setHoveredId] = useState<RoomId | null>(null);
  const hoveredIdRef = useRef<RoomId | null>(null);
  useEffect(() => {
    hoveredIdRef.current = hoveredId;
  }, [hoveredId]);

  const currentRoom = useCurrentRoom();
  const currentRoomRef = useRef<RoomId | null>(currentRoom);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_BACKGROUND);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const ambient = new THREE.AmbientLight(0x22334a, 0.7);
    const coreLight = new THREE.PointLight(0xffffff, 18, 20, 2);
    coreLight.position.set(0, 0, 0);
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf2efe9 }),
    );
    scene.add(ambient, coreLight, coreMesh);

    const nodes: LiveNode[] = CONSOLE_NODES.map((config) => {
      const geometry = makeNodeGeometry(config.geometry);
      const material = new THREE.MeshStandardMaterial({
        color: NODE_BASE_COLOR,
        roughness: 0.5,
        metalness: 0.2,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      return { config, mesh };
    });

    // --- Selective bloom (restrained: only the hovered/active node blooms) ---
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_LAYER);
    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const materialCache = new Map<string, THREE.Material>();

    const darkenNonBloomed = (obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !bloomLayer.test(mesh.layers)) {
        materialCache.set(mesh.uuid, mesh.material as THREE.Material);
        mesh.material = darkMaterial;
      }
    };
    const restoreMaterial = (obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      const cached = materialCache.get(mesh.uuid);
      if (cached) {
        mesh.material = cached;
        materialCache.delete(mesh.uuid);
      }
    };

    const renderScenePass = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.85, // strength — restrained, not a full-scene glow
      0.6, // radius
      0.15, // threshold
    );
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScenePass);
    bloomComposer.addPass(bloomPass);

    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv);
          }
        `,
        defines: {},
      }),
      "baseTexture",
    );
    mixPass.needsSwap = true;

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScenePass);
    finalComposer.addPass(mixPass);
    finalComposer.addPass(new OutputPass());

    // --- Delight moment: hover/focus every node once -> one-time flourish ---
    const visited = new Set<RoomId>();
    let flourishTriggered = false;
    let flourishStart: number | null = null;

    const clock = new THREE.Clock();
    let rafId = 0;
    const projected = new THREE.Vector3();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      bloomComposer.setSize(w, h);
      finalComposer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const isReduced = reducedMotionRef.current;
      const activeId = hoveredIdRef.current;
      const currentRoom = currentRoomRef.current;

      // Trigger the one-time flourish once every node has been visited.
      if (visited.size >= CONSOLE_NODES.length && !flourishTriggered) {
        flourishTriggered = true;
        flourishStart = elapsed;
        playCompletionChime();
      }

      const flourishActive =
        !isReduced && flourishStart !== null && elapsed - flourishStart < FLOURISH_DURATION_MS / 1000;
      const flourishT = flourishStart !== null ? (elapsed - flourishStart) / (FLOURISH_DURATION_MS / 1000) : 1;
      const flourishEase = flourishActive ? easeInOutHump(flourishT) : 0;

      nodes.forEach(({ config, mesh }, index) => {
        const angle = isReduced ? config.phase : config.phase + elapsed * config.orbitSpeed;
        const orbitX = Math.cos(angle) * config.orbitRadius;
        const orbitY = Math.sin(angle) * config.orbitRadius * 0.55;
        const orbitZ = Math.sin(angle * 0.5) * 0.9;

        if (flourishEase > 0) {
          const lineX = (index - (CONSOLE_NODES.length - 1) / 2) * 1.35;
          mesh.position.set(
            orbitX + (lineX - orbitX) * flourishEase,
            orbitY + (0 - orbitY) * flourishEase,
            orbitZ + (1.4 - orbitZ) * flourishEase,
          );
        } else {
          mesh.position.set(orbitX, orbitY, orbitZ);
        }

        if (!isReduced) {
          mesh.rotation.x += 0.006;
          mesh.rotation.y += 0.009;
        }

        const isActive = config.id === activeId || config.id === currentRoom || flourishEase > 0.6;
        mesh.layers.set(0);
        if (isActive) {
          mesh.layers.enable(BLOOM_LAYER);
          mesh.material.emissive.setHex(ACCENT_EMISSIVE);
          mesh.material.emissiveIntensity = 1.4;
        } else {
          mesh.material.emissive.setHex(0x000000);
          mesh.material.emissiveIntensity = 0;
        }

        // Position the DOM button + HUD readout over the projected node.
        const button = buttonRefs.current[index];
        if (button) {
          mesh.getWorldPosition(projected);
          projected.project(camera);
          const behindCamera = projected.z > 1;
          const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
          button.style.left = `${x}px`;
          button.style.top = `${y}px`;
          button.style.opacity = behindCamera ? "0" : "1";
          button.style.pointerEvents = behindCamera ? "none" : "auto";

          if (config.id === activeId && readoutRef.current) {
            readoutRef.current.style.left = `${x}px`;
            readoutRef.current.style.top = `${y - 34}px`;
            readoutRef.current.style.opacity = "1";
            readoutRef.current.textContent = `${config.label.toUpperCase()} · ${orbitX.toFixed(2)}, ${orbitY.toFixed(2)}`;
          }
        }
      });

      if (!activeId && readoutRef.current) {
        readoutRef.current.style.opacity = "0";
      }

      if (activeId || currentRoom || flourishEase > 0) {
        scene.traverse(darkenNonBloomed);
        bloomComposer.render();
        scene.traverse(restoreMaterial);
        finalComposer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Expose a way for hover/focus handlers (attached in JSX) to mark a room
    // visited, without re-running this whole effect on every hover change.
    (canvas as HTMLCanvasElement & { __markVisited?: (id: RoomId) => void }).__markVisited = (id: RoomId) => {
      visited.add(id);
    };

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      nodes.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      coreMesh.geometry.dispose();
      (coreMesh.material as THREE.Material).dispose();
      darkMaterial.dispose();
      bloomComposer.dispose();
      finalComposer.dispose();
      renderer.dispose();
    };
    // Intentionally run once: reduced-motion / hover state are read through
    // refs inside the animation loop so this setup never has to re-run.
  }, []);

  const markVisited = (id: RoomId) => {
    const canvas = canvasRef.current as (HTMLCanvasElement & { __markVisited?: (id: RoomId) => void }) | null;
    canvas?.__markVisited?.(id);
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40"
      style={{ contain: "layout" }}
    >
      <div
        ref={wrapperRef}
        className="pointer-events-auto absolute inset-0"
        style={{
          transform: getShrinkTransform(shrinkProgress),
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        <div
          ref={readoutRef}
          aria-hidden="true"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-accent-primary/40 bg-surface/80 px-2 py-1 font-mono text-[10px] tracking-wide text-accent-primary opacity-0 transition-opacity duration-150"
        />

        <nav
          aria-label="Room navigation"
          className="absolute inset-0 z-20"
        >
          {CONSOLE_NODES.map((node, index) => (
            <button
              key={node.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              onClick={() => {
                window.location.hash = node.href;
              }}
              onMouseEnter={() => {
                setHoveredId(node.id);
                markVisited(node.id);
              }}
              onMouseLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
              onFocus={() => {
                setHoveredId(node.id);
                markVisited(node.id);
              }}
              onBlur={() => setHoveredId((current) => (current === node.id ? null : current))}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-secondary/50 bg-surface/70 px-3 py-1 font-mono text-xs uppercase tracking-wide text-foreground backdrop-blur-sm transition-colors duration-150 hover:border-accent-primary hover:text-accent-primary focus-visible:border-accent-primary focus-visible:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
            >
              {node.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
