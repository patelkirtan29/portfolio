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
 * PERSISTENT SHRINK LIFECYCLE: the Console mounts once (inside Lobby's
 * dynamic import + Suspense boundary — see Lobby.tsx) and never unmounts or
 * disposes itself again for the lifetime of the page. Instead of fading out
 * and tearing down its Three.js resources on room-exit, it transitions from
 * full-bleed (while the Lobby is in view) into a small persistent radar
 * widget docked bottom-right (132×132px, 24px margin) for every other room,
 * then back to full-bleed if the visitor scrolls back up. The rAF loop and
 * renderer/geometry/material/composer disposal in `ConsoleScene`'s effect
 * still only run once, on real mount/unmount of this whole module (i.e.
 * only if Lobby.tsx itself ever stops rendering it, e.g. a pointer-type
 * change) — there is no more time-boxed fade-then-unmount cycle tied to
 * `useCurrentRoom()`.
 *
 * Shrink progress is NOT read from the page-wide `useScrollProgress()` (that
 * was the original bug — see workspace/portfolio_redesign/
 * console_fix_A_shrink_repair.md — whole-page progress barely moves while
 * leaving a short Lobby on a page where Gallery alone is several viewports
 * tall). Instead, `useShrinkProgress()` below scopes a GSAP `ScrollTrigger`
 * to `#lobby` itself (`start: "top top"`, `end: "bottom top"`, `scrub:
 * true`), which reaches progress 1 exactly when the Lobby has scrolled fully
 * past — i.e. exactly when Practice's top edge reaches the viewport top,
 * since Practice sits immediately below Lobby in document flow — regardless
 * of how tall the rest of the page is.
 *
 * The shrunk target is a genuine 132×132 square: width and height are
 * interpolated independently (each targeting 132px on its own axis via
 * `calc()`), not a single uniform `scale` factor applied to a
 * viewport-aspect-ratio box — that mismatch was the secondary bug that made
 * the "shrunk" state 198×132 (or similar) in landscape instead of square.
 *
 * The wrapper is `position: fixed` (viewport-relative) rather than scoped
 * `absolute` inside `<section id="lobby">` — this is what lets it visually
 * persist and dock in a corner across every room, even though it's still
 * rendered from inside Lobby.tsx's JSX (no ancestor between this component
 * and the viewport establishes a transform/filter/perspective/contain
 * containing block, so `position: fixed` here already escapes Lobby's own
 * box, `overflow: hidden`, and document flow entirely — no change to
 * Lobby.tsx's DOM structure or the app root was needed for this to work).
 *
 * The renderer is created with `alpha: true` and `scene.background = null`
 * (previously an opaque navy fill) so only the nodes/light ever render —
 * the radar can never become a solid block that eclipses page content
 * underneath it, matching the Option A repair's transparency requirement.
 *
 * Reduced-motion visitors get a binary snap instead of a scroll-scrubbed
 * shrink: full-bleed while Lobby is the current room, fully shrunk
 * otherwise, with no interpolation riding along live scroll position.
 * Node orbiting itself is also frozen for reduced motion, same as before.
 *
 * Each node's accessible DOM button keeps a comfortable minimum
 * clickable/tappable hit area (36×36px) regardless of how small the
 * rendered 3D node graphic gets at the shrunk 132px scale, so the shrink
 * mechanic doesn't become an accessibility regression.
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
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ROOM_IDS, ROOM_LABELS, scrollToRoom, useCurrentRoom, type RoomId } from "@/lib/scroll";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

const NODE_BASE_COLOR = 0x5c7080;
const ACCENT_EMISSIVE = 0xff6b42;
const BLOOM_LAYER = 1;
const FLOURISH_DURATION_MS = 1600;

/** Target shrunk-state square size + corner margin. Must match the layout
 *  inset reserved in Practice.tsx/Gallery.tsx/Signal.tsx (bottom-right,
 *  24px margin) so the transparent radar never has to overlap body copy. */
const RADAR_SIZE_PX = 132;
const RADAR_MARGIN_PX = 24;
/** Minimum clickable/tappable hit area per node button, independent of how
 *  small the rendered 3D node graphic gets at the shrunk scale. */
const MIN_HIT_AREA_PX = 36;

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

