"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GitHubRepoSummary } from "@/lib/github";
import { openProjectModal } from "@/lib/projectModal";
import { STATUS_COLORS, STATUS_LABELS, colorForLanguage, statusForPushedAt } from "./colors";
import { formatRelativeTime } from "./formatRelativeTime";
import { useNow } from "./useNow";

interface ProjectGridProps {
  repos: GitHubRepoSummary[];
  activeLanguage: string | null;
  onClearFilter: () => void;
}

export default function ProjectGrid({ repos, activeLanguage, onClearFilter }: ProjectGridProps) {
  const now = useNow(30_000);
  const filtered = activeLanguage
    ? repos.filter((r) => (r.language ?? "Other") === activeLanguage)
    : repos;

  return (
    <div>
      {activeLanguage && (
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-[var(--accent-secondary)]">
          <span>
            Filtered by{" "}
            <span style={{ color: colorForLanguage(activeLanguage) }}>{activeLanguage}</span>
          </span>
          <button
            type="button"
            onClick={onClearFilter}
            className="rounded border border-[var(--muted)] px-2 py-0.5 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            clear ×
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-[var(--accent-secondary)]">
          No repos match this filter.
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence initial={false}>
            {filtered.map((repo) => (
              <ProjectCard key={repo.name} repo={repo} now={now} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function ProjectCard({ repo, now }: { repo: GitHubRepoSummary; now: number | null }) {
  const status = now !== null ? statusForPushedAt(repo.pushedAt, now) : "idle";
  const languageColor = colorForLanguage(repo.language);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 rounded-lg border border-[var(--muted)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent-primary)]"
    >
      {/*
        The card body is a real <button> (opens the flagship project detail
        modal in place, per BUILD_IDEAS_DECISIONS.md item 4) rather than the
        anchor this card used to be. The "View on GitHub ↗" link below is a
        sibling, not a descendant — an <a> can't validly nest inside a
        <button> — so the external-link affordance from the old card isn't
        lost for people who want to skip the modal.
      */}
      <button
        type="button"
        onClick={() => openProjectModal(repo.name)}
        aria-haspopup="dialog"
        className="flex flex-1 flex-col gap-3 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-base font-medium">{repo.name}</h3>
          <span
            className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wide"
            style={{ color: STATUS_COLORS[status] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            {STATUS_LABELS[status]}
          </span>
        </div>

        <p className="line-clamp-2 min-h-[2.5em] text-sm text-[var(--accent-secondary)]">
          {repo.description ?? "No description provided."}
        </p>

        <div className="mt-auto flex items-center justify-between font-mono text-[11px] text-[var(--accent-secondary)]">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: languageColor }}
            />
            {repo.language ?? "Other"}
          </span>
          <span>★ {repo.stargazersCount}</span>
          <span>{now !== null ? formatRelativeTime(repo.pushedAt, now) : "…"}</span>
        </div>
      </button>

      <a
        href={repo.htmlUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex w-fit items-center gap-1 self-start font-mono text-[11px] text-[var(--accent-secondary)] transition-colors hover:text-[var(--accent-primary)]"
      >
        View on GitHub ↗
      </a>
    </motion.div>
  );
}
