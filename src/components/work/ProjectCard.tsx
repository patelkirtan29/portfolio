"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project } from "./projects";

type ProjectCardProps = {
  project: Project;
};

// Work grid disclosure card — CREATIVE_DIRECTION_V2.md section 5A.
// A real <button aria-expanded> disclosure (not a hover-triggered 3D flip)
// so it behaves identically for mouse, keyboard, and touch. The technical
// face (stack + one-line problem) is always visible; the human-story face
// (why it mattered / what was learned) reveals on expand. The card is a
// teaser only — full content always also lives at the crawlable
// /work/[slug] page linked below.
export default function ProjectCard({ project }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const detailsId = useId();

  return (
    <motion.div
      layout
      className="rounded-lg border border-foreground/10 bg-surface p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-foreground">{project.name}</h3>
      </div>

      <p className="mt-1 font-mono text-sm text-accent-secondary">
        {project.oneLiner}
      </p>

      <ul className="mt-2 flex flex-wrap gap-1">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded border border-foreground/20 px-1 py-0.5 font-mono text-xs text-foreground/70"
          >
            {tech}
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1 rounded font-mono text-sm text-accent-primary underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
      >
        {expanded ? "Hide why it mattered" : "Why it mattered"}
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>

      {shouldReduceMotion ? (
        expanded && (
          <div id={detailsId} className="mt-3 border-t border-foreground/10 pt-3">
            <p className="text-sm text-foreground/80">{project.humanStory}</p>
          </div>
        )
      ) : (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={detailsId}
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-foreground/10 pt-3">
                <p className="text-sm text-foreground/80">{project.humanStory}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <Link
        href={`/work/${project.slug}`}
        className="mt-3 inline-block font-mono text-xs text-accent-secondary hover:text-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
      >
        Read the full case study &rarr;
      </Link>
    </motion.div>
  );
}
