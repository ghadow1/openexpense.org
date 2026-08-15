# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR path is designed to
stay private, keep normal ledger interactions light, and still use modern
browser capabilities on mobile and desktop when a scan begins.

## Human-readable source tags

Use these short tags in comments when touching cross-cutting OCR or platform
code. They make intent searchable without adding heavyweight architecture docs
inside every file.

- `@ocr-deps` - CDN/import-map pins and OCR/PDF dependency upgrade notes.
- `@ocr-engine` - Paddle OCR service loading, model initialization, and warmup.
- `@ocr-pdf` - PDF.js loading, native PDF text extraction, and PDF previews.
- `@ocr-pipeline` - Image/PDF normalization before recognition.
- `@ocr-parse` - Merchant, amount, date, tax, and line-item parsing.
- `@ocr-ui` - Scan controls, progress, preview, and review interactions.
- `@platform` - Browser/device capability checks and cross-platform fallbacks.
- `@perf` - Runtime, memory, bundle, or network performance decisions.
- `@privacy` - Local-only processing, storage, and data exposure boundaries.

## Dependency and build boundaries

- `src/config.js` owns `OCR_CONFIG`, including OCR/PDF CDN pins, peer import-map
  URLs, canvas thresholds, and warmup gates.
- `index.html` owns the import map for bare OCR peer dependencies. Keep it in
  sync with `OCR_CONFIG.dependencies.peerImports` when upgrading packages.
- OCR and PDF libraries are lazy-loaded. The initial application bundle should
  remain focused on ledger UI and storage.
- `npm run build` deletes old generated root bundles before esbuild emits
  `app.js` and `chunk-*.js`, avoiding stale GitHub Pages assets.

## Mobile and desktop performance choices

- Idle OCR warmup is skipped on data-saver, 2G-class connections, and low-memory
  devices. Users can still scan; OCR loads on demand.
- Scan controls also warm on pointer, touch, and focus intent. This helps
  desktop hover/focus and mobile tap flows without forcing preload at boot.
- Image decoding prefers `createImageBitmap()` with EXIF-aware orientation where
  the browser supports it, then falls back to an `Image` element for formats or
  engines that reject bitmap decoding.
- OCR canvas input is normalized to `OCR_CONFIG.image.minOcrSide` and
  `maxOcrSide`. This avoids tiny unreadable inputs and caps memory for large
  mobile camera photos.
- PDF invoices are checked for native text first. If enough text is present,
  OpenExpense skips OCR and only renders a preview for review.
- PDF previews prefer blob-backed object URLs, falling back to data URLs only
  when `canvas.toBlob()` is unavailable.

## Privacy invariants

- Receipt images, PDFs, OCR text, and parsed suggestions stay in the current
  browser session.
- Scanning never uploads content to a server. CDN requests fetch code/models
  only; user files are not transmitted.
- Parsed receipt fields are suggestions. The user reviews and confirms before
  anything is written to the encrypted ledger.
