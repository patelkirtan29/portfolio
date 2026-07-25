"use client";

/**
 * Console — the site's signature 3D navigation instrument ("Mission Console").
 *
 * Four low-poly nodes (icosahedron / torus / octahedron / box) orbit a
 * central point light in plain Three.js. Each node maps to one room
 * (Lobby/Practice/Gallery/Signal). The visible accessible surface is a layer
 * of real DOM <button>s kept in sync with the projected screen position of
 * each mesh every animation frame — the <canvas> itself is purely decorative
 * (`aria-hidden`).
 *
 * LOBBY-ONLY LIFECYCLE: the Console only exists while the Lobby room is
 * active. There is no shrunk/persistent corner-widget state anymore — that
 * mechanic (`useConsoleShrinkProgress` / `getShrinkTransform`, driven by
 * whole-page scroll progress) was the root cause of the Console staying
 * large and opaque over page content in every other room, so it's been
 * removed outright rather than repaired. The outer `Console` component below
 * gates on `useCurrentRoom() === "lobby"` (from `@/lib/scroll`): on exit
 * (scroll-past Lobby, or a node-click jump elsewhere) it keeps the scene
 * mounted just long enough to play a short opacity fade
 * (`FADE_DURATION_MS`), then stops rendering `ConsoleScene` for good, which
 * unmounts it for real — canceling the rAF loop and disposing the
 * renderer/geometries/materials/composers, so nothing keeps costing GPU/
 * battery once you've scrolled away. Every other room's wayfinding is
 * handled independently by `Nav.tsx` (already correct, not touched here).
 *
 * The canvas + node buttons are scoped *inside* `<section id="lobby">`
 * (`absolute inset-0` against that section, sized via a `ResizeObserver` on
 * the wrapper) rather than pinned to the viewport — it no longer needs to
 * escape into other rooms' space.
 *
 * This module is meant to be loaded via `next/dynamic(() => import(...), {
 * ssr: false })` from `rooms/Lobby.tsx`, wrapped in `<Suspense>`, and only on
 * fine-pointer (non-mobile) devices — see Lobby.tsx for that gate. Because
 * this whole module is only ever fetched behind that dynamic import, it is
 * safe to statically import `three` here: doing so does not block initial
 * content paint, since the chunk containing this file (and three) is never
 * requested until Lobby decides a 3D-capable device is looking at it.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ROOM_IDS, ROOM_LABELS, scrollToRoom, useCurrentRoom, type RoomId } from "@/lib/scroll";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface ConsoleNodeConfig {
  id: RoomId;
  label: string;
  href: string;
  geometry: "icosahedron" | "torus" | "octahedron" | "box";
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
}

/** icosahedron/torus/octahedron/box, in `ROOM_IDS` order, per the creative
 *  brief. Ids/labels are single-sourced from `@/lib/scroll` (the same source
 *  `Nav.tsx` reads) so this can never drift back to the stale
 *  Home/About/Projects/Contact labels. */
const NODE_GEOMETRY_BY_ROOM: Record<RoomId, ConsoleNodeConfig["geometry"]> = {
  lobby: "icosahedron",
  practice: "torus",
  gallery: "octahedron",
  signal: "box",
};

const CONSOLE_NODES: ConsoleNodeConfig[] = ROOM_IDS.map((id, index) => ({
  id,
  label: ROOM_LABELS[id],
  href: `#${id}`,
  geometry: NODE_GEOMETRY_BY_ROOM[id],
  orbitRadius: 2.6,
  orbitSpeed: 0.22,
  phase: (index * Math.PI) / 2,
}));

const SCENE_BACKGROUND = 0x0d1420;
const NODE_BASE_COLOR = 0x5c7080;
const ACCENT_EMISSIVE = 0xff6b42;
const BLOOM_LAYER = 1;
const FLOURISH_DURATION_MS = 1600;
/** Room-exit opacity transition, then full unmount. Kept inside the
 *  150-250ms window called out in the approved fix. */
