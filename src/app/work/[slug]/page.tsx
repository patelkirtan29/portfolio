import Link from "next/link";
import { notFound } from "next/navigation";
import DiffReveal from "@/components/work/DiffReveal";
import { projects } from "@/components/work/projects";

type WorkSlugPageProps = {
  params: Promise<{ slug: string }>;
};

// Real, crawlable per-project route — the source of truth for case-study
// content per CREATIVE_DIRECTION_V2.md section 5A (fixes the SEO/crawler
// risk of gating content behind the /work grid's client-side disclosure).
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function WorkSlugPage({ params }: WorkSlugPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-3 py-6">
      <Link
        href="/work"
        className="font-mono text-sm text-accent-secondary hover:text-accent-primary"
      >
        &larr; Work
      </Link>

      <p className="mt-4 font-mono text-xs text-accent-secondary">
        Placeholder case study — replace with real project details before
        ship.
      </p>
      <h1 className="mt-1 font-display text-3xl text-foreground">
        {project.name}
      </h1>

      {/*
        Human outcome before technical detail — a real design rule from
        CREATIVE_DIRECTION_V2.md section 7: every technical fact leads with
        why it mattered to a person, not the mechanism.
      */}
      <p className="mt-4 text-lg text-foreground">{project.humanOutcome}</p>

      <section className="mt-6">
        <h2 className="font-display text-lg text-foreground">Problem</h2>
        <p className="mt-1 font-mono text-sm text-accent-secondary">
          {project.oneLiner}
        </p>
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
        <h2 className="font-display text-lg text-foreground">
          Why it mattered
        </h2>
        <p className="mt-1 text-foreground/80">{project.humanStory}</p>
      </section>

      {project.flagship && project.diff && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-foreground">
            Before / after
          </h2>
          <DiffReveal diff={project.diff} />
        </section>
      )}
    </main>
  );
}
