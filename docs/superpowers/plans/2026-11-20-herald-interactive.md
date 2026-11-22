# Herald Interactive Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver the supplied interactive portfolio brief in the existing site.
**Architecture:** Extend established React components; dedicated SVG simulations share only drawing primitives. Preserve profile schema compatibility and native speech controls.
**Tech Stack:** React 19, TypeScript, Vite, GSAP, Lenis, Canvas/WebGL2, SVG.
**Spec:** ../specs/2026-11-20-herald-interactive-design.md

## Global Constraints
Monochrome; pills for controls; 24px cards/decrees; 28px modals; DPR <=2; reduced motion; no phone/GWU GPA; no invented scientific or performance claims; Hey wake phrase.

## Review Focus
Custom saved profiles, narrow screens, simulation state reset on project change, reduced motion during active animation, command entry while summon reveal plays.

## Tasks
- [x] Project simulations: ProjectSimulation.tsx / project-simulation.css / ArtifactModal.tsx; six unique controls, state explanations, motion cleanup and static reduced-motion views. Verify each in browser.
- [x] Rounded styling: existing stylesheets; all controls, nested diagrams, cards, editor, HUD and themes; verify desktop and mobile.
- [x] Monograph/content: Chapters.tsx / portfolioData.ts / profile.ts / IdentityEditor.tsx; separate familiar/interests fields and schema roundtrip tests, source-qualified content.
- [x] Integrate header/hero/lens labels/previews/skills and research sections in App.tsx. Keep internal mode keys for storage compatibility.
- [x] Test and implement Hey wake word plus Raven answer summaries.
- [x] Use actual portfolio metrics in summon reveal; provide real system-flow decree schematics without arbitrary stack chains.
- [x] Preserve untouched previous seed migration and customized data with regression tests.
- [x] Sync coherent chunks to requested folder; run complete tests/build; review, browser QA and save screenshot.

User subsequently resumed testing. Automated suite and production build pass; browser checks completed. Live microphone recognition and universal frame-rate measurements are outside the completed checks.