const FADE_DURATION_MS = 200;

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
// Outer component — Lobby-scoped mount / fade / unmount gate
// ---------------------------------------------------------------------------

/**
 * Renders `ConsoleScene` only while the Lobby room is active. On exit, keeps
 * `ConsoleScene` mounted for `FADE_DURATION_MS` — its wrapper transitions
 * opacity to 0 during that window — and only then stops rendering it, so
 * `ConsoleScene`'s own effect cleanup (rAF cancel + full Three.js dispose)
 * runs at the end of the fade instead of cutting it off mid-transition.
 * Re-entering Lobby (scrolling back up) cancels any pending unmount and
 * remounts immediately.
 */
export default function Console() {
  const currentRoom = useCurrentRoom();
  const isLobby = currentRoom === "lobby";
  const [sceneMounted, setSceneMounted] = useState(isLobby);

  // Entering (or re-entering) the Lobby mounts immediately. This is a
  // render-phase state adjustment (not an effect) per React's documented
  // "adjusting state when a prop changes" pattern: it only ever fires when
  // `sceneMounted` still disagrees with `isLobby`, so it settles after one
  // extra render and never loops.
  if (isLobby && !sceneMounted) {
    setSceneMounted(true);
  }

  // Leaving the Lobby: let the opacity transition play out for
  // FADE_DURATION_MS, then unmount ConsoleScene for real (cancels its rAF
  // loop and disposes the Three.js renderer/geometries/materials/composers).
  useEffect(() => {
    if (isLobby || !sceneMounted) return;
    const timeoutId = window.setTimeout(() => {
      setSceneMounted(false);
    }, FADE_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isLobby, sceneMounted]);

  if (!sceneMounted) return null;
  return <ConsoleScene isLobby={isLobby} />;
}

// ---------------------------------------------------------------------------
// Inner component — the actual Three.js scene, DOM buttons, HUD readout
// ---------------------------------------------------------------------------

function ConsoleScene({ isLobby }: { isLobby: boolean }) {
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
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_BACKGROUND);

    // Sized off the Lobby-scoped wrapper, not the viewport — the container
    // this now lives in is `absolute inset-0` against `<section id="lobby">`
    // rather than `fixed inset-0` against the whole page.
    const size = {
      width: wrapper.clientWidth || window.innerWidth,
      height: wrapper.clientHeight || window.innerHeight,
    };

    const camera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size.width, size.height, false);

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
      new THREE.Vector2(size.width, size.height),
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

    const applySize = (width: number, height: number) => {
      size.width = width;
      size.height = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      bloomComposer.setSize(width, height);
      finalComposer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    };

    // Scoped to the wrapper (the Lobby section's own box), not `window` —
    // there's no viewport-fixed geometry left to keep in sync.
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) applySize(width, height);
    });
    resizeObserver.observe(wrapper);

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
          const x = (projected.x * 0.5 + 0.5) * size.width;
          const y = (-projected.y * 0.5 + 0.5) * size.height;
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
      resizeObserver.disconnect();
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
    // Intentionally run once per mount: reduced-motion / hover / current-room
    // state are read through refs inside the animation loop, and this whole
    // component only ever mounts while the Lobby is active (or mid-fade-out),
    // so this setup never has to re-run — it only ever runs once per
    // mount/unmount cycle, which is exactly the "dispose everything on exit"
    // behavior we want.
  }, []);

  const markVisited = (id: RoomId) => {
    const canvas = canvasRef.current as (HTMLCanvasElement & { __markVisited?: (id: RoomId) => void }) | null;
    canvas?.__markVisited?.(id);
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 transition-opacity ease-out"
      style={{ contain: "layout", opacity: isLobby ? 1 : 0, transitionDuration: `${FADE_DURATION_MS}ms` }}
    >
      <div
        ref={wrapperRef}
        className={isLobby ? "pointer-events-auto absolute inset-0" : "pointer-events-none absolute inset-0"}
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
              onClick={() => scrollToRoom(node.id)}
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
