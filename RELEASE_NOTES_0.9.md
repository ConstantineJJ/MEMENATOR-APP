# MEMENATOR 0.9 Beta

Version: `0.9.0-beta.1`

This is the first consolidated beta baseline for MEMENATOR.

## Included

- Gemini-powered meme caption generation with multiple humor styles and stronger anti-repeat curation.
- Gemini meme-image generation with server-side API handling and local fallback behavior.
- Random internet meme feed with provider aggregation, metadata deduplication and perceptual-hash duplicate detection.
- Editable meme history, favorites, autosave, restore and IndexedDB-backed large-image persistence.
- Crop/zoom, composition analysis, canvas guides, text styling, stickers and high-quality export.
- Russian/English UI switching and persisted Dark/Light appearance preferences.
- Server-side image proxy hardening and quota/error handling.
- Modularized server/client structure and permanent GitHub CI.
- Full TypeScript `strict` mode plus `noUncheckedIndexedAccess` hardening.

## Beta quality gate

The release branch must pass all of the following before becoming `main`:

- TypeScript typecheck
- Automated tests
- Production build

## Branch policy

`hardening/no-unchecked-indexed-access` is the canonical source for 0.9 Beta. Older review/bugfix branches predate newer localization and product changes; their useful fixes have been incorporated into the consolidated line and they must not be merged back literally.
