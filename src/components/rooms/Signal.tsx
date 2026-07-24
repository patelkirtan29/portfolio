"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Step = "name" | "email" | "message" | "done";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Room: Signal (contact). Kept short and late per the creative direction doc.
 * Fields disclose sequentially on Enter: name -> email -> message -> submit.
 *
 * NOTE: this is a client-side-only fake-success flow (setTimeout). No real
 * submit endpoint is wired yet — that needs adding before ship (see report).
 */
export default function Signal() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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
    const trimmed = email.trim();
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

  function submit() {
    if (!message.trim()) {
      setError("message is required");
      return;
    }
    setError("");
    setSubmitting(true);
    // Fake success flow — swap for a real POST to a submit endpoint before ship.
    window.setTimeout(() => {
      setSubmitting(false);
      setStep("done");
    }, 900);
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
    setEmail("");
    setMessage("");
    setError("");
    setStep("name");
  }

  return (
    <section
      id="signal"
      className="min-h-screen flex items-center justify-center px-6 py-24"
    >
      <div className="w-full max-w-lg font-mono text-sm text-foreground">
        <p className="mb-6 text-accent-secondary">
          <span className="text-accent-primary">{">"}</span> signal_
          <span className="text-accent-secondary/70">{" // transmit a message"}</span>
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
                autoComplete="off"
                spellCheck={false}
                aria-label="Your name"
                className="flex-1 bg-transparent outline-none placeholder:text-accent-secondary/40"
                placeholder="type your name, press enter"
              />
            </PromptLine>
          )}

          {step !== "name" && step !== "email" && (
            <EchoLine label="email" value={email} />
          )}
          {step === "email" && (
            <PromptLine label="email">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKey}
                autoComplete="off"
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
                className="flex-1 bg-transparent outline-none resize-none placeholder:text-accent-secondary/40"
                placeholder="say something — enter to send, shift+enter for new line"
              />
            </PromptLine>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-accent-primary">
            ! {error}
          </p>
        )}

        <div aria-live="polite">
          {submitting && (
            <p className="mt-4 text-accent-secondary animate-pulse">
              transmitting...
            </p>
          )}

          {step === "done" && !submitting && (
            <div className="mt-6 border-t border-muted pt-4">
              <p className="text-accent-primary">
                {`transmission received. thanks${
                  name.trim() ? `, ${name.trim().split(" ")[0]}` : ""
                } — I'll be in touch.`}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-3 text-accent-secondary underline underline-offset-4 hover:text-accent-primary"
              >
                send another
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
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
