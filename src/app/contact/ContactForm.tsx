"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import TiltCard from "@/components/TiltCard";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "name" | "email" | "message" | "done";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-4 pt-8 pb-14">
      <p className="font-mono text-sm text-accent-primary">03 — Contact</p>
      <h1 className="font-display text-3xl text-foreground">
        Say hello
      </h1>
      <p className="max-w-prose text-lg text-foreground/80">
        I like hearing about what people are building — a question, a bug
        you think I&apos;d enjoy, a project that needs a hand. Email me
        directly, or use the terminal below if that&apos;s easier.
      </p>

      {/* Always-visible direct contact info — never gated behind the form
          or any other interaction. Wrapped in TiltCard (Phase 1 spectacle
          item 4) for cursor-reactive depth; the section's own content,
          focus rings, and a11y attributes are untouched by the wrap. */}
      <TiltCard>
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
      </TiltCard>

      {/* Optional extra: a terminal-style stepped form on top of the
          always-visible info above, not a replacement for it. Ported from
          design2's Signal.tsx room (sequential name -> email -> message
          disclosure, advancing on Enter, inline validation, PromptLine /
          EchoLine helpers) with two deliberate deviations — see SignalForm:
          - no Lenis/continuous-scroll `preventScroll` focus-management
            effect (this app has no Lenis, so a plain .focus() is enough).
          - real submission: posts to /api/contact and renders live
            submitting/success/error states instead of design2's fake
            setTimeout "success" theater or a mailto: handoff.
          Also wrapped in TiltCard — see note above. */}
      <TiltCard>
        <SignalForm />
      </TiltCard>
    </main>
  );
}

/**
 * Terminal/monospace sequential-disclosure contact form, ported from
 * design2's Signal.tsx room. Fields disclose one at a time on Enter:
 * name -> email -> message -> real POST to /api/contact.
 */
function SignalForm() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // design2's Signal.tsx uses `focus({ preventScroll: true })` here
    // because that room sits mid-page on a single continuous-scroll layout
    // driven by Lenis, and an unguarded focus() would fight Lenis / trip a
    // room-snap heuristic. This page has no Lenis and no continuous scroll,
    // so that guard doesn't apply — a plain .focus() is enough.
    if (step === "name") nameRef.current?.focus();
    if (step === "email") emailRef.current?.focus();
    if (step === "message") messageRef.current?.focus();
  }, [step]);

  function advanceFromName() {
    if (!name.trim()) {
      setError("name is required");
      return;
    }
    setError("");
    setStep("email");
  }

  function advanceFromEmail() {
    const trimmed = emailValue.trim();
    if (!trimmed) {
      setError("email is required");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError("that doesn't look like a valid email");
      return;
    }
    setError("");
    setStep("message");
  }

  // Posts the collected fields to the real /api/contact endpoint and
  // reflects the request lifecycle in the UI (submitting/success/error)
  // instead of design2's fake setTimeout "success" theater or a mailto:
  // handoff. On failure the form stays on the message step with the
  // fields intact so the user can retry without retyping anything.
  async function submit() {
    if (isSubmitting) return;
    if (!message.trim()) {
      setError("message is required");
      return;
    }
    setError("");
    setIsSubmitting(true);

    const formPayload = {
      name: name.trim(),
      email: emailValue.trim(),
      message,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload),
      });

      let data: { referenceId?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Response had no/invalid JSON body — fall through to the
        // generic error message below.
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong — please try again.");
        return;
      }

      setReferenceId(data.referenceId ?? "");
      setStep("done");
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNameKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      advanceFromName();
    }
  }

  function handleEmailKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      advanceFromEmail();
    }
  }

  function handleMessageKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function reset() {
    setName("");
    setEmailValue("");
    setMessage("");
    setError("");
    setReferenceId("");
    setStep("name");
  }

  return (
    <form
      aria-label="Contact form"
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-3 rounded-lg border border-foreground/10 bg-surface p-3 font-mono text-sm text-foreground"
    >
      <p className="text-accent-secondary">
        <span className="text-accent-primary">{">"}</span> signal_
        <span className="text-accent-secondary/70">{" // send a message"}</span>
      </p>

      <div className="space-y-3">
        {step !== "name" && <EchoLine label="name" value={name} />}
        {step === "name" && (
          <PromptLine label="name">
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKey}
              autoComplete="name"
              spellCheck={false}
              aria-label="Your name"
              className="flex-1 bg-transparent outline-none placeholder:text-accent-secondary/40"
              placeholder="type your name, press enter"
            />
          </PromptLine>
        )}

        {step !== "name" && step !== "email" && (
          <EchoLine label="email" value={emailValue} />
        )}
        {step === "email" && (
          <PromptLine label="email">
            <input
              ref={emailRef}
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              onKeyDown={handleEmailKey}
              autoComplete="email"
              spellCheck={false}
              aria-label="Your email"
              className="flex-1 bg-transparent outline-none placeholder:text-accent-secondary/40"
              placeholder="you@domain.com, press enter"
            />
          </PromptLine>
        )}

        {step === "done" && <EchoLine label="message" value={message} />}
        {step === "message" && (
          <PromptLine label="message" alignTop>
            <textarea
              ref={messageRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleMessageKey}
              spellCheck={false}
              aria-label="Your message"
              rows={3}
              disabled={isSubmitting}
              className="flex-1 bg-transparent outline-none resize-none placeholder:text-accent-secondary/40 disabled:opacity-50"
              placeholder="say something — enter to send, shift+enter for new line"
            />
          </PromptLine>
        )}
      </div>

      {step === "message" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            aria-label="Send message"
            className={`rounded-md border border-foreground/20 px-2 py-1 text-sm text-foreground hover:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isSubmitting ? "sending…" : "send"}
          </button>
          <span role="status" aria-live="polite" className="text-sm text-foreground/60">
            {isSubmitting && "sending — hang tight"}
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-accent-primary">
          ! {error}
        </p>
      )}

      <div aria-live="polite">
        {step === "done" && (
          <div className="border-t border-muted pt-4">
            <p className="text-accent-primary">
              {`message sent${
                name.trim() ? `, thanks ${name.trim().split(" ")[0]}` : ""
              } — reference ${referenceId || "pending"}.`}
            </p>
            <button
              type="button"
              onClick={reset}
              className={`mt-3 rounded-sm text-accent-secondary underline underline-offset-4 hover:text-accent-primary ${FOCUS_RING}`}
            >
              send another
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-foreground/60">
        Sent directly from this form — no email client required, and
        nothing is faked as &ldquo;sent&rdquo; here.
      </p>
    </form>
  );
}

function PromptLine({
  label,
  children,
  alignTop = false,
}: {
  label: string;
  children: ReactNode;
  alignTop?: boolean;
}) {
  return (
    <label
      className={`flex gap-2 border-b border-muted pb-2 ${
        alignTop ? "items-start" : "items-center"
      }`}
    >
      <span className="text-accent-secondary shrink-0">{label}:</span>
      {children}
    </label>
  );
}

function EchoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2 text-accent-secondary/70">
      <span className="shrink-0">{label}:</span>
      <span className="truncate text-foreground/80">{value}</span>
    </p>
  );
}
