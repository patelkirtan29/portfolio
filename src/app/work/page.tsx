import type { Metadata } from "next";
import ProjectCard from "@/components/work/ProjectCard";
import { projects } from "@/components/work/projects";

export const metadata: Metadata = {
  title: "Work",
};

export default function WorkPage() {
  return (
    <main className="mx-auto max-w-5xl px-3 py-6">
      <header className="mb-4">
        <p className="font-mono text-sm text-accent-primary">01 — Work</p>
        <h1 className="font-display text-3xl text-foreground">Work</h1>
        <p className="mt-2 max-w-2xl text-foreground/70">
          A working set of projects — expand any card for the story behind
          it, or open the full case study. (Placeholder project details
          below — real write-ups replace these before ship.)
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </main>
  );
}
