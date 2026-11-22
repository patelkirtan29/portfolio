# Council Summon Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the page-load opener and replay a ~1200ms Résumé Implosion inside the Council every time Herald is called.

**Architecture:** A pure timeline controller (`councilReveal.ts`) owns timers, skip and settle. `CouncilReveal.tsx` is a pointer-transparent Canvas layer inside the Council dialog that draws Beats 1–2 from a shared start timestamp; `CouncilAstrolabe` reads the same timestamp to assemble. `ConversationDrawer` starts a reveal on every open, focuses the command line at frame 0, fast-forwards on input and speaks the welcome on settle.

**Tech Stack:** React 19, TypeScript, Vite, Canvas 2D, Vitest, Web Speech API.

**Spec:** `docs/superpowers/specs/2026-11-19-council-summon-reveal-design.md`

## Global Constraints
- Timeline: Beat 1 0–600ms, Beat 2 600–1200ms, settled at 1200ms (`REVEAL_TIMING={slice:300,assemble:600,settle:1200}`).
- Quote verbatim: `Why read the numbers when you can ask the Herald?`
- Reticle placeholder `Speak or type to the Herald…` (existing); hint verbatim `Hold Space to speak/interrupt · ESC to dismiss`.
- Welcome: `Good morning. The Herald is listening.` (hours 5–11), `Good afternoon. …` (12–16), `Good evening. …` otherwise; speech key `council-welcome`; only when `speech.enabled`.
- Wake: `herald` / `harold` / `herold` as whole words (optionally preceded by "hey"); bare "Hey" no longer wakes.
- Colours `#090909` chamber, `#F5F5F5` wave/text; DM Mono telemetry; Cormorant quote; DPR ≤ 2; no new dependencies.
- Reduced motion: no overlay, astrolabe static, settled immediately.
- Not a git repo: no commit steps. Every created/modified/deleted file is recorded in `docs/superpowers/rollback/2026-11-19-council-reveal/CHANGES.md`; originals already live in `…/original/`.

## Review Focus
1. Visitor types a letter to summon → that letter is in the textarea and the reveal still plays (summon seed must not be swallowed by the skip listener).
2. Council closed mid-reveal, then reopened → reveal restarts from 0, no stale settle/welcome from the first open.
3. Wake word with trailing question / artifact deep-link → answer is submitted immediately, welcome is not spoken over it.
4. Window resize or theme change mid-reveal → canvas resizes without restarting the clock.
5. Escape during the reveal → closes the Council (not just skips).

---

### Task 1: Reveal timeline controller

**Files:**
- Create: `src/lib/councilReveal.ts`, `src/lib/councilReveal.test.ts`
- Delete: `src/lib/openingSequence.ts`, `src/lib/openingSequence.test.ts`, `src/lib/useOpeningSequence.ts`

**Interfaces — Produces:**
- `REVEAL_TIMING` (above), `revealQuote: string`
- `welcomeLine(hour: number): string`
- `createCouncilReveal(options: {reduced: boolean; onSettle: () => void}): {startedAt: number; skip: () => void; dispose: () => void}` — `startedAt` is `performance.now()` at creation; reduced → settles synchronously and `startedAt = -Infinity`; `onSettle` fires exactly once; `dispose` cancels without settling.

