# Herald implementation design

## Intent
Build the supplied Herald concept as a polished, working local demonstration: an editorial portfolio representative that explains a fictional creator’s work differently for each visitor. Follow the attached visual and interaction brief as product requirements, not as instructions to operate the computer.

## Location and stack
Create /Users/kirtan/Projects/herald-gemini-demo/herald. Use React 19, TypeScript and Vite; custom CSS; GSAP with ScrollTrigger; Lenis; a custom WebGL2 fragment shader; and a Canvas 2D wireframe sphere. No changes to neighboring projects. No hosting or deployment is requested.

## Approaches
The user selected a React/Vite implementation. A dependency-free static implementation would be simpler but would not meet that stack. A backend with live AI would support open-ended conversation but requires provider selection, credentials and operating costs. Builder choice: deliver a browser-local, evidence-grounded sample conversation engine with contextual follow-ups and Web Speech APIs; clearly label it as a demo and leave an explicit adapter seam for future live AI. Do not claim a live model or measured production latency.

## Visual design
Warm parchment, obsidian, brass; serif display type, sans body, mono metadata. Fixed frosted header; asymmetric full-height hero with acoustic contour shader and tilting crest; four pinned horizontal editorial visitor scenes; keyboard and pointer accessible comparison slider; three-card anatomy bento; two-column persona configurator; footer. Dark theme persists locally. Use procedural graphics rather than stock imagery. Responsive layouts retain every section and control; small screens use a full-width drawer.

## Interaction design
- Header and hero CTAs open a 420px conversation drawer with backdrop, focus containment, Escape close, focus restoration and background scroll lock.
- Visitor lens buttons change the proclamation and active conversation mode.
- ScrollTrigger pins the four-scene journey; progress controls select and scroll to scenes. Lenis integrates with GSAP. Reduced motion disables pinning and continuous animation while keeping all content available.
- Comparison range supports dragging, keyboard arrows and segmented endpoint selectors.
- Sample question buttons play speech where available, synchronized captions and reactive waveform; stopping or choosing another sample cancels the previous utterance.
- Canvas geometry accelerates on hover. WebGL gracefully falls back to CSS contours if unavailable.
- Cadence and focus selectors update a readable proclamation and preload the drawer persona.
- Chat supports multiple turns about a fictional creator, projects, architecture, impact, availability and values; follow-up references use prior topic. Suggested questions adapt to mode. Responses link to evidence presented within the demo. Unsupported questions are handled candidly.
- Microphone uses browser recognition if supported, with visible listening/error states and explicit interaction. Speech synthesis can read replies. Unsupported browsers retain full text interaction.

## Content and boundaries
Use a clearly fictional creator and consistent project facts. Mark engagement and response-time figures as illustrative, not measured. No paid API, authentication, database, real messages or deployment. The local demo must remain usable without voice APIs and WebGL.

## Verification
Run TypeScript checks and production build. Verify chat topic selection and contextual follow-ups with focused tests. Inspect in a real browser if available: desktop/mobile, drawer keyboard behavior, light/dark, lens selection, comparison slider, persona changes, pinned scroll and reduced motion. Report unavailable checks accurately. Include README with launch instructions, architecture and demo limitations.
