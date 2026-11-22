# Résumé Implosion Implementation Plan

Goal: implement the requested 2.2s skippable cinematic opener without changing the site.
Architecture: pure lifecycle controller and hook own session/timers/capture events; Canvas component owns visual timeline. Parent combines opening/modal page lock and inert wrapper.
Spec: ../specs/2026-11-19-resume-implosion-design.md

- [ ] Root: RED->GREEN lifecycle/session tests in lib/openingSequence.ts/test.ts; hook useOpeningSequence.ts for browser listeners and reduced motion.
- [ ] Visual helper: OpeningSequence.tsx + opening.css; exact 3 beats, DPR<=2, static cleanup and scoped TypeScript.
- [ ] Parent: integrate overlay/inert wrapper and shared Lenis/body lock; suppress summon shortcuts until finished, hide existing hairline until handoff.
- [ ] Independent review + tests/build, browser timing/skip/session/viewport checks, sync completed files to requested folder and save evidence.

Review focus: first skip key/click must not reach underlying site; StrictMode cannot consume session early; preference change must stop animation; timer/Canvas failure cannot strand overlay; persistent saved theme and page functionality retained.
