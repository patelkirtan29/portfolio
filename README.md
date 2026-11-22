# Herald — The Monochrome Exhibition

A voice-capable editable portfolio built with React 19, TypeScript, Vite, GSAP/ScrollTrigger, Lenis, custom WebGL2 and Canvas.

## Run

Node.js 22.12+; Node 24 recommended.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. If a port is occupied, Vite selects the next one.

```sh
npm test
npm run build
npm run preview
```

## Explore

- **Doorman:** monochrome particle/contour field, spring-damped acoustic crest, four visitor lenses, opt-in spoken introductions.
- **Chapters:** four pinned documentary compositions with parallax, clip-path wipes, optical blur and edge reading progress. Mobile/reduced motion shows all chapters in normal flow.
- **Artifacts:** six numbered projects, full exhibition dialogs, real browser narration and deeper architecture notes. **Unlock via Herald** opens a project conversation; asking about a project also reveals its notes. Follow the response’s artifact link to reopen the exhibition.
- **Ledger:** career, capabilities, outcomes, speech samples with boundary captions and an interactive wireframe sphere.
- **Studio:** choose cadence and topic focus, then speak or type in the conversation chamber.
- **Customize Identity:** edit the owner, bio, availability, all lens pitches, six complete artifacts, career rows and capabilities. Save updates the page and future answers; reload restores the saved profile. Conversation history and vault reveals reset when identity changes.

The default profile is Kirtan Patel’s supplied portfolio, sourced from `career-ops/output/portfolio-content.md` and the detailed project documents. The six projects retain ownership, course/in-progress status and evaluation qualifiers. Email, LinkedIn and GitHub are provided; phone is not displayed. Identifiable legacy Alex Morgan sample data automatically migrates to the new portfolio; customized owner profiles are preserved. The editor is local and has no authentication. Data is stored in this browser’s `herald-profile-v2` localStorage key, with schema validation and safe fallback. Storage restrictions are reported; unsaved persistence still leaves the current session usable. Theme uses `herald-theme-v2`. Conversation and vault reveals remain session-local. Vault is a narrative reveal, not access control or private storage.

## Voice and grounding

The conversation engine is scripted and uses the current saved profile, stable Artifact 01–04 references and previous conversational subject. It is not a live LLM. Unknown facts are explicitly declined. Global Voice is opt-in; explicit narration/read buttons also work while automatic voice is off. One shared synthesis controller coordinates cancellation, speaking state and speech-boundary captions across the entire app. Caption granularity depends on browser boundary-event support; full scripts remain visible.

Microphone dictation uses `SpeechRecognition`/`webkitSpeechRecognition` where supported and requires permission; the browser vendor may process audio through its own service. Text and prompt chips always work. No microphone permission is required for speech output. Speech quality depends on installed browser/OS voices. No backend, credentials or paid API is configured.

Sub-400ms is a design target, not measured latency. “100% grounded” describes the scripted engine reading saved profile data; it does not assert external verification of an owner’s claims.

## Source map

- `src/App.tsx`: shared profile/persona/modal state, page sections and Lenis orchestration.
- `src/components/Chapters.tsx`: pinned chapter timeline, wipes, parallax and jump controls.
- `src/components/Graphics.tsx` / `graphics.css`: WebGL2, spring crest and Canvas sphere.
- `src/components/ArtifactModal.tsx`, `IdentityEditor.tsx`, `exhibition.css`: exhibition and editable identity dialogs.
- `src/components/ConversationDrawer.tsx` / `drawer.css`: transcript, microphone, evidence and vault events.
- `src/lib/profile.ts`: seeded content, bounded schema validation and storage.
- `src/lib/conversation.ts`: deterministic current-profile answers, references and follow-ups.
- `src/lib/useSpeech.ts`, `speechController.ts`: shared browser playback and stale-event protection.
- `docs/superpowers/`: design, plan, integration contracts and verification ledger.

Display typography loads Cormorant Garamond 600/700, DM Sans and DM Mono from Google Fonts with local fallbacks. All artwork is procedural, requiring no external images.

## Verification

The test suite covers profile/schema/storage failures, project renaming and contextual artifact unlocks, current owner facts, unknown queries, speech cancellation, chapter wipe boundaries and WebGL context fallback. TypeScript and production build pass. Browser checks cover artifact → conversation → revealed notes, identity edits surviving reload and reaching chat, auto-voice handoff, desktop/mobile widths, modal Escape/focus and scroll restoration. Microphone hardware/permissions and OS reduced-motion settings require user testing; reduced-motion code paths are implemented and reviewed.

## Dependency audit

Production dependencies audit clean. The development toolchain still carries the upstream `picomatch` glob-pattern denial-of-service advisory, with six affected package reports. Registry latest was 4.0.7 and no patched release was available at verification. Avoid untrusted glob patterns in build/test tooling. Browser production assets do not use this build-time matcher. Do not follow the audit’s suggested downgrade to an older test runner with separate critical advisories.


## Living Acoustic Hairline & Council HUD

The header now ends in quiet archival metadata. Its 1px divider is a Canvas spring string: move near it for the whisper, dwell, pull downward, tap, or focus it and press Enter to open the Council. Press `/` or type a letter anywhere outside editable fields to summon and retain that first character. Existing page sections, palettes, typography and theme controls are unchanged.

The previous sidebar is now a full-viewport #090909 Council with an engraved silver astrolabe, six artifact nodes, a relevant-project vector, actual-speech waveform, latest serif proclamation and a bare command line. Enter submits; Escape or the Dismiss action closes. Hold Space in an empty command line (or outside interactive controls) to interrupt and dictate; normal typed spaces are preserved when composing a question.

