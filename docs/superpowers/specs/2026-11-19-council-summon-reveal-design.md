# Council Summon Reveal — the Résumé Implosion moves to "calling Herald"

## Intent
The page itself never makes a visitor wait: first load lands directly on the #FAFAFA portfolio with the Living Acoustic Hairline under the header. The Résumé Implosion becomes the ritual of *calling* Herald, replayed on every call, so the cinematic moment belongs to the conversation rather than to page load.

## Goals
- No loading overlay on first open (remove the page-load OpeningSequence, its `herald-opening-v1` session gate, and the inert/aria-hidden page wrapper).
- Every Council open plays the reveal (~1200ms): wake word, `/`, typing, hairline pull/tap/dwell/Enter, and the "Speak with Herald" / "Ask Herald about the work" / "Test this Herald" / "Start a conversation" / artifact "Unlock via Herald" buttons.
- Beat 1 (0–600ms): the #090909 chamber unrolls downward from the hairline's on-screen y (clip-path from that line to full viewport). A dense DM Mono wall of illustrative telemetry (years, latencies, commit counts, uptime %) ticks fast, is cut horizontally by a luminous white voice wave at centre, and collapses inward onto that line.
- Beat 2 (600–1200ms): "Why read the numbers when you can ask the Herald?" briefly resolves (Cormorant) while the real Council astrolabe assembles — gyroscope rings converge from scattered tilt/radius and nodes 01–04 sweep into orbit and lock. The overlay layer fades out by 1200ms.
- Beat 3 (settled): time-of-day welcome via `speechSynthesis` only if Voice is on; Council HUD shows `> Speak or type to the Herald...` and `Hold Space to speak/interrupt · ESC to dismiss`.
- Wake word becomes "Herald" (also accept "Hey Herald" and the common mis-hearings "Harold"/"Herold"); trailing question still captured. Captions/README updated from "Hey".

## Non-goals / anti-goals
- No change to page sections, themes, typography, conversation engine or decree/raven features.
- Anti-goal: the reveal must never eat input. A first keystroke, a wake-word question, or an artifact deep-link must reach the Council intact.
- Anti-goal: no audio without opt-in; no microphone permission request from the reveal.

## Constraints
- Total ~1.2s; any keydown, pointerdown or wheel inside the Council fast-forwards to the settled state (the keystroke still lands in the command line, which is focused from frame 0). Escape still dismisses.
- `prefers-reduced-motion: reduce` → no overlay, static astrolabe, open HUD immediately; a preference change mid-reveal settles instantly.
- Closing mid-reveal cancels timers/RAF/speech; reopening replays from zero. React StrictMode-safe cleanup. DPR ≤ 2. Canvas failure falls back to the settled HUD.
- No new dependencies.

## Approaches
- **A. Reveal inside the Council dialog (chosen by Kirtan).** The dialog opens at once; a pointer-transparent canvas layer plays Beats 1–2 over the live HUD, and `CouncilAstrolabe` gains an assembly-progress input. One dialog keeps focus trap, Escape and typing working with no hand-off.
- B. Separate pre-overlay, then open the dialog at 1.2s — rejected: needs keystroke buffering and focus/Escape hand-off, and draws the astrolabe twice.
- C. DOM/CSS-only (clip-path + DOM text) — rejected: a dense ticking wall in DOM is janky on mobile and discards the existing Canvas work.

## Decided by Kirtan
Spec as pasted (beats, colours, quote, reticle, a11y); reveal replays every call; approach A.

## My calls (correct me)
- All Council entry points count as "calling", including buttons. Artifact deep-link and wake-word trailing questions submit immediately; their answer text appears as the reveal settles.
- Welcome line: "Good morning/afternoon/evening. The Herald is listening." (05–12 / 12–17 / otherwise), keyed `council-welcome`. Skipped when the call already carries a question (wake-word trailer, artifact deep-link) — the answer speaks instead. Still spoken after a fast-forward skip unless the visitor has already typed.
- The settled HUD keeps the existing proclamation text; only the hint line wording changes.
- Pure timeline/lifecycle logic (`councilReveal.ts`) is unit-tested (boundaries, skip, dispose, greeting by hour, wake-word matching); visuals verified in a real browser via Chrome DevTools MCP at desktop and mobile widths, including reduced motion.

## Left to the builder
Exact easing curves, telemetry glyph density, wave shape, ring-convergence choreography, and whether the overlay is a sibling canvas or drawn into the astrolabe canvas — within the timings above.
