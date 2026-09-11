"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DiffLine, ProjectDiff } from "./projects";

type DiffRevealProps = {
  diff: ProjectDiff;
};

// Flagship before/after diff reveal — CREATIVE_DIRECTION_V2.md section 5B.
// A real button-based toggle (not just a drag handle) switches between
// "before" and "after". Additions/removals are never color-only: every
// colored line is paired with an explicit +/- glyph so the diff still
// reads correctly for colorblind visitors or with color stripped out.
function DiffLineRow({ line }: { line: DiffLine }) {
  const glyph = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
  const colorClass =
    line.type === "add"
      ? "text-accent-secondary"
      : line.type === "remove"
        ? "text-accent-primary"
        : "text-foreground/60";

  return (
    <div className={`whitespace-pre font-mono text-sm ${colorClass}`}>
      <span aria-hidden="true">{glyph} </span>
      <span className="sr-only">
        {line.type === "add" ? "Added: " : line.type === "remove" ? "Removed: " : ""}
      </span>
      {line.text}
    </div>
  );
}

export default function DiffReveal({ diff }: DiffRevealProps) {
  const [view, setView] = useState<"before" | "after">("before");
  const shouldReduceMotion = useReducedMotion();
  const lines = view === "before" ? diff.before : diff.after;

  const panel = (
    <div className="overflow-x-auto rounded bg-background p-3">
      {lines.map((line, i) => (
        <DiffLineRow key={i} line={line} />
      ))}
    </div>
  );

  return (
    <div className="mt-2 rounded-lg border border-foreground/10 bg-surface p-3">
      <p className="text-sm text-foreground/80">{diff.caption}</p>

      <div className="mt-3 flex gap-1" role="group" aria-label="Toggle before/after view">
        <button
          type="button"
          aria-pressed={view === "before"}
          onClick={() => setView("before")}
          className={`rounded px-2 py-1 font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary ${
            view === "before"
              ? "bg-accent-primary text-background"
              : "border border-foreground/20 text-foreground/70"
          }`}
        >
          Before
        </button>
        <button
          type="button"
          aria-pressed={view === "after"}
          onClick={() => setView("after")}
          className={`rounded px-2 py-1 font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary ${
            view === "after"
              ? "bg-accent-primary text-background"
              : "border border-foreground/20 text-foreground/70"
          }`}
        >
          After
        </button>
      </div>

      {shouldReduceMotion ? (
        <div className="mt-3">{panel}</div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mt-3"
          >
            {panel}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
