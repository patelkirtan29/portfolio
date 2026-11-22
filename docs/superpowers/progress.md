# Implementation ledger — plan: plans/2026-11-18-herald.md
Approved design and user stack. Inline execution. Staging before installation at requested path.
Pre-flight: conversation types shared by page and drawer; graphics own rendering and cleanup.

Task 1: complete — conversation tests observed RED (6 failed), implemented grounded sample responses, GREEN 6/6.
Task 2: complete — all page sections and responsive styling integrated; graphics and drawer implemented by parallel helpers.
Independent review: no Critical findings, 2 Important findings, no deferred minors.
Fixed: Lenis intercepted drawer wheel input — reproduced transcript stuck at scrollTop 333; added data-lenis-prevent plus stop/start lifecycle. Browser regression: wheel moved transcript 333 -> 0 while pageY remained 0. Escape restored focus to Summon Herald and body overflow to empty string.
Fixed: WebGL context loss — helper test RED 3 expected failures -> GREEN; loss stops frames and restores CSS fallback until remount.
Browser checks: desktop 1440x1000 and mobile 390x844; no horizontal page overflow at 390px; four mobile scenes each 390px wide. Visitor lens updates, multi-turn architecture follow-up, dark/light toggle, progress-bar scene navigation, comparison endpoint and keyboard arrows (0 -> 1), cadence/focus proclamation, configured drawer and persistent history all verified through UI.
Verification limits: microphone permission/audio hardware and OS reduced-motion mode not toggled in browser automation; API fallbacks/CSS paths inspected. No live LLM configured, per approved scope.
Dependency audit: latest available toolchain removes initial critical advisories. Six high reports remain rooted in unpatched development-only picomatch glob ReDoS advisory; registry latest 4.0.7. README records limitation. Production dependency audit performed separately.

Task 3: complete — final copy finished; tests rerun in requested project: 2 files, 9/9 pass; production build exit 0. Production dependency audit: 0 vulnerabilities. Preview runs from requested folder at http://127.0.0.1:5174/. Final browser reload: no console errors. Screenshot saved in task outputs.
