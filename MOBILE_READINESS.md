# MEMENATOR 0.9 — Mobile Readiness Baseline

This document freezes the product scope while the responsive pass is validated. The same React components and state model are used across all layouts; mobile/tablet variants change placement, scrolling, touch ergonomics and modal behavior rather than duplicating the application.

## Implemented preflight

- [x] English-first static HTML/OG metadata; runtime RU/EN switching remains intact.
- [x] `viewport-fit=cover` and safe-area variables for notched phones/tablets.
- [x] Working-image memory guard: long side is capped at 3072 px on coarse/small devices and 4096 px on desktop before uploaded camera photos enter editable history/canvas state.
- [x] Five named responsive layout profiles: `phone-portrait`, `phone-landscape`, `tablet-portrait`, `tablet-landscape`, `desktop`.
- [x] Shared-component responsive shell; no duplicated phone/tablet application trees.
- [x] Coarse-pointer ergonomics and enlarged invisible hit areas for text/sticker resize/delete handles and crop-corner handles.
- [x] Full-screen phone dialogs using dynamic viewport height (`100dvh`), safe areas and contained scrolling.
- [x] Tablet dialog max-height based on dynamic viewport and safe areas.
- [x] Phone text inputs use a 16 px floor to avoid iOS focus zoom and reserve scroll margin for the software keyboard.
- [x] Reduced-motion accessibility fallback.
- [x] Automated tests cover layout-profile boundaries and working-image resize math.

## Product freeze until mobile QA PASS

Do not add new major features while this baseline is being validated. In particular:

- do not redesign AI caption generation;
- do not change image-generation API/billing behavior;
- do not introduce another storage migration;
- do not duplicate desktop components for mobile;
- do not alter desktop canvas/export semantics unless a regression is found.

Bug fixes, accessibility fixes and responsive corrections are allowed.

## Manual QA matrix

### Phone portrait — reference 390×844
- editor/canvas appears before support panels;
- AI suggestions follow the editor;
- random memes/history/image generator remain reachable below;
- header preference controls do not cover the MEMENATOR wordmark;
- text and sticker drag/resize work with one finger;
- page scroll remains possible outside the active canvas;
- modal inputs remain visible while the software keyboard is open.

### Phone landscape — reference 844×390
- workspace and AI panel share the first viewport;
- no horizontal page overflow;
- auxiliary left-column panels appear below as three shared cards;
- canvas controls remain reachable with touch.

### Tablet portrait — reference 768×1024
- workspace remains primary and large enough for touch editing;
- AI panel and auxiliary panels follow without duplicated UI;
- dialogs fit within dynamic viewport and scroll internally.

### Tablet landscape — reference 1024×768
- desktop-light two-column workspace/AI layout is used;
- random/history/image-generation panels remain available below;
- no desktop-only fixed-height clipping occurs.

### Desktop regression — reference 1440×900 or larger
- original 3/6/3 studio layout remains unchanged;
- drag/resize/export/undo/redo/history/favorites still behave as in MEMENATOR 0.9 Beta.

### Memory / upload
- upload a 4032×3024 or larger camera photo on mobile;
- verify editing remains responsive and browser tab is not killed;
- verify exported composition remains visually correct after downscale;
- verify small images are not needlessly re-encoded.

## PASS rule

Mobile readiness is considered PASS only when TypeScript, automated tests and production build are green **and** the manual QA matrix above has been visually confirmed on representative phone/tablet viewports or devices.
