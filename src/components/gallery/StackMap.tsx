"use client";

import { useMemo, useState } from "react";
import type { GitHubRepoSummary } from "@/lib/github";
import { colorForLanguage } from "./colors";

interface StackMapProps {
  repos: GitHubRepoSummary[];
  activeLanguage: string | null;
  onSelectLanguage: (language: string | null) => void;
}

const MAX_NODES = 12;

interface Lane {
  language: string;
  color: string;
  repos: GitHubRepoSummary[];
}

/**
 * Flat, non-orbital tech-stack diagram: one thin mono-labeled line ("lane")
 * per language, connecting the repos written in it. Static by default;
 * hovering a lane brightens its line. Deliberately not a 3D/orbital
 * instrument — it's a diagram + filter control, not a nav device (keeps it
 * visually distinct from the Lobby Console).
 *
 * Clicking a lane label or a node filters the project grid below by that
 * language (toggle off by clicking the active one again).
 */
export default function StackMap({ repos, activeLanguage, onSelectLanguage }: StackMapProps) {
  const [hoveredLane, setHoveredLane] = useState<string | null>(null);

  const lanes = useMemo<Lane[]>(() => {
    const capped = repos.slice(0, MAX_NODES);
    const grouped = new Map<string, GitHubRepoSummary[]>();
    for (const repo of capped) {
      const key = repo.language ?? "Other";
      const bucket = grouped.get(key);
      if (bucket) bucket.push(repo);
      else grouped.set(key, [repo]);
    }
    return [...grouped.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([language, laneRepos]) => ({
        language,
        color: colorForLanguage(language),
        repos: laneRepos,
      }));
  }, [repos]);

  if (lanes.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--muted)] p-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-[var(--accent-secondary)]">
        Stack map — click a lane to filter
      </p>
      <div>
        {lanes.map((lane) => {
          const isDimmed =
            (activeLanguage !== null && activeLanguage !== lane.language) ||
            (hoveredLane !== null && hoveredLane !== lane.language);
          const isActive = activeLanguage === lane.language;

          return (
            <div key={lane.language} className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                onClick={() => onSelectLanguage(isActive ? null : lane.language)}
                onMouseEnter={() => setHoveredLane(lane.language)}
                onMouseLeave={() => setHoveredLane(null)}
                className="w-28 shrink-0 truncate text-left font-mono text-[11px] uppercase tracking-wide transition-opacity"
                style={{ color: lane.color, opacity: isDimmed ? 0.45 : 1 }}
                aria-pressed={isActive}
              >
                {lane.language}
                <span className="ml-1 text-[var(--accent-secondary)]">({lane.repos.length})</span>
              </button>

              <div
                className="relative h-px flex-1 transition-opacity"
                style={{ backgroundColor: lane.color, opacity: isDimmed ? 0.25 : 0.8 }}
              >
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  {lane.repos.map((repo) => (
                    <button
                      key={repo.name}
                      type="button"
                      onClick={() => onSelectLanguage(isActive ? null : lane.language)}
                      onMouseEnter={() => setHoveredLane(lane.language)}
                      onMouseLeave={() => setHoveredLane(null)}
                      className="group relative flex -translate-y-1/2 flex-col items-center focus:outline-none"
                      title={repo.name}
                    >
                      <span
                        className="block h-2.5 w-2.5 rounded-full border-2 bg-[var(--background)] transition-transform group-hover:scale-125 group-focus-visible:scale-125"
                        style={{ borderColor: lane.color }}
                      />
                      <span className="pointer-events-none absolute top-4 z-10 whitespace-nowrap rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        {repo.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
