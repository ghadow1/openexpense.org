# OCR receipt performance and source tags

OpenExpense reads receipts entirely in the browser. The scanner should stay
fast on current mobile devices, predictable on desktop browsers, and easy for
contributors to trace.

## Source tags

Use these tags when changing scanner code so related decisions remain easy to
search:

- `@ocr-deps` - OCR, PDF, and import-map dependency pins.
- `@ocr-engine` - PP-OCR loading, initialization, and warmup.
- `@ocr-pdf` - PDF.js text extraction and PDF rendering.
- `@ocr-pipeline` - image/PDF recognition flow before parsing.
- `@ocr-parse` - merchant, amount, date, tax, and item parsing.
- `@ocr-ui` - review sheet and user confirmation before saving.
- `@platform` - mobile/desktop browser capability branches.
- `@perf` - canvas sizing, memory, network, and startup tradeoffs.

## Dependency pins

The browser import graph is intentionally pinned instead of using floating CDN
URLs. Update the pins together:

1. `OCR_CONFIG.dependencies` in `src/config.js`.
2. The static import map in `index.html` for peer dependencies.
3. This document if behavior or compatibility changes.

Current scanner pins:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`

## Cross-platform performance policy

- Load OCR lazily. The engine downloads on the first scan or idle warmup, never
  during critical startup.
- Gate idle warmup with `Utils.shouldWarmOcr(OCR_CONFIG)`. Data-saver, 2G-class
  connections, and very low-memory Chromium devices skip preload; manual scans
  still work on demand.
- Prefer `createImageBitmap()` for modern mobile and desktop image decoding.
  Fall back to `Image` so Safari and HEIC-related browser paths still have a
  standard decode route.
- Keep OCR canvases between `OCR_CONFIG.canvas.minSide` and
  `OCR_CONFIG.canvas.maxSide`. This protects small receipt text without sending
  oversized phone photos through OCR.
- For PDFs, extract native text first. Only render and OCR the first page when
  the embedded text is not useful enough.
- Use blob-backed preview URLs where possible. This avoids large base64 strings
  for PDF previews and reduces memory pressure on long mobile sessions.

## Privacy invariant

OCR is a convenience layer only. Images, PDFs, recognized text, and parsed
fields stay in the browser, and scanned values are saved only after the user
reviews the receipt sheet and confirms the expense.