- [ ] **Step 1: Write failing tests** — `settles exactly once at 1200ms` (advance 1199 → not called; 1 → called once; later `skip()` → still once); `skip settles immediately and cancels the timer`; `dispose never settles`; `reduced motion settles synchronously`; `welcomeLine(4|5|11|12|16|17|23)` → evening/morning/morning/afternoon/afternoon/evening/evening.
- [ ] **Step 2:** `npx vitest run src/lib/councilReveal.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement; delete the three opening files.
- [ ] **Step 4:** Same command → PASS.

### Task 2: "Herald" wake word

**Files:**
- Modify: `src/lib/councilMicController.ts:267` (wake regex), `src/lib/councilMicController.test.ts` (first and fourth tests), `src/components/AcousticHairline.tsx:486` (caption)

- [ ] **Step 1: Update tests** — `wakes on Herald, accepts Hey Herald and Harold, ignores bare Hey and partial words`: `final('hey')`, `final('heralded the news')` → not called; `final('Herald!')` → `''`; `final('Hey Harold, explain your work')` → `'explain your work'`. Fourth test's wake utterance becomes `'Herald, explain your work'`.
- [ ] **Step 2:** `npx vitest run src/lib/councilMicController.test.ts` → FAIL.
- [ ] **Step 3:** Regex `/(?:\bhey[\s,]+)?\b(?:herald|harold|herold)\b[\s,.:;!?-]*/i`; caption `Say ‘Herald’, press /, or start typing to summon.`
- [ ] **Step 4:** Same command → PASS.

### Task 3: Remove the page-load opener from App

**Files:**
- Modify: `src/App.tsx` (imports lines 13–14, `opening` hook line 37, `interactionLocked`, summon keydown effect, `.herald-site` wrapper attrs, trailing `<OpeningSequence/>`)
- Delete: `src/components/OpeningSequence.tsx`, `src/components/opening.css` (ledger drawing moves to Task 4)

- [ ] **Step 1:** `interactionLocked = anyModal`; `summonKey(event, editable, modal!==null)`; wrapper loses `data-opening`/`inert`/`aria-hidden`; no opening import/usage.
- [ ] **Step 2:** `npx tsc -b` → passes once Task 4 exists (run after Task 4 if ordered strictly).

### Task 4: Reveal canvas + astrolabe assembly

**Files:**
- Create: `src/components/CouncilReveal.tsx`, `src/components/reveal.css`
- Modify: `src/components/CouncilAstrolabe.tsx` (new prop)

**Interfaces — Produces:**
- `<CouncilReveal startedAt={number} originY={number} />` — fixed, `pointer-events:none`, `aria-hidden`, z above HUD content. Draws by `elapsed = now - startedAt`: chamber clip unrolling from `originY` to full height (0–420ms, ease-out); ticking telemetry wall (reuse `ledgerValue` from the deleted `OpeningSequence.tsx` original) 0–600ms; white wave sweeps across centre 300–600ms and the wall collapses toward the centre line; quote (DOM, CSS-timed) visible ~650–1050ms; layer opacity → 0 over 1000–1200ms; stops RAF at 1200ms. ResizeObserver keeps the clock.
- `CouncilAstrolabe` gains `assembleFrom?: number`: `progress = ease(clamp((now - assembleFrom - 600) / 500))`; rings start at radius ×1.6, extra tilt and α 0 and converge; nodes start at angle offset +π and radius ×1.8, α 0. `assembleFrom` undefined or reduced motion → progress 1.

- [ ] **Step 1:** Implement both; `npx tsc -b` → no errors.

### Task 5: Council integration

**Files:**
- Modify: `src/components/ConversationDrawer.tsx`, `src/components/drawer.css` (remove `.council-hud[open]` `council-part` animation; add `.council-hud[data-revealing=true] .council-shell` fade-in 600–1200ms)

**Interfaces — Consumes:** Task 1 `createCouncilReveal`, `welcomeLine`; Task 4 components.

- [ ] **Step 1:** On `open` true: compute `originY` from `.acoustic-hairline` `getBoundingClientRect().top + 48` (fallback 64); create reveal with `reduced` from matchMedia; store `startedAt` in state; `data-revealing` on the dialog until settle. Dispose on close/unmount.
- [ ] **Step 2:** Skip: dialog-level capture listeners for `keydown` (not Escape — let it close), `pointerdown`, `wheel` call `skip()` without `preventDefault`, so the keystroke reaches the focused textarea. Reduced-motion `change` → `skip()`.
- [ ] **Step 3:** On settle: if `speech.enabled` and no turn was submitted during this open and draft is empty → `speech.speak(welcomeLine(new Date().getHours()), {key:'council-welcome', tone})`. Summon seed text (`summonRequest` with `submit:false`) still lands in the draft and counts as typed.
- [ ] **Step 4:** Hint text → `Hold Space to speak/interrupt · ESC to dismiss`.
- [ ] **Step 5:** `npx vitest run && npx tsc -b && npx vite build` → all pass.

### Task 6: Browser verification, README, change ledger

**Files:**
- Modify: `README.md` (Living Acoustic Hairline section: Herald wake word, per-call reveal, no load overlay)
- Create: `docs/superpowers/rollback/2026-11-19-council-reveal/CHANGES.md` (table: file · created/modified/deleted · what changed · restore command `cp original/<path> <path>` or `rm <path>`)

- [ ] **Step 1:** `npm run dev`; Chrome DevTools MCP at 1440×900 and 390×844: first load shows no overlay; `/`, letter key, hairline click and "Speak with Herald" each play the reveal; screenshots at ~150/450/800/1300ms; letter summon keeps the letter; Escape mid-reveal closes; reopen replays; emulate `prefers-reduced-motion: reduce` → instant HUD.
- [ ] **Step 2:** Write README changes and CHANGES.md.
