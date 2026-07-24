"use client";

/**
 * Lobby — the hero room. Hosts the Console (the site's orbital 3D nav
 * instrument) on fine-pointer devices, and a plain static link row
 * everywhere else (coarse pointer / touch, or while the Console's chunk is
 * still loading).
 *
 * The Console component is dynamically imported (`ssr: false`) so its
 * Three.js dependency never ships in the initial bundle or blocks first
 * content paint — see Console.tsx's own file header for the rest of the
 * component's design notes and the `@/lib/scroll` integration assumption.
 */

import { Suspense, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import SplitText from "@/components/SplitText";

const Console = dynamic(() => import("@/components/Console"), {
  ssr: false,
});

// Intentionally duplicated (not imported) from Console.tsx's `CONSOLE_NODES`:
// this is just the id/label/href a plain <a> nav needs, with zero Three.js
// dependency. Importing it from Console.tsx would statically pull that
// module's `three` import graph into this file's chunk and defeat the
// dynamic import above. Keep in sync with `CONSOLE_NODES` in Console.tsx if
// room ids/labels ever change.
const ROOM_LINKS = [
  { id: "lobby", label: "Home", href: "#lobby" },
  { id: "practice", label: "About", href: "#practice" },
  { id: "gallery", label: "Projects", href: "#gallery" },
  { id: "signal", label: "Contact", href: "#signal" },
] as const;

function StaticRoomNav() {
  return (
    <nav
      aria-label="Room navigation"
      className="flex flex-wrap items-center justify-center gap-4 font-display text-lg tracking-tight sm:gap-6"
    >
      {ROOM_LINKS.map((room) => (
        <a
          key={room.id}
          href={room.href}
          className="rounded-full border border-muted px-5 py-2 text-foreground transition-colors hover:border-accent-primary hover:text-accent-primary focus-visible:border-accent-primary focus-visible:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
        >
          {room.label}
        </a>
      ))}
    </nav>
  );
}

function subscribePointer(callback: () => void): () => void {
  const fineQuery = window.matchMedia("(pointer: fine)");
  fineQuery.addEventListener("change", callback);
  return () => fineQuery.removeEventListener("change", callback);
}
function getCoarsePointerSnapshot(): boolean {
  return !window.matchMedia("(pointer: fine)").matches;
}
function getCoarsePointerServerSnapshot(): boolean {
  return false;
}

/** Mobile gate: the 3D Console never mounts on coarse-pointer devices.
 *  `useSyncExternalStore` returns the SSR-safe `false` default on the server
 *  and first client render (no hydration mismatch), then resolves to the
 *  real media-query value right after mount — without ever calling
 *  `setState` synchronously inside an effect body. */
function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribePointer, getCoarsePointerSnapshot, getCoarsePointerServerSnapshot);
}

export default function Lobby() {
  const isCoarsePointer = useCoarsePointer();

  return (
    <section
      id="lobby"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background"
    >
      <span className="sr-only">
        Lobby — the site&apos;s hero room. Use the room navigation to jump to About, Projects, or Contact.
      </span>

      {/* INTEGRATION NOTE: no stream owned hero copy for this room — the
          creative direction treats the orbital Console itself as the hero,
          with no headline text specified. Added a minimal kicker + H1 here
          purely so SplitText (Stream 5) has real heading content to wrap,
          per Batch 2's cross-stream wiring step. Placeholder copy — swap
          for real name/tagline before ship. Kept small and top-anchored,
          `pointer-events-none`, so it never competes with the Console's
          orbiting node hit-targets for space or clicks. */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col items-center gap-2 px-6 text-center sm:top-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-secondary">
          kirtan.dev
        </p>
        <h1 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
          <SplitText>Full-stack developer, mission-console builder.</SplitText>
        </h1>
      </div>

      {isCoarsePointer ? (
        <StaticRoomNav />
      ) : (
        <Suspense fallback={<StaticRoomNav />}>
          <Console />
        </Suspense>
      )}
    </section>
  );
}
