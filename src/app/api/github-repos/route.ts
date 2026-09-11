import { NextResponse } from "next/server";
import { fetchGitHubRepos, GitHubFetchError, GITHUB_USERNAME } from "@/lib/github";

export interface GitHubReposResponse {
  repos: Awaited<ReturnType<typeof fetchGitHubRepos>>;
  fetchedAt: string;
  username: string;
}

// GET /api/github-repos
//
// Thin server route in front of `fetchGitHubRepos` so a client component
// can trigger a fresh fetch on demand (a manual "refresh" affordance),
// without re-fetching on every render. The Work page's initial server
// render fetches directly via `fetchGitHubRepos` instead of round-tripping
// through this route. The underlying GitHub request itself is cached for
// 1hr via `next: { revalidate }` in src/lib/github.ts.
export async function GET() {
  try {
    const repos = await fetchGitHubRepos(GITHUB_USERNAME);
    const body: GitHubReposResponse = {
      repos,
      fetchedAt: new Date().toISOString(),
      username: GITHUB_USERNAME,
    };
    return NextResponse.json(body);
  } catch (error) {
    const status = error instanceof GitHubFetchError ? (error.status ?? 502) : 502;
    const message = error instanceof Error ? error.message : "Unknown GitHub fetch error";
    return NextResponse.json({ error: message }, { status });
  }
}
