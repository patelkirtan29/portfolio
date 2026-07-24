import { Suspense } from "react";
import GitHubProjects from "@/components/GitHubProjects";

// ─── Highlighted project data ────────────────────────────────────────────────

interface HighlightedProject {
  name: string;
  description: string;
  longDescription: string;
  tech: string[];
  href: string;
  emoji: string;
}

const HIGHLIGHTED_PROJECTS: HighlightedProject[] = [
  {
    name: "Maestro",
    emoji: "🎼",
    description: "Claude Code multi-agent orchestration system",
    longDescription:
      "Maestro enables parallelized AI workflows inside Claude Code's harness. A leader Claude session decomposes goals into tasks and delegates them to concurrent worker agents — no API key required. Workers are sandboxed to isolated workspace directories, making it safe to run complex multi-step automations.",
    tech: ["Python", "Claude Code", "Shell"],
    href: "https://github.com/patelkirtan29/Maestro",
  },
  {
    name: "Portfolio",
    emoji: "✦",
    description: "This very site — built with Next.js 14 & Tailwind CSS",
    longDescription:
      "A Next.js 14 portfolio with App Router, Tailwind CSS, dark mode, live GitHub project feeds, and a gravity physics easter egg. Features a particle field background, async server components for real-time data, and a clean Geist font aesthetic. Every section is a server component streamed with Suspense.",
    tech: ["TypeScript", "Next.js", "Tailwind CSS"],
    href: "https://github.com/patelkirtan29/portfolio",
  },
  {
    name: "KitAI",
    emoji: "🤖",
    description: "AI-powered assistant with intelligent memory management",
    longDescription:
      "An AI-powered assistant application focused on intuitive conversational interfaces and intelligent memory management. Built with modern web technologies and a Python backend, KitAI explores how persistent context and structured recall can make AI assistants feel genuinely useful over long sessions.",
    tech: ["TypeScript", "Python"],
    href: "https://github.com/patelkirtan29/KitAI",
  },
];

// ─── Language badge colours (reused from GitHubProjects) ─────────────────────

const LANG_STYLES: Record<string, string> = {
  Python: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  JavaScript:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  TypeScript:
    "bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
  "Next.js":
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  "Tailwind CSS":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Claude Code":
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Shell: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
};

const DEFAULT_LANG_STYLE =
  "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300";

// ─── Featured project card ────────────────────────────────────────────────────

function FeaturedCard({ project }: { project: HighlightedProject }) {
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        // Base card
        "group relative flex flex-col gap-4 rounded-2xl p-6",
        "bg-white dark:bg-zinc-900",
        "shadow-sm transition-all duration-200",
        // Gradient border via a pseudo-element technique using ring + outline
        "ring-1 ring-zinc-200 dark:ring-zinc-700",
        "hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500",
        "hover:shadow-lg",
      ].join(" ")}
    >
      {/* "Featured" badge */}
      <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-zinc-950 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
        Featured
      </span>

      {/* Emoji / icon */}
      <span
        aria-hidden="true"
        className="text-3xl leading-none select-none"
      >
        {project.emoji}
      </span>

      {/* Title + short description */}
      <div>
        <h3 className="text-lg font-bold tracking-tight text-zinc-950 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-200">
          {project.name}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {project.description}
        </p>
      </div>

      {/* Long description */}
      <p className="flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {project.longDescription}
      </p>

      {/* Tech badges */}
      <div className="flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <span
            key={t}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LANG_STYLES[t] ?? DEFAULT_LANG_STYLE}`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* CTA */}
      <span className="text-xs font-medium text-zinc-400 transition-colors group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300">
        View on GitHub →
      </span>
    </a>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ReposSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 animate-pulse"
        >
          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-700/60" />
            <div className="h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-700/60" />
            <div className="h-3 w-4/6 rounded bg-zinc-100 dark:bg-zinc-700/60" />
          </div>
          <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-700/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Projects — Kirtan Patel",
  description:
    "A selection of highlighted projects and every public repository from Kirtan Patel, Full-Stack Engineer & CS Grad Student at GWU.",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* ── Page hero ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
          Projects
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
          A mix of things I have built, explored, and shipped — from AI
          orchestration tooling to full-stack web apps. Highlighted picks are
          below; every public repo follows.
        </p>
      </section>

      {/* ── Highlighted projects ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Highlighted Projects
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTED_PROJECTS.map((project) => (
            <FeaturedCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6">
        <hr className="border-zinc-200 dark:border-zinc-800" />
      </div>

      {/* ── All GitHub repos ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-32 pt-12">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            All Projects
          </h2>
          <a
            href="https://github.com/patelkirtan29"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            View GitHub profile →
          </a>
        </div>

        <Suspense fallback={<ReposSkeleton />}>
          <GitHubProjects />
        </Suspense>
      </section>
    </div>
  );
}
