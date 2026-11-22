# Council Summon Reveal — change ledger (2026-11-19)

Originals of every modified or deleted file are in `original/` (same relative paths), copied before any edit.
Run commands from the project root: `/Users/kirtan/Projects/herald-gemini-demo/herald`.

## Undo everything
```sh
R=docs/superpowers/rollback/2026-11-19-council-reveal
cp -R $R/original/src/. src/ && cp $R/original/README.md README.md
rm src/lib/councilReveal.ts src/lib/councilReveal.test.ts src/components/CouncilReveal.tsx src/components/reveal.css
npm run build   # regenerate dist/
```

## File by file
| File | Change | What changed | Undo just this |
|---|---|---|---|
| `src/lib/councilReveal.ts` | created | Reveal timing (300/600/1200ms), quote, `welcomeLine(hour)`, `shouldWelcome(...)`, `createCouncilReveal` | `rm` it |
| `src/lib/councilReveal.test.ts` | created | 7 tests: settle once, skip, dispose, reduced motion, greeting by hour, quote, welcome guard | `rm` it |
| `src/components/CouncilReveal.tsx` | created | Canvas: chamber unrolls from hairline, telemetry wall, white slice wave, collapse; DOM quote | `rm` it |
| `src/components/reveal.css` | created | Overlay layer, transparent chamber during reveal, HUD + decree hidden and untappable until settle, quote timing, reduced-motion hide | `rm` it |
| `src/components/ConversationDrawer.tsx` | modified | Starts a reveal on every open, skip on key/pointer/wheel/touch (not Escape), welcome on settle (not while dictating/listening/typing/asking), `assembleFrom` to astrolabe, hint text → “Hold Space to speak/interrupt · ESC to dismiss” | `cp $R/original/src/components/ConversationDrawer.tsx src/components/` |
| `src/components/CouncilAstrolabe.tsx` | modified | Optional `assembleFrom` prop: rings/nodes converge and lock 600–1100ms, lock pulse | `cp $R/original/src/components/CouncilAstrolabe.tsx src/components/` |
| `src/components/drawer.css` | modified | Removed the old `council-part` open animation from `.council-hud[open]` | `cp $R/original/src/components/drawer.css src/components/` |
| `src/App.tsx` | modified | Removed page-load opener: imports, `useOpeningSequence`, inert/aria-hidden wrapper, opening checks in lock and summon keys | `cp $R/original/src/App.tsx src/` |
| `src/lib/councilMicController.ts` | modified | Wake word “Hey” → “Herald” / “Hey Herald” anywhere; “Harold”/“Herold” only at the start of an utterance; “Herald’s” ignored | `cp $R/original/src/lib/councilMicController.ts src/lib/` |
| `src/lib/councilMicController.test.ts` | modified | Wake tests updated for “Herald”, incl. mid-sentence “Harold” not waking | `cp $R/original/src/lib/councilMicController.test.ts src/lib/` |
| `src/components/AcousticHairline.tsx` | modified | Caption “Say ‘Hey’…” → “Say ‘Herald’…” | `cp $R/original/src/components/AcousticHairline.tsx src/components/` |
| `README.md` | modified | Wake-word sentence; new “Summon Reveal” section | `cp $R/original/README.md .` |
| `src/components/OpeningSequence.tsx` | deleted | Old page-load opener | `cp $R/original/src/components/OpeningSequence.tsx src/components/` |
| `src/components/opening.css` | deleted | Its styles | `cp $R/original/src/components/opening.css src/components/` |
| `src/lib/openingSequence.ts` / `.test.ts` | deleted | Its session/timer controller + tests | `cp $R/original/src/lib/openingSequence*.ts src/lib/` |
| `src/lib/useOpeningSequence.ts` | deleted | Its hook | `cp $R/original/src/lib/useOpeningSequence.ts src/lib/` |
| `dist/` | rebuilt | `vite build` output (regenerable, not snapshotted) | `npm run build` |
| `docs/superpowers/specs/2026-11-19-council-summon-reveal-design.md`, `docs/superpowers/plans/2026-11-19-council-summon-reveal.md` | created | Design + plan | `rm` them |

Note: restoring `App.tsx` alone brings back the page-load opener only if the four deleted opener files are restored too.

Execution ledger (rulings, review findings, deferred minors): `progress-ledger.md` in this folder.
