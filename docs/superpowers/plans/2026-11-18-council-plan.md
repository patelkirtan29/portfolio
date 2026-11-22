# Acoustic Hairline and Council Implementation Plan

Goal: apply targeted new summon and conversation experience while preserving the site.
Spec: ../specs/2026-11-18-council-design.md
Approach: parallel bounded components with parent integration; existing native dialog, profile and speech adapter retained.

- [x] Hairline helper: Canvas spring string, caption, dwell/pull/tap and editable-safe keyboard rules/tests.
- [x] Council visual helper: astrolabe Canvas with artifact vector, decree sheet, session summary pure helpers/tests.
- [x] Microphone helper: optional ambient recognition, wake/dismiss, holdSpace dictation, permission/error handling, speaking pause.
- [x] Parent: replace drawer with HUD, integrate first-key requests, header metadata and existing CTA routing; shared speech, decree and raven handoff.
- [x] Run full tests/build; independent review; browser keyboard/pointer/mobile and fallback; sync each completed component to requested folder.

Review focus: editing must never summon; no dropped first character; no mic permission without explicit click; synthesis cannot feed ambient recognizer; modal handoff doesn't cancel new speech; telemetry unknowns stay unknown; summary is draft-only.
