// GitHub data layer for the Gallery room's Command Center + project grid.
//
// NOTE (ship blocker, flagged per FINAL_CREATIVE_DIRECTION.md section 5):
// - GITHUB_USERNAME is a placeholder ("octocat"). Swap for the real GitHub
//   username before ship.
// - Unauthenticated GitHub REST is rate-limited to 60 req/hr. Add a
//   server-side `GITHUB_TOKEN` env var before ship to raise that ceiling.
//   The code below already reads it if present, so no code change will be
//   needed later, just the env var + real username.

/** Placeholder username — swap for the real GitHub handle before ship. */
export const GITHUB_USERNAME_PLACEHOLDER = "patelkirtan29";

const GITHUB_API_BASE = "https://api.github.com";

/** Normalized repo shape the Gallery room components consume. */
export interface GitHubRepoSummary {
  name: string;
  description: string | null;
  language: string | null;
  htmlUrl: string;
  stargazersCount: number;
  updatedAt: string;
  pushedAt: string;
}

/** Shape of a single entry returned by GitHub's `/users/:username/repos`. */
interface RawGitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
}

export class GitHubFetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubFetchError";
  }
}

/**
 * Fetch a user's public, non-fork, non-archived repos from the GitHub REST
 * API, sorted by most-recently-pushed first.
 *
 * Cached server-side via Next's fetch `revalidate` (1hr) since unauthenticated
 * GitHub REST is rate-limited to 60 req/hr — see module notes above.
 */
export async function fetchGitHubRepos(
  username: string = GITHUB_USERNAME_PLACEHOLDER,
): Promise<GitHubRepoSummary[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Optional — raises the 60 req/hr unauthenticated ceiling once set before ship.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`,
    {
      headers,
      // Fetch once per page load, cached for an hour — no auto-polling ticker
      // per the creative direction's arbitrated call.
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) {
    throw new GitHubFetchError(
      `GitHub API request failed (${res.status} ${res.statusText})`,
      res.status,
    );
  }

  const data = (await res.json()) as RawGitHubRepo[];

  return data
    .filter((repo) => !repo.fork && !repo.archived)
    .map(
      (repo): GitHubRepoSummary => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        htmlUrl: repo.html_url,
        stargazersCount: repo.stargazers_count,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
      }),
    )
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt));
}
