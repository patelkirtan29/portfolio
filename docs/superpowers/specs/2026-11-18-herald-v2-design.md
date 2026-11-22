# Herald Monochrome Exhibition — Design

## Intent
Implement the user's revised attached product brief in the existing Herald React/Vite project. Visitors discover the owner through a voice-capable doorman, four audience chapters, four project artifacts, a career ledger and contextual conversation. Owner identity and project content can be customized in-browser without code. Supersedes the earlier brass/parchment landing design.

## Approaches
Keep and refactor the current React/Vite implementation: preserves the tested graphics fallback and modal/Lenis fixes while replacing content and layout. A parallel separate app would duplicate state and maintenance; a backend is unnecessary because the revised brief explicitly selects browser speech and a scripted conversation engine. Use the existing project as the implementation target. The user's latest request authorizes this revision and earlier parallel-helper preference remains in force.

## Visual and interaction design
Light default: #FAFAFA paper, #F2F2F2/#E7E7E7 surfaces, #0A0A0A ink, #525252 secondary, rgba(10,10,10,.12) lines. Dark: #090909, #121212/#1B1B1B, #F5F5F5, #A3A3A3, rgba(245,245,245,.14). No brass, colored dots, pill metadata, watermark text, thick left borders or boxed photo captions. Cormorant Garamond 600/700 for display, DM Sans 16–17px body at 1.55, DM Mono with tabular numerals for telemetry.

64px fixed three-zone header: Herald / Doorman · Chapters · Artifacts · Ledger / Speak with Herald. Theme, opt-in global voice and Customize Identity controls live in hero utilities and footer. Narrow screens retain usable navigation through a compact single-line treatment.

Sections:
1. Full-height split doorman, exact headline and core philosophy, Speak and Enter Exhibition buttons, utility strip, monochrome spring-damped crest, four lens pitches which optionally speak on selection. WebGL2 particles plus contours respond to pointer velocity, scroll and shared speaking state. DPR <=2 and static fallback.
2. Four pinned documentary chapters with monochrome procedural editorial artwork, depth parallax, clip-path wipes, optical blur and continuous edge progress. The existing fully horizontal sliding track is replaced. Gradient scrim protects text. Small screen/reduced motion uses normal document flow and static graphics. Four chapter jump buttons.
3. Asymmetric four-artifact gallery: index, tactile visual and unboxed category/year/metric metadata. Click opens native modal with problem, architecture, outcomes and stack; explicit narration with live waveform. Vault starts locked per artifact. Unlock via Herald routes to the drawer with a project question, or a visitor asks about that specific artifact. Notes then become readable in both dialogue and exhibition. Vault is an interaction reveal, not security or private storage.
4. Hairline career ledger (editable roles, dates, outcomes and capabilities), plus spoken sample player with boundary-driven captions and animated waveform, plus Canvas wire sphere. Performance telemetry is labeled as design targets; grounded means answers come from saved profile, not externally verified claims.
5. Persona studio: Measured & Regal / Sharp & Technical / Warm & Candid plus Engineering / Product & Design / Leadership. Live opening preview and global shared speech controls. 420px native conversation chamber, text and speech, three suggestions, artifact evidence actions and shared vault unlock state. Waveform ring follows actual synthesis state. A separate native identity editor is opened only after closing other modals; Escape/backdrop, focus restoration and wheel isolation retained.

## Data architecture
One typed profile: owner name, role, location/availability, bio, four lens pitches, four artifacts, career ledger. Four seeded fictional engineering/design examples clearly marked as sample data. Profile edits immediately update every page section, spoken narration and subsequent responses; stale transcript history can be reset on profile save to avoid presenting old identity as current. Stable artifact IDs survive renaming. Structured localStorage schema/version, validation and bounded string lengths; corrupt/unavailable storage falls back safely and informs user. Persist profile and theme; keep conversation and vault unlocks session-local. No credentials, backend, hosting or authentication.

Conversation is deterministic, grounded in current profile. Recognize current artifact names, Artifact 01–04, synonyms, career/availability, and follow-ups with previous artifact/topic. Unknown questions explicitly admit limits. Answer returns text, evidence artifact ID and optional unlock ID. No invented post-edit statistics. Voice is opt-in and shared across components; explicit Play actions work regardless of automatic voice setting. Central synthesis hook owns cancellation and callbacks to prevent old utterances changing newer playback state. Recognition errors fall back to text. Captions use speech boundary events, with full script retained if unsupported.

## Verification
TDD for profile validation/persistence, renamed-project recognition, per-artifact unlock, contextual follow-ups, current owner facts, unknown inputs and speech lifecycle cancellation. Preserve graphics context-loss tests. Production TypeScript/build and all tests. Browser QA desktop/mobile: both themes, gallery modal, narration states, unlock through chat then reopen artifact, editing profile then reload, persona/lens propagation, modal Escape/focus/wheel behavior, no horizontal overflow. Do not grant microphone permission as part of unattended testing; report hardware limits.

## Builder choices
Refactor module seams rather than patching the old static strings. Reuse procedural monochrome artwork so no third-party asset dependency is required. No private information is protected by the client-side vault. Seeded outcomes remain clearly illustrative until owner edits them. Local-only changes, no deployment.
