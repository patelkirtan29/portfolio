import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Kirtan Patel',
  description:
    'Full-Stack Engineer and CS grad student at George Washington University. Learn about my background, skills, and what I am currently building.',
}

const languages = ['TypeScript', 'JavaScript', 'Python', 'Java']
const frameworks = ['React', 'Next.js', 'Node.js', 'Tailwind CSS']
const tools = ['Git', 'Docker', 'PostgreSQL', 'REST APIs']
const ml = ['NumPy', 'Pandas', 'scikit-learn', 'ML Basics']

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
    </span>
  )
}

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} label={item} />
        ))}
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
      {/* Hero */}
      <section className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
          About Me
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
          Full-Stack Engineer &amp; MS Computer Science student at George Washington University —
          Washington, D.C.
        </p>
      </section>

      {/* Bio */}
      <section className="mb-16 space-y-5 text-base leading-7 text-zinc-600 dark:text-zinc-300">
        <p>
          I am a full-stack engineer who genuinely enjoys the craft of building software — from
          designing clean data models to polishing the last pixel of a UI. I completed my
          undergraduate degree at Northeastern University and am now pursuing a Master of Science in
          Computer Science at GWU, where I spend a lot of time thinking about distributed systems,
          machine learning pipelines, and the gap between a working prototype and a production-grade
          product.
        </p>
        <p>
          My day-to-day work lives at the intersection of TypeScript, React, and Node.js, but I
          reach for Python whenever I need to wrangle data or experiment with models. I care about
          writing code that other people can actually read — clear abstractions, honest error
          handling, and documentation that does not lie. I have shipped REST APIs, real-time
          dashboards, and CLI tools, and I am always looking for ways to make the developer
          experience better for the next person who touches the codebase.
        </p>
        <p>
          Outside of work and coursework I am drawn to problems that sit at the edge of what
          software can automate. Right now that means multi-agent orchestration, AI-assisted tooling,
          and finding the right level of abstraction for human-in-the-loop workflows. If you are
          building something interesting in that space, I would love to talk.
        </p>
      </section>

      {/* Divider */}
      <hr className="mb-16 border-zinc-200 dark:border-zinc-700" />

      {/* Education */}
      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Education
        </h2>
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold text-sm">
              GW
            </div>
            <div>
              <p className="font-semibold text-zinc-950 dark:text-white">
                George Washington University
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                M.S. Computer Science &mdash; current
              </p>
              <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Washington, D.C.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold text-sm">
              NU
            </div>
            <div>
              <p className="font-semibold text-zinc-950 dark:text-white">
                Northeastern University
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                B.S. Computer Science
              </p>
              <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Boston, MA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="mb-16 border-zinc-200 dark:border-zinc-700" />

      {/* Skills */}
      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Skills
        </h2>
        <div className="space-y-8">
          <SkillGroup title="Languages" items={languages} />
          <SkillGroup title="Frameworks &amp; Libraries" items={frameworks} />
          <SkillGroup title="Tools &amp; Infrastructure" items={tools} />
          <SkillGroup title="Machine Learning" items={ml} />
        </div>
      </section>

      {/* Divider */}
      <hr className="mb-16 border-zinc-200 dark:border-zinc-700" />

      {/* What I'm Working On */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          What I&apos;m Working On
        </h2>
        <ul className="space-y-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>
              <strong className="font-medium text-zinc-950 dark:text-white">
                AI orchestration tooling —
              </strong>{' '}
              building Maestro, a multi-agent task runner that delegates parallel work to sub-agents
              inside Claude Code.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>
              <strong className="font-medium text-zinc-950 dark:text-white">
                This portfolio —
              </strong>{' '}
              designing and shipping a portfolio site that reflects how I actually build things:
              typed, accessible, and without unnecessary dependencies.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>
              <strong className="font-medium text-zinc-950 dark:text-white">
                Graduate coursework —
              </strong>{' '}
              deep-diving into algorithms, distributed computing, and applied ML at GWU while
              keeping real projects in the rotation to stay grounded.
            </span>
          </li>
        </ul>
      </section>

      {/* Contact nudge */}
      <section>
        <p className="text-base text-zinc-500 dark:text-zinc-400">
          Want to collaborate or just say hello?{' '}
          <a
            href="mailto:patelkirtan0810@gmail.com"
            className="font-medium text-zinc-950 dark:text-white underline underline-offset-4 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            patelkirtan0810@gmail.com
          </a>
        </p>
      </section>
    </main>
  )
}
