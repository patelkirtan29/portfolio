"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GitHubRepoSummary } from "@/lib/github";
import type { GitHubReposResponse } from "@/app/api/github-repos/route";

interface GitHubReposState {
  repos: GitHubRepoSummary[];
  isLoading: boolean;
  error: string | null;
  /** epoch ms of the last successful client-side fetch completion. */
  lastSyncedAt: number | null;
  username: string | null;
}

/**
 * Shared data-fetch hook for the Gallery room (Command Center + project grid
 * both read from it). Fetches once on mount — no auto-polling ticker, per the
 * creative direction's arbitrated call — and exposes `refresh` for the
 * Command Center's manual refresh affordance.
 */
export function useGitHubRepos() {
  const [state, setState] = useState<GitHubReposState>({
    repos: [],
    isLoading: true,
    error: null,
    lastSyncedAt: null,
    username: null,
  });
  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/github-repos", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : `Request failed (${res.status})`,
        );
      }
      const data = body as GitHubReposResponse;
      setState({
        repos: data.repos,
        isLoading: false,
        error: null,
        lastSyncedAt: Date.now(),
        username: data.username,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load repos",
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
