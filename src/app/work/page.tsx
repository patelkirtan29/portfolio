import type { Metadata } from "next";
import ProjectCard from "@/components/work/ProjectCard";
import { buildProjects } from "@/components/work/projects";
import { fetchGitHubRepos, GitHubFetchError } from "@/lib/github";

export const metadata: Metadata = {
  title: "Work",
};

// Server component — fetches real repo data directly via `fetchGitHubRepos`
// on render (no need to round-trip through /api/github-repos for the
// initial page load; that route exists for a client-triggered refresh).
// The underlying request is cached for 1hr, so this isn't hit on every
// request. Fetch failures (rate limit, network) are caught here so a
// GitHub outage degrades to a fallback message instead of crashing the page.
export default async function WorkPage() {
  let fetchError: string | null = null;
  let projects: ReturnType<typeof buildProjects> = [];

  try {
    const repos = await fetchGitHubRepos();
    projects = buildProjects(repos);
  } catch (error) {
    fetchError =
      error instanceof GitHubFetchError
        ? error.message
        : "Something went wrong loading live project data.";
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-6">
      <header className="mb-4">
        <p className="font-mono text-sm text-accent-primary">01 — Work</p>
        <h1 className="font-display text-3xl text-foreground">Work</h1>
        <p className="mt-2 max-w-2xl text-foreground/70">
          A working set of projects, pulled live from GitHub — expand any
          card for more, or open the full case study. A couple of projects
          get the full story behind them; the rest are shown as-is from
          GitHub.
        </p>
      </header>

      {fetchError ? (
        <div
          role="alert"
          className="rounded-lg border border-foreground/10 bg-surface p-4 text-foreground/80"
        >
          <p>
            Live project data isn&apos;t available right now ({fetchError}).
            This is usually a temporary GitHub rate limit — in the meantime,
            you can browse the repos directly on{" "}
            <a
              href="https://github.com/patelkirtan29"
              className="text-accent-secondary underline underline-offset-4 hover:text-accent-primary"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      ) : projects.length === 0 ? (
        <p className="text-foreground/70">No public repos found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </main>
  );
}
