# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. Photos, PDFs, and OCR output
stay on the device; the scanner only suggests fields that the user reviews before
saving.

## Human-readable tags

Search these tags when changing OCR, platform, or performance behavior:

- `@ocr-deps` - CDN packages, import maps, and peer dependency pins.
- `@ocr-engine` - OCR engine initialization and warmup behavior.
- `@ocr-pdf` - PDF.js loading, native PDF text extraction, and PDF previews.
- `@ocr-pipeline` - image normalization before recognition.
- `@ocr-parse` - receipt text parsing and field suggestion heuristics.
- `@platform` - mobile, desktop, touch, camera, and browser capability decisions.
- `@perf` - bandwidth, memory, lazy-loading, and render-size tradeoffs.

## Dependency surface

The OCR dependency source of truth is `OCR_CONFIG` in `src/config.js`.

- `ppu-paddle-ocr` provides PP-OCR receipt recognition.
- `pdfjs-dist` extracts embedded text from PDFs before falling back to OCR.
- `onnxruntime-web` and `ppu-ocv/canvas-web` are import-map peer dependencies in
  `index.html`; keep them synchronized with `OCR_CONFIG.dependencies.peerImports`.

OCR and PDF modules are lazy-loaded. The base app remains small for users who
only log expenses manually.

## Cross-platform policy

Desktop-class browsers may preload OCR during idle time so the first scan feels
faster. Mobile, low-memory, data-saver, and 2G-class sessions skip idle warmup
and load OCR only when the user scans. This keeps the calendar responsive and
prevents surprise model downloads on constrained devices.

Images use `createImageBitmap()` when the browser supports it, with an
`Image`-element fallback for older engines and unusual file formats. Large camera
photos are capped before OCR to protect memory, while tiny screenshots are scaled
up enough for the recognizer.

## PDF flow

PDFs are handled in two phases:

1. Extract native text from every page with PDF.js.
2. Render the first page for preview and OCR fallback.

If native text meets the configured threshold, OCR is skipped. This improves
desktop invoice handling and avoids model work when a PDF already contains usable
text.

## Build notes

Run `npm run build` after changing anything in `src/`; the build cleans old
`app.js` and `chunk-*.js` assets before emitting the GitHub Pages bundle.
Run `npm run validate` for the same production build check used by automation.
