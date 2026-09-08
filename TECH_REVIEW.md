# MEMENATOR Technical Review

Persistent checklist from the 2026-09-08 full repository review. This file is the source of truth for the cleanup pass so the work does not depend on chat memory.

## P0 — critical
- [x] Prevent duplicate Gemini caption requests when changing humor style.
- [x] Harden `/api/proxy-image` against SSRF/open-proxy abuse with host allowlist, redirect validation, timeout, MIME and size checks.
- [x] Fix oversized history thumbnails that were silently re-rendered at 900–1400px.
- [x] Add quota-aware history trimming as an immediate localStorage safeguard.
- [x] Move large editable image history and draft payloads from localStorage to IndexedDB, including safe migration of legacy data.
- [x] Normalize/migrate web favorites and align favorite data types.

## P1 — correctness / quota
- [x] Preserve filter intensity in Download / Copy / history export.
- [x] Fix crop aspect-ratio math for non-square images.
- [x] Fix crop of external images through the safe image proxy.
- [x] Remove duplicate composition-analysis request after crop/reset.
- [x] Detect and pass real image MIME type and dimensions to Gemini.
- [x] Fix web-meme dedupe fallback so unique items are not discarded.
- [x] Return an honest empty search result instead of unrelated random memes.

## P2 — polish / maintainability
- [x] Eliminate the misleading Fill preview/export mismatch. The legacy stretch-based Fill switch is removed; the viewport now always uses proportional Fit, matching the source-aspect-ratio export. A future Cover mode must be implemented together with matching export crop semantics.
- [x] Consolidate canvas/crop pointer and touch interactions with Pointer Events. Text, sticker, sticker-scale, text-scale, crop move and crop resize now share mouse/touch/stylus-compatible pointer handling with pointer cancellation and touch-action safeguards.
- [x] Clean up initial Undo/Redo duplicate snapshot behavior.
- [x] Make autosave status reflect pending vs saved state.
- [x] Label composition fallback as heuristic rather than real AI analysis.
- [x] Improve retry handling for 429 / RESOURCE_EXHAUSTED.
- [x] Remove white sticker backing circles and refresh the programmatic sticker visuals with cleaner shadows, gradients, and transparent shapes.
- [x] Add persisted Russian/English UI switching with a global preference control and safe exact-phrase translation layer that avoids meme canvas/input content.
- [x] Add persisted Dark/Light theme switching while preserving MEMENATOR accent colors.
- [x] Remove the dedicated Filters/Stickers sidebar block from the desktop layout. Existing filter/sticker state remains readable/editable for backward compatibility with saved projects, while the lower-left 40% is intentionally reserved for a future high-value feature.
- [ ] Split oversized `server.ts`, `MemeCanvas.tsx`, and `App.tsx` without changing behavior. Progress: `App.tsx` orchestration is split into dedicated hooks; `MemeCanvas` now delegates toolbar UI to `MemeCanvasToolbar`, export/clipboard work to `useCanvasExport`, and composition/snapping overlays to `CanvasGuides`. The unsafe Fill mode was removed during the split. Next: modularize `server.ts`, beginning with magic-caption prompts/routes so humor quality can be improved without editing the monolithic server entry point.
- [x] Deduplicate shared AI style configuration between the compact panel and full caption modal.
- [ ] Tighten TypeScript settings incrementally. Progress: `strictBindCallApply`, `strictFunctionTypes`, `noImplicitThis`, and `noUncheckedSideEffectImports` are enabled; Vite client declarations added so asset imports remain type-safe.
- [x] Add permanent read-only typecheck/build CI safety net.
- [x] Add initial automated tests to the CI safety net (aggregator normalization/signature coverage); expand coverage as modules are refactored.
- [x] Read `PORT` from the environment.
- [x] Replace visible-feed title/filename pseudo-signatures with a real pixel-based 64-bit dHash pass. The client now requests a wider candidate pool, hashes actual thumbnail pixels with bounded concurrency, rejects near-duplicates using Hamming distance against both the current batch and recently shown memes, stores `dhash:` signatures for future refreshes, and falls back to existing provider metadata dedupe only when pixel hashing is unavailable.
- [x] Add a client-side caption curation layer: the UI now presents only 3 suggestions, scores candidate completeness/relevance metadata, rewards different humor mechanics, penalizes near-duplicates inside the batch, penalizes ideas similar to recently shown captions for the same style, and applies a light fatigue penalty to the most exhausted Millennials references. Automated selector tests are included in CI.

## Product-quality backlog after structural fixes
- [ ] Rewrite and diversify the backend humor-style prompts, especially `millennials`, so examples are treated as a broad inspiration pool rather than a tiny repeated checklist. Explicitly suppress repeated themes such as plantain-on-knee, cassette+pencil, collecting beetles, staying home, and age-30 knee jokes when they were recently used or are not strongly connected to the current image.
- [ ] Change the backend generation contract from five candidates to three deliberately stronger candidates after the server prompt logic is extracted into its own module. The current client already displays only the best 3, but the server still over-generates a wider pool for curation.
- [ ] Add style-level variety rules: rotate domains, eras, social situations, objects, and humor mechanics; avoid repeating the same cultural reference within one response or across consecutive generations.

## Verification rule
For each non-trivial code pass: run TypeScript typecheck, automated tests, and production build before marking the item complete. Keep verification workflows read-only; do not use self-modifying GitHub Actions workflows.
