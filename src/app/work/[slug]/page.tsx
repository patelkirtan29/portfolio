import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiffReveal from "@/components/work/DiffReveal";
import { buildProjects, type Project } from "@/components/work/projects";
import { fetchGitHubRepos, GitHubFetchError } from "@/lib/github";

type WorkSlugPageProps = {
  params: Promise<{ slug: string }>;
};

// Real, crawlable per-project route — the source of truth for case-study
// content per CREATIVE_DIRECTION_V2.md section 5A (fixes the SEO/crawler
// risk of gating content behind the /work grid's client-side disclosure).
//
// Data is live (fetched from GitHub, revalidated hourly) rather than a
// static local list, so this page is rendered dynamically per request
// instead of via generateStaticParams — the repo list itself can change
// without a rebuild. A repo without a flagship override still gets a real
// detail page here, built entirely from live GitHub data.
async function loadProject(slug: string): Promise<{ project: Project | null; error: string | null }> {
  try {
    const repos = await fetchGitHubRepos();
    const projects = buildProjects(repos);
    return { project: projects.find((p) => p.slug === slug) ?? null, error: null };
  } catch (error) {
    const message =
      error instanceof GitHubFetchError ? error.message : "Something went wrong loading live project data.";
    return { project: null, error: message };
  }
}

export async function generateMetadata({ params }: WorkSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await loadProject(slug);
  return {
    title: project ? project.name : "Project not found",
  };
}

export default async function WorkSlugPage({ params }: WorkSlugPageProps) {
  const { slug } = await params;
  const { project, error } = await loadProject(slug);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-6">
        <Link
          href="/work"
          className="font-mono text-sm text-accent-secondary hover:text-accent-primary"
        >
          &larr; Work
        </Link>
        <div
          role="alert"
          className="mt-4 rounded-lg border border-foreground/10 bg-surface p-4 text-foreground/80"
        >
          <p>
            Live project data isn&apos;t available right now ({error}). Try
            again shortly, or view this repo directly on{" "}
            <a
              href="https://github.com/patelkirtan29"
              className="text-accent-secondary underline underline-offset-4 hover:text-accent-primary"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  if (!project) {
    notFound();
  }

  const isFlagship = project.kind === "flagship";

  return (
    <main className="mx-auto max-w-3xl px-3 py-6">
      <Link
        href="/work"
        className="font-mono text-sm text-accent-secondary hover:text-accent-primary"
      >
        &larr; Work
      </Link>

      {!isFlagship && (
        <p className="mt-4 font-mono text-xs text-accent-secondary">
          Live data from GitHub — no curated case study for this project yet.
        </p>
      )}
      <h1 className="mt-1 font-display text-3xl text-foreground">{project.name}</h1>

      {isFlagship ? (
        <>
          {/*
            Human outcome before technical detail — a real design rule from
            CREATIVE_DIRECTION_V2.md section 7: every technical fact leads
            with why it mattered to a person, not the mechanism.
          */}
          <p className="mt-4 text-lg text-foreground">{project.humanOutcome}</p>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground">Problem</h2>
            <p className="mt-1 font-mono text-sm text-accent-secondary">{project.oneLiner}</p>
          </section>

          <section className="mt-4">
            <h2 className="sr-only">Stack</h2>
            <ul className="flex flex-wrap gap-1">
              {project.stack.map((tech) => (
                <li
                  key={tech}
                  className="rounded border border-foreground/20 px-1 py-0.5 font-mono text-xs text-foreground/70"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground">Approach</h2>
            <p className="mt-1 text-foreground/80">{project.approach}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground">Outcome</h2>
            <p className="mt-1 text-foreground/80">{project.outcome}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground">Why it mattered</h2>
            <p className="mt-1 text-foreground/80">{project.humanStory}</p>
          </section>

          {project.diff && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-foreground">Before / after</h2>
              <DiffReveal diff={project.diff} />
            </section>
          )}
        </>
      ) : (
        <>
          <p className="mt-4 text-lg text-foreground">
            {project.description ?? "No description yet — see the repo for details."}
          </p>

          {project.language && (
            <section className="mt-4">
              <h2 className="sr-only">Stack</h2>
              <ul className="flex flex-wrap gap-1">
                <li className="rounded border border-foreground/20 px-1 py-0.5 font-mono text-xs text-foreground/70">
                  {project.language}
                </li>
              </ul>
            </section>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-sm text-foreground/70 sm:w-1/2">
            <dt>Stars</dt>
            <dd>{project.stargazersCount}</dd>
            <dt>Last updated</dt>
            <dd>{new Date(project.pushedAt).toLocaleDateString()}</dd>
          </dl>
        </>
      )}

      <p className="mt-8">
        <a
          href={project.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-accent-secondary underline underline-offset-4 hover:text-accent-primary"
        >
          View on GitHub &rarr;
        </a>
      </p>
    </main>
  );
}
