"use client";

import { useMemo } from "react";
import type { GitHubRepoSummary } from "@/lib/github";
import {
  MAGNITUDE_HIGHLIGHT,
  MAGNITUDE_RAMP,
  STATUS_COLORS,
  STATUS_LABELS,
  colorForLanguage,
  statusForPushedAt,
} from "./colors";
import { formatRelativeTime } from "./formatRelativeTime";
import { useNow } from "./useNow";

interface CommandCenterProps {
  repos: GitHubRepoSummary[];
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: number | null;
  onRefresh: () => void;
}

const RECENT_WINDOW_DAYS = 30;

export default function CommandCenter({
  repos,
  isLoading,
  error,
  lastSyncedAt,
  onRefresh,
}: CommandCenterProps) {
  // Ticks purely to keep "Xm ago"-style labels honest. This does not
  // re-fetch data — no auto-polling ticker, per the creative direction's
  // arbitrated call — it only re-renders elapsed-time strings. `null` until
  // mount (see useNow), so the first render never computes off a stale clock.
  const now = useNow(30_000);

  const commitVelocity = useMemo(() => {
    if (now === null) return 0;
    const cutoff = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return repos.filter((r) => now - Date.parse(r.pushedAt) <= cutoff).length;
  }, [repos, now]);

  const languageMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of repos) {
      const key = r.language ?? "Other";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const total = repos.length || 1;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([language, count]) => ({
        language,
        count,
        pct: Math.round((count / total) * 100),
      }));
  }, [repos]);

  const mostRecent = repos[0] ?? null;
  const buildingStatus =
    mostRecent && now !== null ? statusForPushedAt(mostRecent.pushedAt, now) : "idle";

  const recencyCells = useMemo(() => {
    const cells = [...repos.slice(0, 5)].reverse(); // oldest -> newest, left to right
    const offset = MAGNITUDE_RAMP.length - cells.length;
    return cells.map((repo, i) => ({
      repo,
      color: i === cells.length - 1 ? MAGNITUDE_HIGHLIGHT : MAGNITUDE_RAMP[offset + i],
    }));
  }, [repos]);

  const lastSyncedLabel =
    lastSyncedAt !== null && now !== null
      ? formatRelativeTime(new Date(lastSyncedAt).toISOString(), now)
      : null;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--muted)] bg-[var(--muted)] sm:grid-cols-2 lg:grid-cols-4">
      {/* Commit velocity */}
      <StatTile label="Commit velocity">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl tabular-nums">{commitVelocity}</span>
          <span className="font-mono text-xs text-[var(--accent-secondary)]">
            pushes / {RECENT_WINDOW_DAYS}d
          </span>
        </div>
        <div className="mt-3 flex gap-1">
          {recencyCells.length === 0 ? (
            <span className="font-mono text-[10px] text-[var(--accent-secondary)]">
              no data yet
            </span>
          ) : (
            recencyCells.map(({ repo, color }) => (
              <span
                key={repo.name}
                title={`${repo.name} — pushed ${now !== null ? formatRelativeTime(repo.pushedAt, now) : "…"}`}
                className="h-3 flex-1 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ))
          )}
        </div>
      </StatTile>

      {/* Language mix */}
      <StatTile label="Language mix">
        <div className="flex h-3 w-full overflow-hidden rounded-[2px]">
          {languageMix.length === 0 ? (
            <span className="h-3 w-full bg-[var(--surface)]" />
          ) : (
            languageMix.map(({ language, pct }) => (
              <span
                key={language}
                style={{ width: `${pct}%`, backgroundColor: colorForLanguage(language) }}
                title={`${language} — ${pct}%`}
              />
            ))
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {languageMix.map(({ language, pct }) => (
            <li
              key={language}
              className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--accent-secondary)]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colorForLanguage(language) }}
              />
              {language} {pct}%
            </li>
          ))}
        </ul>
      </StatTile>

      {/* Currently building */}
      <StatTile label="Currently building">
        {mostRecent ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className={buildingStatus === "building" ? "animate-pulse" : ""}
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor: STATUS_COLORS[buildingStatus],
                }}
              />
              <span className="font-mono text-xs uppercase tracking-wide text-[var(--accent-secondary)]">
                {STATUS_LABELS[buildingStatus]}
              </span>
            </div>
            <a
              href={mostRecent.htmlUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 block truncate font-mono text-lg hover:text-[var(--accent-primary)]"
            >
              {mostRecent.name}
            </a>
          </>
        ) : (
          <span className="font-mono text-sm text-[var(--accent-secondary)]">—</span>
        )}
      </StatTile>

      {/* Last synced */}
      <StatTile label="Last synced">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg tabular-nums">
            {error ? "sync failed" : lastSyncedLabel ?? (isLoading ? "syncing…" : "—")}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh GitHub data"
            className="rounded border border-[var(--muted)] px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-[var(--accent-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
          >
            {isLoading ? "…" : "↻ refresh"}
          </button>
        </div>
        {error && (
          <p className="mt-2 font-mono text-[11px] text-[var(--accent-primary)]">{error}</p>
        )}
      </StatTile>
    </div>
  );
}

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-[var(--background)] p-4">
      <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--accent-secondary)]">
        {label}
      </span>
      {children}
    </div>
  );
}
