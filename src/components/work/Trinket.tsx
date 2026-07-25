"use client";

// Work section desk-object "trinket" — small 3D toy-physics decoration for
// the existing accessible disclosure cards on /work (see ProjectCard.tsx).
// Purely additive/decorative: hover wobble + drag-and-settle via spring
// motion. Never replaces or gates the real keyboard-operable,
// screen-reader-labeled disclosure trigger underneath (aria-hidden below).
//
// Shape choice: trinket-shapes.ts picks a legible metaphor per project
// (globe / gear / rocket / books / fallback crystal) from its name, stack,
// and description — see that file for the keyword logic.
//
// Physics: @react-spring/three (already a project dependency) drives the
// hover wobble and drag-flick-and-settle — see useTrinketSpring.ts. Drag
// itself is a small manual pointerdown/pointermove/pointerup implementation
// rather than @use-gesture/react: that package is present in node_modules
// only as a transitive dependency of drei/fiber, not a direct one, and the
// gesture this needs (clamp a 2D offset, spring back on release) is simple
// enough that adding a new direct dependency wasn't worth the risk of
// colliding with other Phase 1 streams editing package.json.
//
// Touch: a full drag on an object this small tends to fight page scroll, so
// touch pointerdown triggers the same wobble as hover instead of tracking a
// drag — see handlePointerDown below.
import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { a } from "@react-spring/three";
import { useReducedMotion } from "framer-motion";
import type { Project } from "./projects";
import { pickTrinketShape, type TrinketShape } from "./trinket-shapes";
import { useTrinketSpring } from "./useTrinketSpring";

export type TrinketProps = {
  project: Project;
  /** Pixel size of the (square) canvas — kept thumbnail/icon-sized. */
  size?: number;
};

// A small warm, coral-and-gold-leaning palette in the site's existing
// accent range (see globals.css --accent-primary/--accent-secondary),
// hardcoded rather than read from CSS custom properties so the trinket
// never depends on DOM/theme timing during mount.
const SHAPE_COLOR: Record<TrinketShape, string> = {
  globe: "#5b6b52",
  gear: "#8a7f6b",
  rocket: "#af482e",
  books: "#af482e",
  crystal: "#93a08a",
};

const BOOK_COLORS = ["#af482e", "#5b6b52", "#c9a962"];

// Drag is clamped to a small "nudge" radius in scene units, not a
// full-viewport throw — this is a fidgetable trinket, not a slider.
const DRAG_CLAMP = 0.6;
const DRAG_DIVISOR = 40; // px of pointer movement per scene unit

function GearMesh() {
  const teeth = 8;
  const positions = Array.from({ length: teeth }, (_, i) => {
    const angle = (i / teeth) * Math.PI * 2;
    return { x: Math.cos(angle) * 0.68, y: Math.sin(angle) * 0.68, angle };
  });
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.28, 12]} />
        <meshStandardMaterial color={SHAPE_COLOR.gear} flatShading roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
        <cylinderGeometry args={[0.18, 0.18, 0.32, 10]} />
        <meshStandardMaterial color="#201f1c" flatShading />
      </mesh>
      {positions.map(({ x, y, angle }, i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
          <boxGeometry args={[0.24, 0.18, 0.26]} />
          <meshStandardMaterial color={SHAPE_COLOR.gear} flatShading roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function RocketMesh() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.32, 0.55, 8]} />
        <meshStandardMaterial color={SHAPE_COLOR.rocket} flatShading roughness={0.4} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.3, 0.32, 0.75, 8]} />
        <meshStandardMaterial color="#f2f0ea" flatShading roughness={0.5} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.28, -0.42, Math.sin(angle) * 0.28]}
            rotation={[0, -angle, 0]}
          >
            <coneGeometry args={[0.14, 0.32, 3]} />
            <meshStandardMaterial color={SHAPE_COLOR.rocket} flatShading roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function BooksMesh() {
  return (
    <group rotation={[0.08, 0, 0]}>
      {BOOK_COLORS.map((color, i) => (
        <mesh
          key={color}
          position={[i % 2 === 0 ? 0.03 : -0.03, -0.32 + i * 0.24, 0]}
          rotation={[0, 0, i % 2 === 0 ? 0.05 : -0.06]}
        >
          <boxGeometry args={[1.05, 0.2, 0.68]} />
          <meshStandardMaterial color={color} flatShading roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function GlobeMesh() {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color={SHAPE_COLOR.globe} flatShading roughness={0.6} />
      </mesh>
      <mesh rotation={[0.3, 0, 0.15]}>
        <torusGeometry args={[0.95, 0.025, 6, 16]} />
        <meshStandardMaterial color="#f2f0ea" roughness={0.5} />
      </mesh>
    </group>
  );
}

function CrystalMesh() {
  return (
    <mesh scale={[0.85, 1.1, 0.85]}>
      <octahedronGeometry args={[0.85, 0]} />
      <meshStandardMaterial color={SHAPE_COLOR.crystal} flatShading roughness={0.25} metalness={0.1} />
    </mesh>
  );
}

function TrinketShapeMesh({ shape }: { shape: TrinketShape }) {
  switch (shape) {
    case "globe":
      return <GlobeMesh />;
    case "gear":
      return <GearMesh />;
    case "rocket":
      return <RocketMesh />;
    case "books":
      return <BooksMesh />;
    case "crystal":
    default:
      return <CrystalMesh />;
  }
}

export default function Trinket({ project, size = 64 }: TrinketProps) {
  const shape = pickTrinketShape(project);
  const reducedMotion = Boolean(useReducedMotion());
  const { rx, ry, rz, px, py, wobble, drag, settle } = useTrinketSpring(reducedMotion);

  const draggingRef = useRef(false);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion || event.pointerType === "touch") return;
      wobble();
    },
    [reducedMotion, wobble],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;

      // Touch: a full drag fights page scroll on a target this small — a
      // tap gets the same wobble as a mouse hover instead.
      if (event.pointerType === "touch") {
        wobble();
        return;
      }

      draggingRef.current = true;
      originRef.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [reducedMotion, wobble],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !originRef.current) return;
      const dx = (event.clientX - originRef.current.x) / DRAG_DIVISOR;
      const dy = (event.clientY - originRef.current.y) / DRAG_DIVISOR;
      const x = Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, dx));
      const y = Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, -dy));
      drag(x, y);
    },
    [drag],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      originRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      settle();
    },
    [settle],
  );

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (draggingRef.current) endDrag(event);
    },
    [endDrag],
  );

  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, touchAction: "manipulation" }}
      className="shrink-0 select-none"
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 3.2], fov: 35 }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <a.group rotation-x={rx} rotation-y={ry} rotation-z={rz} position-x={px} position-y={py}>
          <TrinketShapeMesh shape={shape} />
        </a.group>
      </Canvas>
    </div>
  );
}
