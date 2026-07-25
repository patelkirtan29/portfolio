"use client";

import { useState } from "react";

// TODO(ship-blocker): swap for the real address before ship — placeholder
// for the same reason layout.tsx's <title>/<description> are placeholders.
const EMAIL = "hello@example.dev";

// TODO(ship-blocker): these are placeholder hrefs. Replace with the real
// GitHub/LinkedIn profile URLs before ship — labels say "placeholder" on
// purpose so this isn't accidentally mistaken for a real link in review.
const SOCIAL_LINKS = [
  { label: "GitHub (placeholder — add real profile URL before ship)", href: "#" },
  { label: "LinkedIn (placeholder — add real profile URL before ship)", href: "#" },
];

// Shared focus-ring pattern, matching Nav.tsx / Home's CTA link / the Work
// components (ProjectCard, DiffReveal) — every other interactive element in
// the codebase already uses this; Contact was the one gap.
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary";

export default function ContactForm() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 2000);
  }

  // No backend exists for this form yet. Rather than fake a success state
  // (setTimeout + "Message sent!" theater that lies to the user), this
  // hands off to the user's own mail client via a mailto: link built from
  // the fields — a genuinely working, if unglamorous, submission path.
  // TODO(ship-blocker): before ship, wire this to a real endpoint (e.g. a
  // serverless function or a form backend like Formspree) and swap this
  // handler for an actual fetch() + real success/error UI. Direct email
  // and the copy-email button above are the reliable fallback either way.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");

    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-4 pt-8 pb-14">
      <p className="font-mono text-sm text-accent-primary">03 — Contact</p>
      <h1 className="font-display text-3xl text-foreground">
        Say hello
      </h1>
      <p className="max-w-prose text-lg text-foreground/80">
        I like hearing about what people are building — a question, a bug
        you think I&apos;d enjoy, a project that needs a hand. Email me
        directly, or use the form below if that&apos;s easier.
      </p>

      {/* Always-visible direct contact info — never gated behind the form
          or any other interaction. */}
      <section
        aria-label="Direct contact"
        className="flex flex-col gap-2 rounded-lg border border-foreground/10 bg-surface p-3"
      >
        <a
          href={`mailto:${EMAIL}`}
          className={`rounded-sm font-mono text-lg text-accent-primary underline underline-offset-4 ${FOCUS_RING}`}
        >
          {EMAIL}
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyEmail}
            aria-label="Copy email address to clipboard"
            className={`rounded-md border border-foreground/20 px-2 py-1 text-sm text-foreground hover:border-accent-primary ${FOCUS_RING}`}
          >
            Copy email
          </button>
          <span role="status" aria-live="polite" className="text-sm text-foreground/60">
            {copyState === "copied" && "Copied!"}
            {copyState === "error" && "Couldn't copy — email is above."}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-label={link.label}
              className={`rounded-sm text-sm text-foreground/70 underline underline-offset-4 hover:text-accent-primary ${FOCUS_RING}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* Optional extra: a form on top of the always-visible info above,
          not a replacement for it. See handleSubmit for backend status. */}
      <form
        onSubmit={handleSubmit}
        aria-label="Contact form"
        className="flex flex-col gap-3 rounded-lg border border-foreground/10 bg-surface p-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-foreground/80">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`rounded-md border border-foreground/20 bg-background px-2 py-1 text-foreground ${FOCUS_RING}`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-foreground/80">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`rounded-md border border-foreground/20 bg-background px-2 py-1 text-foreground ${FOCUS_RING}`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="message" className="text-sm text-foreground/80">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className={`rounded-md border border-foreground/20 bg-background px-2 py-1 text-foreground ${FOCUS_RING}`}
          />
        </div>

        <button
          type="submit"
          className={`self-start rounded-md bg-accent-primary px-3 py-1.5 font-display text-background hover:opacity-90 ${FOCUS_RING}`}
        >
          Send
        </button>
        <p className="text-sm text-foreground/60">
          This opens your email client with the message pre-filled — no
          backend is wired up yet, so nothing is sent silently or faked as
          &ldquo;sent&rdquo; here.
        </p>
      </form>
    </main>
  );
}
