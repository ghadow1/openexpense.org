# OCR performance and source tags

OpenExpense scans receipts entirely in the browser. The OCR path is designed to use current mobile and desktop browser capabilities while keeping the app private, reviewable, and responsive.

## Source tags

Use these tags in comments when changing OCR or platform-sensitive code. They make the intent searchable without requiring broad refactors.

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | OCR, PDF, WASM, and import-map dependency pins. |
| `@ocr-engine` | OCR engine lifecycle, model warmup, and recognition calls. |
| `@ocr-pdf` | PDF text extraction, PDF.js worker setup, and preview rendering. |
| `@ocr-pipeline` | File decode, canvas sizing, image normalization, and OCR routing. |
| `@ocr-parse` | Merchant, amount, date, tax, and item inference heuristics. |
| `@ocr-ui` | Progress UI, review sheet, confidence messaging, and scan actions. |
| `@platform` | Mobile, desktop, and browser feature decisions. |
| `@perf` | Performance-sensitive work such as warmup, decode, canvas memory, and bundle output. |

## Pipeline overview

1. The scan input accepts photos, common image formats, HEIC/HEIF, and PDFs.
2. PDFs try native text extraction first. If enough text is present, the app skips raster OCR.
3. Image files prefer `createImageBitmap()` for modern decode paths, then fall back to `Image`.
4. Canvas dimensions are bounded by `OCR_CONFIG.canvas` so OCR gets enough pixels without exhausting mobile memory.
5. The OCR engine is lazy-loaded only when needed and may be warmed during idle time on capable devices.
6. Parsed fields are always shown in a review sheet before anything is saved to the encrypted ledger.

## Cross-platform performance notes

- **Mobile cameras:** `Utils.prefersCamera()` adds `capture="environment"` on touch/coarse-pointer layouts so phones can open the rear camera directly.
- **Low-resource sessions:** `Utils.shouldWarmOcr()` skips idle OCR warmup when Data Saver is enabled, the network is 2G-class, or reported device memory is below the configured threshold. Manual scanning still loads OCR on demand.
- **Desktop browsers:** capable desktop sessions can warm the OCR engine in `requestIdleCallback`, improving first-scan latency without blocking startup.
- **PDFs:** PDF.js runs through a worker URL and native text extraction is preferred because it is faster and more accurate than OCR for digital invoices.
- **Preview memory:** PDF previews use blob-backed object URLs when supported, avoiding large base64 data URLs in memory.
- **Build output:** `npm run build` removes old `app.js` and `chunk-*.js` assets before esbuild emits the current deploy bundle.

## Dependency ownership

`OCR_CONFIG.dependencies` in `src/config.js` is the source of truth for OCR and PDF URLs used by JavaScript. The peer dependency import map in `index.html` must stay aligned with `OCR_CONFIG.dependencies.peerImports` because the OCR package imports those modules by bare specifier at runtime.

## Safe improvement checklist

- Keep all scanning and parsing local to the browser. Do not add hosted OCR or telemetry.
- Keep parsed fields reviewable; scanning should never auto-save an expense.
- Prefer feature detection over user-agent checks.
- Bound canvas sizes before OCR and preview work.
- Update this document when adding a new `@ocr-*`, `@platform`, or `@perf` seam.
