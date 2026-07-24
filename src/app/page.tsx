import { Suspense } from "react";
import FeaturedProjects from "@/components/FeaturedProjects";
import GravityEffect from "@/components/GravityEffect";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0a0a] font-sans overflow-x-hidden">
      {/* Hero — full viewport, centered */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center text-center px-6">
        <h1
          data-gravity
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-950 dark:text-white"
        >
          Kirtan Patel
        </h1>

        <p
          data-gravity
          className="mt-5 text-lg sm:text-xl font-medium text-zinc-500 dark:text-zinc-400"
        >
          Full-Stack Engineer &amp; CS Grad Student at GWU
        </p>

        <p
          data-gravity
          className="mt-4 max-w-xl text-base leading-7 text-zinc-500 dark:text-zinc-400"
        >
          I build scalable web applications and explore machine learning at
          George Washington University. Passionate about clean code, thoughtful
          UX, and shipping things that matter.
        </p>

        {/* Icon links */}
        <div data-gravity className="mt-8 flex items-center gap-5">
          <a
            href="https://github.com/patelkirtan29"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
            </svg>
          </a>
          <a
            href="mailto:patelkirtan0810@gmail.com"
            aria-label="Email"
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </a>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href="#projects"
            className="flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            View Projects
          </a>
          <a
            href="mailto:patelkirtan0810@gmail.com"
            className="flex h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Contact
          </a>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 animate-bounce text-zinc-300 dark:text-zinc-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* Projects section */}
      <section
        id="projects"
        className="relative z-10 mx-auto max-w-5xl px-6 pb-32 pt-8"
      >
        <h2 className="mb-10 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Projects
        </h2>
        <Suspense fallback={<ProjectsSkeleton />}>
          <FeaturedProjects />
        </Suspense>
        <div className="mt-10 text-center">
          <a
            href="/projects"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            View all projects →
          </a>
        </div>
      </section>

      <GravityEffect />
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 animate-pulse"
        >
          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-700/60" />
            <div className="h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-700/60" />
          </div>
          <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-700/60" />
        </div>
      ))}
    </div>
  );
}
