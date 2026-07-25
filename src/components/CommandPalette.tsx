"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";
import { ROOM_IDS, ROOM_LABELS } from "@/lib/scroll";
import { toggleTheme as sharedToggleTheme } from "@/lib/theme";
import { closeProjectModal } from "@/lib/projectModal";

// Shared easing curve — same cubic-bezier as Cursor.tsx / SplitText.tsx /
// DigitFlip.tsx (see Cursor.tsx's EASE constant for the fuller note).
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
      // If a flagship project modal is open (shallow-routed via
      // `?project=slug`, see @/lib/projectModal), jumping to a different
      // room should close it rather than leaving it open over the wrong
      // room — light-touch ⌘K interop called for in
      // FINAL_CREATIVE_DIRECTION.md section 4 / BUILD_IDEAS_DECISIONS.md
      // item 4. No-ops if no modal is open.
      closeProjectModal();
      window.location.hash = id;
      close();
    },
    [close],
  );

  const toggleTheme = useCallback(() => {
    // Routed through the shared `@/lib/theme` store (also used by Nav.tsx's
    // toggle button) so both surfaces read/write the same state instead of
    // racing on the DOM class independently — see src/lib/theme.ts.
    sharedToggleTheme();
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
          // z-[9998]: intentionally above ProjectModal's z-[9990] (and
          // everything else except Cursor's z-[9999]) so ⌘K always overlays
          // an open flagship project modal correctly rather than being
          // covered by it — see ProjectModal.tsx's docblock for the full
          // stacking-order rationale.
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
                  {ROOM_IDS.map((id) => (
                    <Command.Item key={id} value={`Jump to ${ROOM_LABELS[id]}`} onSelect={() => jumpTo(id)} className={itemClass}>
                      {/* Real anchor per spec (plain anchor navigation) — click
                          is funneled through onSelect above so keyboard (Enter)
                          selection navigates too, not just pointer clicks. */}
                      <a href={`#${id}`} onClick={(e) => e.preventDefault()} tabIndex={-1}>
                        Jump to {ROOM_LABELS[id]}
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
