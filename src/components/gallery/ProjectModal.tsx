"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { GitHubRepoSummary } from "@/lib/github";
import { STATUS_COLORS, STATUS_LABELS, colorForLanguage, statusForPushedAt } from "./colors";
import { formatRelativeTime } from "./formatRelativeTime";
import { useNow } from "./useNow";

// Shared easing curve — same cubic-bezier used across the site's chrome
// (Cursor.tsx / CommandPalette.tsx / SplitText / DigitFlip).
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface ProjectModalProps {
  repo: GitHubRepoSummary;
  onClose: () => void;
}

/**
 * Flagship project detail modal — expands a `ProjectGrid` card in place via
 * `?project=slug` shallow routing (see `@/lib/projectModal`), rather than a
 * dedicated page, per FINAL_CREATIVE_DIRECTION.md section 2 /
 * BUILD_IDEAS_DECISIONS.md item 4.
 *
 * Rendered from `GalleryClient.tsx` only once the open `?project=` slug
 * resolves to a repo already present in the room's single shared GitHub
 * fetch, so this component never needs (or triggers) a data fetch of its
 * own — opening/closing stays purely client-side.
 *
 * No focus-trap dependency is installed in this project, so the trap,
 * Escape-to-close, and restore-focus-on-close behavior below are hand
 * rolled (small enough to not warrant a new dependency).
 *
 * z-index: `z-[9990]` — above room content and the Gallery `CoordinateHUD`,
 * but intentionally *below* `CommandPalette`'s `z-[9998]` so ⌘K always
 * overlays correctly even while a project modal is open (see
 * CommandPalette.tsx's docblock). The Console is never a stacking concern
 * here — it only ever mounts inside the Lobby room, and this modal only
 * ever opens from the Gallery room, so the two can never be on screen at
 * the same time.
 */
export default function ProjectModal({ repo, onClose }: ProjectModalProps) {
  const now = useNow(30_000);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Capture the triggering element and move focus into the dialog on open;
  // restore focus back to the trigger (the project card) on close/unmount.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialog)?.focus();

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Escape-to-close + manual focus trap (Tab/Shift+Tab wraps within the dialog).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const status = now !== null ? statusForPushedAt(repo.pushedAt, now) : "idle";
  const languageColor = colorForLanguage(repo.language);

  return (
    <motion.div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: EASE }}
    >
      <motion.div
        className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="relative flex w-full max-w-lg flex-col gap-4 rounded-lg border border-[var(--muted)] bg-[var(--surface)] p-6 shadow-2xl outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project details"
          className="absolute right-4 top-4 font-mono text-[11px] uppercase tracking-wide text-[var(--accent-secondary)] hover:text-[var(--accent-primary)]"
        >
          Esc ×
        </button>

        <div className="flex items-start justify-between gap-2 pr-10">
          <h3 id="project-modal-title" className="truncate font-display text-2xl font-medium">
            {repo.name}
          </h3>
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

        <p className="text-sm text-[var(--accent-secondary)]">
          {repo.description ?? "No description provided."}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-[var(--accent-secondary)]">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: languageColor }}
            />
            {repo.language ?? "Other"}
          </span>
          <span>★ {repo.stargazersCount}</span>
          <span>Updated {now !== null ? formatRelativeTime(repo.updatedAt, now) : "…"}</span>
        </div>

        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex w-fit items-center gap-1.5 rounded border border-[var(--muted)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-[var(--foreground)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          View on GitHub ↗
        </a>
      </motion.div>
    </motion.div>
  );
}
