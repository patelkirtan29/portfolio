import { NextResponse } from 'next/server';
import { getGitHubRepos } from '@/lib/github';

export async function GET() {
  try {
    const repos = await getGitHubRepos();

    return NextResponse.json(repos, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
