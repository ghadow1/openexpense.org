# OCR and platform performance notes

OpenExpense runs receipt OCR entirely in the browser. The goal is to use current
mobile and desktop browser capabilities without turning normal ledger use into a
heavy startup path.

## Human-readable source tags

Search these tags when changing receipt scanning:

- `@ocr-deps` - CDN and import-map pins for the OCR engine, PDF.js, ONNX runtime,
  and OpenCV canvas peer dependency.
- `@ocr-engine` - lazy initialization, model warmup, and canvas recognition.
- `@ocr-pdf` - PDF text extraction and scanned-PDF rendering.
- `@ocr-pipeline` - file-to-canvas, native text short-circuiting, and preview
  generation.
- `@ocr-parse` - receipt text normalization and field extraction heuristics.
- `@platform` - browser capability checks for mobile, desktop, and fallback APIs.
- `@perf` - logic that limits CPU, memory, bandwidth, or main-thread work.

## Dependency pins

`src/config.js` owns the OCR dependency versions in `OCR_CONFIG.dependencies`.
`index.html` owns the import map required by `ppu-paddle-ocr` peer dependencies.
Keep both in sync when upgrading:

1. Check current npm versions for `ppu-paddle-ocr`, `pdfjs-dist`,
   `onnxruntime-web`, and `ppu-ocv`.
2. Update `OCR_CONFIG.dependencies`.
3. Update the matching import-map URLs in `index.html`.
4. Run `npm run validate` and commit the regenerated `app.js`/`chunk-*.js`
   assets with the source change.

## Runtime behavior

- The OCR engine lazy-loads on the first scan. Startup warmup is only scheduled
  when browser hints do not show data saver, 2G-class network, or low device
  memory.
- Images prefer `createImageBitmap()` for modern browsers because it can decode
  away from the main thread. The app falls back to `Image` for Safari and older
  browsers.
- Large image and PDF canvases are bounded before OCR to keep memory predictable
  on phones while still giving desktop browsers enough pixels for accurate text.
- PDFs with enough native text skip OCR and go straight to parsing, which is
  faster and more accurate for invoices generated from accounting systems.
- Preview images use blob-backed object URLs where possible, avoiding large
  base64 strings in memory.

## Privacy and platform constraints

Receipt images, PDFs, OCR text, and parsed fields stay in the browser. The CDN is
used only to fetch static OCR/PDF code and models; uploaded receipt data is never
sent to a server by this app.

Keep OCR changes progressive: new APIs should improve capable devices while
retaining a fallback path for mobile Safari, Chromium-based Android browsers,
desktop Chrome/Edge, Firefox, and installable PWA contexts.
