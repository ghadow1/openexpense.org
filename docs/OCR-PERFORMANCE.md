# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR path is designed to
work across current mobile and desktop browsers while keeping startup fast on
lower-resource devices.

## Human-readable source tags

Search these tags when changing OCR, platform behavior, or performance-sensitive
code:

- `@ocr-deps` - CDN/import-map dependencies that must stay in sync.
- `@ocr-engine` - model loading, initialization, and warmup behavior.
- `@ocr-pdf` - PDF text extraction and first-page preview rendering.
- `@ocr-pipeline` - image/PDF preparation and OCR result normalization.
- `@ocr-parse` - merchant, date, amount, tax, and line-item parsing.
- `@ocr-ui` - preview/progress UI and browser object URL handling.
- `@platform` - browser/device capability detection and fallbacks.
- `@perf` - resource thresholds, canvas sizing, and work deferral.

## Dependency sync points

The OCR dependency URLs live in `src/config.js` under `OCR_CONFIG.dependencies`.
The peer import map in `index.html` must match those versions because
`ppu-paddle-ocr` lazy-loads bare imports for `onnxruntime-web` and
`ppu-ocv/canvas-web`.

Current browser-delivered pins:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`
- `@fontsource-variable/inter@5.3.0`
- `@tabler/icons-webfont@3.46.0`

When upgrading, check the package registry, update both `OCR_CONFIG` and
`index.html`, then run `npm run build`.

## Mobile and desktop performance rules

- OCR and PDF support are lazy-loaded. The first manual scan always works as the
  fallback path even when idle warmup is skipped.
- Desktop-class browsers may warm the OCR engine with `requestIdleCallback`.
- Data-saver, `slow-2g`/`2g`, low-memory, and low-core devices skip warmup to
  protect startup responsiveness.
- Images are decoded with `createImageBitmap()` when available, then fall back to
  `HTMLImageElement` for broader mobile browser support.
- Image and PDF canvases are capped by `OCR_CONFIG.image.maxSide` and
  `OCR_CONFIG.image.pdfMaxSide` to bound memory use on high-megapixel photos and
  dense PDFs.
- PDF invoices use embedded text when enough text is available, avoiding OCR for
  searchable documents. OCR is reserved for scanned/image-only PDFs.
- Preview images prefer blob-backed object URLs and fall back to data URLs so
  memory can be released when the review sheet closes.

## Validation checklist

For OCR/platform changes:

1. Run `npm run build`.
2. Scan at least one image receipt and one PDF invoice in a secure browser
   context (`localhost` or HTTPS).
3. Confirm low-resource gating by testing with data saver or a throttled
   connection profile where possible.
4. Re-check `index.html` import-map pins against `OCR_CONFIG.dependencies`.
