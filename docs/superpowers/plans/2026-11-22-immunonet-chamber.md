# ImmunoNet Playable Chamber

Implement the supplied specification in the existing Herald application. The existing application has SVG exhibits but no Three.js dependency/host. Establish one reusable ThreeHost lifecycle and mount only the active chamber; preserve all other exhibits and editable content.

- [x] Shared host: renderer ownership, DPR<=2, resize, visibility, context loss, reduced motion, disposal and accessible static fallback.
- [x] Deterministic 10,000-cell illustrative model, six classes, marker descriptors, documented readouts/accessions; no invented measured IG values or UMAP coordinates.
- [x] Engine: actual tested float/half render-target support; software GL uses double-buffer InstancedMesh springs; ping-pong curl advection and optical screen-texture refraction with signed-distance halos.
- [x] UI: mineral pigments in both themes, collapsible pill dock, domain toggle, keyboard/drag slicer, raycast/keyboard inspector, damped guided tour with optional browser narration, provenance/figure slots.
- [x] Verify mathematical/state tests, production build, browser controls and accessible fallback; review resource disposal. Sync requested original folder after coherent integration.

Architecture contracts: src/three/chamberTypes.ts. Engine owns chamber resources and render passes; host owns the renderer and its single animation loop. Static SVG remains the last-resort fallback when WebGL2 is unavailable. Original figures remain explicit empty slots until supplied.

Validation: 154 tests pass. Production build passes. Browser selected Float-FBO and rendered without WebGL/shader warnings. Checked domain toggle, direct cloud picking, keyboard slider and numeric cell selection, walkthrough state/narration, provenance Escape/focus behavior, dock collapse, light/dark themes, 390px width without horizontal overflow, and zero chamber canvases after close / one after reopen. Float-FBO hardware execution was exercised; half-float and instanced routing are covered by model tests and code review, not by separate physical devices. Source figure slots remain empty until original exports are supplied.
