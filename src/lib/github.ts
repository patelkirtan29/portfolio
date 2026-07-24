export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
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

  if (!res.ok) return [];

  const data = await res.json();

  return (data as (GitHubRepo & { fork: boolean })[])
    .filter((repo) => !repo.fork)
    .map(({ name, description, language, html_url, stargazers_count, updated_at }) => ({
      name,
      description,
      language,
      html_url,
      stargazers_count,
      updated_at,
    }));
}
