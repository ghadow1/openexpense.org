# OCR performance and code tags

OpenExpense receipt scanning runs entirely in the browser. The goal is to use
modern mobile and desktop browser capabilities where they are available, while
keeping fallbacks readable and privacy-preserving.

## Human-readable tags

Use these searchable tags in comments when touching OCR or platform-sensitive
code:

- `@ocr-deps` - CDN, import-map, worker, and peer dependency pins.
- `@ocr-engine` - OCR service loading, warmup, and model lifecycle.
- `@ocr-pdf` - PDF text extraction, worker setup, and first-page rendering.
- `@ocr-pipeline` - image decoding, canvas normalization, OCR execution, and
  text normalization.
- `@ocr-parse` - merchant, amount, date, tax, and item inference.
- `@platform` - mobile/desktop browser capability checks and fallbacks.
- `@perf` - choices that trade memory, startup latency, or network use.

Keep tags near the decision they describe. They are meant to make review and
search faster, not to replace clear function names.

## Dependency map

`src/config.js` owns the OCR dependency URLs in `OCR_CONFIG.dependencies`.
`index.html` owns the import map required by the lazy-loaded OCR package. Keep
those two locations in sync whenever bumping OCR packages:

- `ppu-paddle-ocr` provides the browser OCR service.
- `onnxruntime-web` is the model runtime peer dependency.
- `ppu-ocv/canvas-web` provides OpenCV canvas helpers for the OCR package.
- `pdfjs-dist` parses PDF text and renders the first page when OCR is needed.

The app should continue to lazy-load these resources. The calendar and ledger
views must remain usable without downloading OCR packages.

## Cross-platform behavior

- Camera-oriented devices get `capture="environment"` when choosing a receipt.
- Image decoding prefers `createImageBitmap()` with EXIF orientation handling,
  then falls back to `HTMLImageElement` for older Safari and embedded WebViews.
- PDFs try native text extraction first. When enough embedded text is present,
  OCR is skipped and only the review sheet is shown.
- Canvas inputs are normalized between configured minimum and maximum sides so
  OCR has enough pixels without exhausting memory on mobile devices.
- Preview images prefer blob-backed object URLs to avoid large base64 strings;
  data URLs remain the fallback for browsers without `toBlob()`.
- Idle OCR warmup runs only when platform hints indicate it is reasonable:
  data-saver, 2G-class, and low-memory sessions load OCR on demand instead.

## Validation checklist

Before shipping OCR changes:

1. Run `npm run build`.
2. Run `npm run validate`.
3. Run `npm audit --audit-level=moderate`.
4. Run `git diff --check HEAD`.
5. Smoke-test receipt scanning with at least one image and one PDF when a
   browser is available.

Generated `app.js` and `chunk-*.js` files are committed for GitHub Pages. The
build cleans old generated chunks before writing the current bundle.