Wake word listening is optional and off initially. Explicitly enable **Wake word** in the utilities or Council to request microphone permission. After permission, saying “Herald” (or “Hey Herald”) summons; a trailing question can be captured. In the Council, saying “Dismiss” closes. Browser recognition support, network speech services and hardware vary. Synthetic playback pauses recognition to avoid feedback; no permission is requested merely by viewing the site or opening the Council.

Ask a project architecture/technical/stack/proof question for its **Decree Unlocked** sheet. The diagram uses saved stack entries; connections are composition, not a claim of externally verified runtime flow. Unsupplied p99 latency and uptime remain “Not supplied.” On narrow screens, close the decree to return to the neural Council.

**Dispatch a Raven — Send Session Summary** prepares a copy-ready record of questions and unlocked project lessons. Copy saves it to your clipboard; Open email draft uses mailto without a recipient or automatic sending. You decide where to send it.

New modules: `AcousticHairline.tsx`, `CouncilAstrolabe.tsx`, `DecreeSheet.tsx`, `summon.ts`, `useCouncilMic.ts` / `councilMicController.ts`, and `sessionSummary.ts`. Tests cover keyboard guards, mic denial/cancellation/output silence and summary/decree routing in addition to the existing portfolio suite. Live microphone hardware was not enabled during automated browser QA.

## Summon Reveal (Résumé Implosion)

The site opens with no loading screen. Every call to Herald (wake word, `/`, typing, the hairline, or any Speak/Ask/Unlock button) plays a ~1.2s reveal inside the Council. The chamber unrolls from the hairline, a wall of illustrative telemetry is sliced by a white voice wave and collapses, then “Why read the numbers when you can ask the Herald?” resolves while the astrolabe assembles. Any key, click or scroll fast-forwards; the command line has focus from the first frame, so the key you press still lands there, and Escape still dismisses. With Voice on, Herald greets by time of day (“Good afternoon. The Herald is listening.”) unless the call already carries a question. Reduced motion opens the Council directly. Modules: `CouncilReveal.tsx` / `reveal.css`, `lib/councilReveal.ts`.


## Portfolio source update

`src/lib/portfolioData.ts` contains the owner-provided content: ImmunoNet, Distributed RAG Note Platform, SibylKV, FAERS Pharmacovigilance Dashboard, GoLlama, and Job Intelligence Agent. Project source links and statuses appear in the exhibition and decrees; all six identifiers route through the Council and astrolabe. The ledger includes Shaligram Infotech, VNurture Technologies, GWU and GTU education. Contacts and project sources remain editable.

Source distinctions are intentional: ImmunoNet’s 0.896 macro-F1 is held-out source evaluation, while 0.439 is pseudo-labelled cross-technology evaluation; SibylKV has no benchmark results yet; RAG personal implementation is separated from team AWS design; FAERS uses reports, not patients, and PRR-inspired scoring. No external clinical validation, independent verification, or novel speedup claim is implied. Detailed source audit and verification are recorded in `docs/superpowers/progress-portfolio-content.md`.


## Interactive archival edition

The header now uses archival location/education metadata and a zero-button acoustic hairline. Say “Hey” after opting into the wake listener, press `/`, type a letter, or interact with the hairline to summon the Council. The hero appears immediately; the 1.2-second Résumé Implosion runs inside the Council only.

Six project exhibitions have dedicated SVG/GSAP system studies: ImmunoNet alignment, RAG socket recovery and separate AWS design, SibylKV union gather, FAERS funnel/PCA/network, GoLlama worker authentication, and Job Intelligence email/calendar/preparation flow. All are illustrative, with reduced-motion states. Editing a project’s evidence replaces its original dedicated diagram with the current stack inventory.

Career chapters, project-proven skills, familiar tools, and research interests are distinct. The identity editor persists these fields. Raven summaries include questions, answers, unlocked lessons and source links.

Verification resumed at the user’s request: automated suite and production build pass; browser checks cover all six exhibits, replay controls, Council keyboard entry, theme/lens changes, editor fields and a 390px layout. Live microphone recognition still requires a human voice/permission check. No universal frame-rate measurement is claimed.


## Detailed project concepts

Each project includes source-grounded concept notes in the exhibition and architecture decree, with an in-page index and individual concept narration. All 25 sections can be edited in Customize Identity and persist with the profile. Herald answers specific concept follow-ups using the current saved explanation. The project copy removes team/lead claims; Shaligram experience is preserved verbatim.


## ImmunoNet playable Three.js chamber

Open Project 01 to enter the lazy-loaded chamber. `src/three/ThreeHost.tsx` owns its WebGL2 renderer, DPR cap, animation loop, visibility/resize lifecycle, context-loss fallback, and cleanup. `immunoEngine.ts` owns particle/velocity ping-pong targets, curl-noise simulation, background refraction pass, slice-linked driver halos, picking and camera damping. Float and half-float paths use actual framebuffer/render/read-back probes. Software GL and unsupported floating attachments use two InstancedMesh spring buffers; browsers without WebGL2 receive an accessible static schematic.

The bottom dock controls raw/standardized targets, the keyboard/pointer GeneAttention slicer and a narrated walkthrough. The inspector supports direct selection, arrow buttons and cell numbers. Reduced motion settles positions and disables the continuous loop and automatic tour progression.

All 10,000 cell coordinates and four marker-weight bars are illustrative. Paper metrics and dataset accessions are separate pinned evidence. The +0.018 comparison refers to the preprocessing bundle, not an isolated causal effect of the animation. `FIGURE_SLOTS` in `immunoModel.ts` accepts original UMAP/attention image paths with source captions; these slots intentionally remain unpopulated until original exports are provided.
