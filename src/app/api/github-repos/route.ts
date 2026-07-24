import { NextResponse } from 'next/server';

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
}

export async function GET() {
  try {
    const res = await fetch(
      'https://api.github.com/users/patelkirtan29/repos?sort=updated&per_page=30',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch repos from GitHub' },
        { status: res.status },
      );
    }

    const data = await res.json();

    const repos: GitHubRepo[] = (data as (GitHubRepo & { fork: boolean })[])
      .filter((repo) => !repo.fork)
      .map(({ name, description, language, html_url, stargazers_count, updated_at }) => ({
        name,
        description,
        language,
        html_url,
        stargazers_count,
        updated_at,
      }));

    return NextResponse.json(repos, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
