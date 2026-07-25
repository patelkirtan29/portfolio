"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import CommandCenter from "./CommandCenter";
import StackMap from "./StackMap";
import ProjectGrid from "./ProjectGrid";
import ProjectModal from "./ProjectModal";
import CoordinateHUD from "./CoordinateHUD";
import { useGitHubRepos } from "./useGitHubRepos";
import { closeProjectModal, useOpenProjectSlug } from "@/lib/projectModal";

/**
 * Client-side orchestrator for the Gallery room: owns the single shared
 * GitHub data fetch (via useGitHubRepos) and the active-language filter
 * state shared between the Stack Map and the project grid below it.
 *
 * Also owns the flagship project detail modal: resolves the shallow-routed
 * `?project=slug` (see `@/lib/projectModal`) against the room's already-
 * fetched repo list and renders `ProjectModal` for the match. Living here
 * (rather than in `ProjectGrid.tsx`) means the modal never needs its own
 * data fetch, and it's why the "open project modals" half of the
 * coordinate HUD's scoping in FINAL_CREATIVE_DIRECTION.md section 4 is
 * moot in practice — a modal only ever exists while still scrolled to
 * this room, so `useCurrentRoom() === "gallery"` already covers it.
 */
export default function GalleryClient() {
  const { repos, isLoading, error, lastSyncedAt, refresh } = useGitHubRepos();
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  const openSlug = useOpenProjectSlug();
  const openRepo = openSlug ? (repos.find((r) => r.name === openSlug) ?? null) : null;

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 px-6 py-24">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--accent-secondary)]">
          Room 02 — Gallery
        </span>
        <h2 className="font-display text-3xl font-medium sm:text-4xl">Command Center</h2>
      </header>

      <CommandCenter
        repos={repos}
        isLoading={isLoading}
        error={error}
        lastSyncedAt={lastSyncedAt}
        onRefresh={refresh}
      />

      <StackMap
        repos={repos}
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
      />

      <ProjectGrid
        repos={repos}
        activeLanguage={activeLanguage}
        onClearFilter={() => setActiveLanguage(null)}
      />

      <CoordinateHUD />

      <AnimatePresence>
        {openRepo ? (
          <ProjectModal key={openRepo.name} repo={openRepo} onClose={closeProjectModal} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
