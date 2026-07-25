"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project } from "./projects";
import Trinket from "./Trinket";

type ProjectCardProps = {
  project: Project;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Work grid disclosure card — CREATIVE_DIRECTION_V2.md section 5A.
// A real <button aria-expanded> disclosure (not a hover-triggered 3D flip)
// so it behaves identically for mouse, keyboard, and touch.
//
// Two content modes, driven by `project.kind`:
// - "flagship": a curated case study. Technical face (stack + one-line
//   problem) is always visible; the human-story face (why it mattered)
//   reveals on expand. Full content also lives at /work/[slug].
// - "live": plain GitHub data with no fabricated narrative. The
//   description (or a fallback) and stack chip are always visible;
//   expanding just surfaces stats (stars, last updated) plus a real
//   "View on GitHub" link — there's no "why it mattered" story to tell.
export default function ProjectCard({ project }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const detailsId = useId();
  const isFlagship = project.kind === "flagship";

  const subtitle = isFlagship
    ? project.oneLiner
    : (project.description ?? "No description yet — see the repo for details.");

  const chips = isFlagship ? project.stack : project.language ? [project.language] : [];

  return (
    <motion.div layout className="rounded-lg border border-foreground/10 bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-foreground">{project.name}</h3>
        {/* Decorative-only 3D toy trinket — see Trinket.tsx. Purely additive
            next to the title; the accessible disclosure button below is the
            real, unchanged interactive trigger. */}
        <Trinket project={project} size={56} />
      </div>

      <p className="mt-1 font-mono text-sm text-accent-secondary">{subtitle}</p>

      {chips.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {chips.map((tech) => (
            <li
              key={tech}
              className="rounded border border-foreground/20 px-1 py-0.5 font-mono text-xs text-foreground/70"
            >
              {tech}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1 rounded font-mono text-sm text-accent-primary underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
      >
        {isFlagship
          ? expanded
            ? "Hide why it mattered"
            : "Why it mattered"
          : expanded
            ? "Hide details"
            : "More details"}
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>

      {shouldReduceMotion ? (
        expanded && (
          <div id={detailsId} className="mt-3 border-t border-foreground/10 pt-3">
            <ProjectCardDetails project={project} />
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
                <ProjectCardDetails project={project} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href={`/work/${project.slug}`}
          className="font-mono text-xs text-accent-secondary hover:text-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
        >
          {isFlagship ? "Read the full case study →" : "Full details →"}
        </Link>
        {!isFlagship && (
          <a
            href={project.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent-secondary hover:text-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
          >
            View on GitHub →
          </a>
        )}
      </div>
    </motion.div>
  );
}

function ProjectCardDetails({ project }: { project: Project }) {
  if (project.kind === "flagship") {
    return <p className="text-sm text-foreground/80">{project.humanStory}</p>;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-foreground/70">
      <dt>Stars</dt>
      <dd>{project.stargazersCount}</dd>
      <dt>Last updated</dt>
      <dd>{formatDate(project.pushedAt)}</dd>
    </dl>
  );
}
