"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    const mailto = `mailto:patelkirtan0810@gmail.com?subject=${subject}&body=${body}`;

    window.open(mailto, "_blank");
    setSent(true);
  }

  function handleReset() {
    setName("");
    setEmail("");
    setMessage("");
    setSent(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400 dark:text-zinc-500"
          aria-hidden="true"
        >
          <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          <path d="m16 19 2 2 4-4" />
        </svg>
        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
          Your email client should have opened!
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          If nothing opened, email me directly at{" "}
          <a
            href="mailto:patelkirtan0810@gmail.com"
            className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            patelkirtan0810@gmail.com
          </a>
          .
        </p>
        <button
          onClick={handleReset}
          className="mt-2 text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-name"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-email"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-message"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          placeholder="Tell me about your project, or just say hi..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
        />
      </div>

      <button
        type="submit"
        className="self-start flex h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        Send Message
      </button>
    </form>
  );
}