/**
 * Lobby-exit shrink progress: 0 (full-bleed, still inside the Lobby) → 1
 * (fully shrunk to the docked radar). See this file's header comment for
 * why this is scoped to a `#lobby` ScrollTrigger instead of the page-wide
 * `useScrollProgress()`.
 *
 * Reduced-motion visitors get a binary snap (0 while Lobby is the current
 * room, 1 otherwise) instead of the scroll-scrubbed value, so the shrunk
 * widget's size/position is never tied to live scroll position for
 * motion-sensitive users — it just snaps straight to its resting state.
 */
function useShrinkProgress(reducedMotion: boolean, currentRoom: RoomId | null): number {
  const [scrubProgress, setScrubProgress] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const lobby = document.getElementById("lobby");
    if (!lobby) return;

    const trigger = ScrollTrigger.create({
      trigger: lobby,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => setScrubProgress(self.progress),
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  if (reducedMotion) {
    return currentRoom === "lobby" ? 0 : 1;
  }
  return scrubProgress;
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
// Console — the persistent scene, DOM buttons, HUD readout
// ---------------------------------------------------------------------------

export default function Console() {
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

  const shrinkProgress = useShrinkProgress(reducedMotion, currentRoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const scene = new THREE.Scene();
    // Transparent by design: the radar must never be a solid block that can
    // occlude page content once shrunk into a corner — only the orbiting
    // nodes/light render, background shows through to whatever's behind it.
    scene.background = null;

    // Sized off the wrapper's actual rendered box, which now ranges from
    // full-viewport (in the Lobby) down to the 132×132 shrunk square — the
    // ResizeObserver below keeps the renderer/camera in sync as that box's
    // size is continuously interpolated via CSS during scroll.
    const size = {
      width: wrapper.clientWidth || window.innerWidth,
      height: wrapper.clientHeight || window.innerHeight,
    };

    const camera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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

    // Scoped to the wrapper's own box (which now ranges from full-viewport
    // down to the 132×132 shrunk square via CSS), not `window` — this is
    // what keeps the renderer/camera in sync through the whole shrink.
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
    // state are read through refs inside the animation loop. This component
    // now mounts once (from Lobby.tsx's dynamic import) and stays mounted —
    // and therefore this setup only ever runs once — for the whole page
    // lifetime; the shrink transition is handled entirely by re-rendering
    // the wrapper's own size/position below, not by tearing this effect down.
  }, []);

  const markVisited = (id: RoomId) => {
    const canvas = canvasRef.current as (HTMLCanvasElement & { __markVisited?: (id: RoomId) => void }) | null;
    canvas?.__markVisited?.(id);
  };

  return (
    <div
      className="pointer-events-none z-40"
      style={{
        position: "fixed",
        // Anchored from the bottom-right corner: at progress 0 this sits
        // flush with the viewport edge (full-bleed); at progress 1 it's
        // exactly RADAR_MARGIN_PX off the corner. Must match the layout
        // inset reserved in the other rooms (bottom-right, 24px margin).
        right: `calc(${RADAR_MARGIN_PX}px * ${shrinkProgress})`,
        bottom: `calc(${RADAR_MARGIN_PX}px * ${shrinkProgress})`,
        // Width/height interpolated independently, each targeting
        // RADAR_SIZE_PX on its own axis — this is what keeps the shrunk
        // state a genuine square instead of stretching in landscape.
        width: `calc((100vw - ${RADAR_SIZE_PX}px) * ${1 - shrinkProgress} + ${RADAR_SIZE_PX}px)`,
        height: `calc((100vh - ${RADAR_SIZE_PX}px) * ${1 - shrinkProgress} + ${RADAR_SIZE_PX}px)`,
        contain: "layout",
      }}
    >
      <div ref={wrapperRef} className="pointer-events-auto absolute inset-0">
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
              style={{ minWidth: MIN_HIT_AREA_PX, minHeight: MIN_HIT_AREA_PX }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent-secondary/50 bg-surface/70 px-3 py-1 font-mono text-xs uppercase tracking-wide text-foreground backdrop-blur-sm transition-colors duration-150 hover:border-accent-primary hover:text-accent-primary focus-visible:border-accent-primary focus-visible:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
            >
              {node.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
