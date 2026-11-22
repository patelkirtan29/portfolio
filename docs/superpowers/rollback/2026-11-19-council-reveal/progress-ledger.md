# SDD ledger — plan: docs/superpowers/plans/2026-11-19-council-summon-reveal.md
Setup: Ruling: no git repo, so no worktree/commits/task scripts; edit in place — originals snapshotted in docs/superpowers/rollback/2026-11-19-council-reveal/original/ and every change listed in CHANGES.md there — cost if wrong: restore is per-file cp rather than git revert.
Pre-flight: T5 consumes T1 (createCouncilReveal, welcomeLine) and T4 (CouncilReveal, assembleFrom) — consistent. T3 deletes OpeningSequence.tsx whose ledgerValue T4 reuses — reuse from original/ snapshot. No conflicts.
Task 1: complete (tests: npx vitest run src/lib/councilReveal.test.ts → 6/6 pass)
Task 2: complete (tests: npx vitest run src/lib/councilMicController.test.ts → 12/12 pass). Task 2: Ruling: test's second utterance moved to a fresh session — a wake retires the recognition so a second final on the same run is unreachable in real use — cost if wrong: none, behaviour assertion unchanged
Task 3: complete (App no longer imports opener; tsc clean). Task 4: complete (tsc clean). Task 5: complete (tests: npx vitest run → 80/80; tsc -b clean; vite build ok). Task 5: Ruling: welcome deferred one macrotask and a seeded summon letter counts as typed — reduced motion settles synchronously before same-commit wake/artifact questions are sent — cost if wrong: welcome skipped when a visitor summons by typing a letter. Task 5: Ruling: vite build regenerated dist/ (not snapshotted; rebuildable)
Task 6: complete (browser: load/no overlay, '/', letter, hairline, buttons, Unlock, Escape mid-reveal, reopen, welcome, reduced motion, 390px; README + CHANGES.md written)
Final review: Opus reviewer, Ready with fixes (0 Critical, 3 Important, 7 Minor).
Final: fixed hidden HUD controls caught skip taps — browser elementFromPoint on Dismiss RED(true)→GREEN(false), suite 81/81
Final: fixed decree sheet visible during Unlock reveal — browser decree opacity RED(0.11)→GREEN(0), suite 81/81
Final: fixed welcome talking over held/ambient dictation — "never welcomes over the visitor speaking, dictating, typing or asking" RED→GREEN, suite 81/81
Final: fixed (regraded Minor→Important) mid-sentence "Harold" woke Herald — wake test "I'll ask Harold tomorrow…" RED→GREEN, suite 81/81; also "Herald's" no longer wakes
Final: minor (deferred): possible one-frame settled-HUD flash for wake-word/dwell opens (reveal set in passive effect)
Final: minor (deferred): canvas getContext failure leaves a 1.2s transparent, content-hidden Council instead of settling
Final: minor (deferred): classic-scrollbar platforms see a sideways shift as body overflow locks under the transparent chamber
Final: minor (deferred): dead CSS — @keyframes council-part and its reduced-motion selector
Final: minor (deferred): no integration tests for drawer welcome suppression (browser-verified only)
Final: minor (deferred): chamber origin measured once; mid-reveal resize unrolls from the old hairline y
Final: Ruling: Escape after a wake-word open may close natively without cancel (pre-existing) — unchanged by this work — cost if wrong: modal state stuck 'chat' after a voice-opened Escape
Final: Ruling: quote timing is CSS-driven, not tied to the canvas clock — within builder latitude — cost if wrong: tens of ms drift
Final: Ruling: telemetry collapses onto screen centre, not the hairline — spec's "that line" read as the slicing wave — cost if wrong: one-line change of collapse target
Final: Ruling: Safari/Firefox welcome-vs-typed-key ordering unverified — Chrome only available — cost if wrong: a welcome may play right as a visitor starts typing
