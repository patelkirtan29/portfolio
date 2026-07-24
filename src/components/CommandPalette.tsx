"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";

// Shared easing curve — same cubic-bezier as Cursor.tsx / SplitText.tsx /
// DigitFlip.tsx (see Cursor.tsx's EASE constant for the fuller note).
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ROOMS = [
  { id: "lobby", label: "Lobby" },
  { id: "practice", label: "Practice" },
  { id: "gallery", label: "Gallery" },
  { id: "signal", label: "Signal" },
];

// Placeholder — integration should swap in the real contact address before ship.
const PLACEHOLDER_EMAIL = "hello@example.com";
// Placeholder — integration needs a real hosted résumé PDF before ship.
const RESUME_HREF = "/resume-placeholder.pdf";

const itemClass =
  "cursor-pointer rounded-md px-3 py-2 text-sm text-foreground outline-none data-[selected=true]:bg-muted";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const jumpTo = useCallback(
    (id: string) => {
      window.location.hash = id;
      close();
    },
    [close],
  );

  const toggleTheme = useCallback(() => {
    // NOTE (integration): Stream 4 also built a theme-toggle button in
    // Nav.tsx. Both this and that button end up flipping the same
    // `document.documentElement.classList.contains("dark")` bit, but if
    // either side mirrors it into its own React state, the two can drift
    // out of sync (toggle via one, then the other's stale state "toggles"
    // it back). Integration should make sure there's a single source of
    // truth (e.g. a small shared store/hook) that both read and write,
    // rather than two independent toggles racing on the same DOM class.
    document.documentElement.classList.toggle("dark");
    close();
  }, [close]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PLACEHOLDER_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } finally {
      close();
    }
  }, [close]);

  const downloadResume = useCallback(() => {
    window.open(RESUME_HREF, "_blank", "noopener,noreferrer");
    close();
  }, [close]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE }}
        >
          <motion.div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={close} aria-hidden />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-muted bg-surface shadow-2xl"
          >
            <Command label="Command palette" className="flex flex-col">
              <Command.Input
                autoFocus
                placeholder="Type a command..."
                className="w-full border-b border-muted bg-transparent px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-accent-secondary"
              />
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-accent-secondary">No results.</Command.Empty>

                <Command.Group heading="Jump to" className="px-1 py-1 text-xs uppercase tracking-wide text-accent-secondary">
                  {ROOMS.map((room) => (
                    <Command.Item key={room.id} value={`Jump to ${room.label}`} onSelect={() => jumpTo(room.id)} className={itemClass}>
                      {/* Real anchor per spec (plain anchor navigation) — click
                          is funneled through onSelect above so keyboard (Enter)
                          selection navigates too, not just pointer clicks. */}
                      <a href={`#${room.id}`} onClick={(e) => e.preventDefault()} tabIndex={-1}>
                        Jump to {room.label}
                      </a>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions" className="px-1 py-1 text-xs uppercase tracking-wide text-accent-secondary">
                  <Command.Item value="Toggle theme" onSelect={toggleTheme} className={itemClass}>
                    Toggle theme
                  </Command.Item>
                  <Command.Item value="Copy email" onSelect={copyEmail} className={itemClass}>
                    {copied ? "Copied!" : "Copy email"}
                  </Command.Item>
                  <Command.Item value="Download resume" onSelect={downloadResume} className={itemClass}>
                    <a href={RESUME_HREF} onClick={(e) => e.preventDefault()} tabIndex={-1}>
                      Download résumé
                    </a>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
