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
- [x] Split oversized `server.ts`, `MemeCanvas.tsx`, and `App.tsx` into focused modules without changing the main product flow. `App.tsx` delegates stateful concerns to dedicated hooks; `MemeCanvas` delegates toolbar/export/guides; and the former ~98 KB `server.ts` is now a small bootstrap that registers modular web-meme, magic-caption, composition and image-template routes plus shared Gemini utilities.
- [x] Deduplicate shared AI style configuration between the compact panel and full caption modal.
- [x] Enable full TypeScript `strict` mode. React/ReactDOM declarations are explicit dev dependencies, `noImplicitAny` exposed and fixed the untyped composition fallback, `strictNullChecks` passed cleanly, and the final consolidated `strict: true` configuration passes CI.
- [ ] Prepare for `noUncheckedIndexedAccess` as an extra hardening step beyond `strict`. A diagnostic pass found unchecked array/record lookups in the aggregator, App defaults, fallback caption tables, canvas helpers, perceptual hash/sticker rendering and a few tests; keep this separate so `main` stays green while those guards are tightened deliberately.
- [x] Add permanent read-only typecheck/build CI safety net.
- [x] Add initial automated tests to the CI safety net; aggregator, perceptual hash, caption curation and humor-prompt variety now have coverage.
- [x] Read `PORT` from the environment.
- [x] Replace visible-feed title/filename pseudo-signatures with a real pixel-based 64-bit dHash pass. The client now requests a wider candidate pool, hashes actual thumbnail pixels with bounded concurrency, rejects near-duplicates using Hamming distance against both the current batch and recently shown memes, stores `dhash:` signatures for future refreshes, and falls back to existing provider metadata dedupe only when pixel hashing is unavailable.
- [x] Add a client-side caption curation layer: the UI presents only 3 suggestions, rewards different humor mechanics, penalizes near-duplicates/recent ideas, and applies a fatigue penalty to exhausted Millennials references.

## Product-quality backlog after structural fixes
- [x] Rewrite and diversify backend humor-style prompts. Each style now has a broad domain pool, explicit anti-cliches and image-grounding rules; Millennials cover courtyard life, school, analog media, early PCs/internet, shopping, family life and present-day adulthood instead of revolving around a tiny nostalgia checklist.
- [x] Change the backend generation contract from five candidates to exactly three stronger finalists. The prompt asks the model to silently brainstorm at least nine angles, self-filter them, and return only the best three.
- [x] Add style-level variety rules and cross-generation anti-repeat feedback. Recent caption ideas are sent back to the server per style; final variants must use different mechanics and substantially different premises, with extra domain rotation rules for Millennials.
- [x] Add AI Meme Image Generation section (`ImageGenerationPanel`, `ImageGenerationModal`, `useImageGeneration` hook, `/api/generate-template-image` route). Users can generate new meme visuals either by text description, or by 1-click using suggested humor styles and magic caption punchlines from the right panel. Includes quota-safe local gallery storage (capped at 6 items), aspect ratio controls (1:1, 16:9, 9:16, 4:3), and direct application to the meme canvas.

## Verification rule
For each non-trivial code pass: run TypeScript typecheck, automated tests, and production build before marking the item complete. Keep verification workflows read-only; do not use self-modifying GitHub Actions workflows.
