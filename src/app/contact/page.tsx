import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Kirtan Patel",
  description:
    "Get in touch with Kirtan Patel — software engineer based in the Washington, DC area.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] font-sans">
      <div className="mx-auto max-w-3xl px-6 pb-32 pt-28">
        {/* Hero */}
        <div className="mb-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Get in Touch
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Have a project in mind or just want to say hi? I&apos;d love to
            hear from you.
          </p>
        </div>

        {/* Contact link cards */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Email */}
          <a
            href="mailto:patelkirtan0810@gmail.com"
            className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Email
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 break-all">
                patelkirtan0810@gmail.com
              </p>
            </div>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/patelkirtan29"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                GitHub
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                github.com/patelkirtan29
              </p>
            </div>
          </a>

          {/* LinkedIn placeholder */}
          <a
            href="https://www.linkedin.com/in/kirtan29"
            aria-label="LinkedIn"
            className="group flex flex-col gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                LinkedIn
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 italic">
                LinkedIn (patelkirtan29)
              </p>
            </div>
          </a>
        </div>

        {/* Section label */}
        <h2 className="mb-5 text-xl font-semibold text-zinc-950 dark:text-white">
          Send a message
        </h2>

        {/* Contact form — client component */}
        <ContactForm />
      </div>
    </div>
  );
}
