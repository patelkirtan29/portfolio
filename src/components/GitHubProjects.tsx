import type { GitHubRepo } from '@/app/api/github-repos/route';

const LANGUAGE_STYLES: Record<string, string> = {
  Python: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  JavaScript: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  TypeScript: 'bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  Java: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Jupyter Notebook': 'bg-orange-200 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
};

const DEFAULT_LANG_STYLE = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';

async function fetchRepos(): Promise<GitHubRepo[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/github-repos`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function GitHubProjects() {
  const repos = await fetchRepos();

  if (repos.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Could not load repositories. Visit{' '}
        <a
          href="https://github.com/patelkirtan29"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          GitHub
        </a>{' '}
        directly.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {repos.map((repo) => {
        const displayName = repo.name.replace(/_/g, ' ');
        const langStyle = repo.language
          ? (LANGUAGE_STYLES[repo.language] ?? DEFAULT_LANG_STYLE)
          : DEFAULT_LANG_STYLE;

        return (
          <a
            key={repo.name}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
          >
            <h3 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-white">
              {displayName}
            </h3>
            <p className="flex-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {repo.description ?? 'No description available.'}
            </p>
            <div className="flex items-center justify-between">
              {repo.language && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${langStyle}`}>
                  {repo.language}
                </span>
              )}
              {repo.stargazers_count > 0 && (
                <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {repo.stargazers_count}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors">
              View on GitHub →
            </span>
          </a>
        );
      })}
    </div>
  );
}
