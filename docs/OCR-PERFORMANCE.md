# OCR receipt performance notes

OpenExpense reads receipts entirely in the browser. Images, PDFs, recognized
text, and parsed expense suggestions stay on the user's device.

## Human-readable code tags

OCR-related code uses short tags in comments so future changes are easy to
search and review:

- `@ocr-deps` - CDN and import-map dependencies for OCR/PDF support.
- `@ocr-engine` - PP-OCR service initialization and model warmup.
- `@ocr-pdf` - PDF text extraction and rendered-page fallback.
- `@ocr-pipeline` - image decoding, canvas sizing, and OCR recognition.
- `@ocr-parse` - merchant, total, date, tax, and line-item heuristics.
- `@ocr-ui` - progress and review dialogs for scan confirmation.
- `@platform` - mobile camera, desktop upload, and browser capability choices.
- `@perf` - memory, network, and startup-performance decisions.
- `@privacy` - local-only receipt processing boundaries.

## Dependency pin contract

The browser import map in `index.html` provides peer dependencies needed by the
lazy-loaded OCR engine. Keep these locations in sync:

- `src/config.js` -> `OCR_CONFIG.dependencies`
- `index.html` -> `<script type="importmap">`
- this document, when dependency behavior changes

`ppu-paddle-ocr` and `pdfjs-dist` are loaded only when scanning needs them. PDF
text extraction is tried before OCR so digital invoices avoid model work when
their embedded text is good enough to parse.

## Cross-platform performance policy

Receipt scanning should feel responsive on recent mobile and desktop browsers
without forcing low-end sessions to download OCR models during page load.

- Idle OCR warmup is skipped for `Save-Data`, `2g`/`slow-2g`, or very low-memory
  devices when the browser exposes those signals.
- Scan intent still starts warmup immediately: hover, pointer/touch, focus, and
  explicit Scan clicks all begin loading the engine before or alongside the file
  picker.
- Large camera photos are downscaled before recognition; small screenshots are
  scaled up for OCR legibility. Tune these values in `OCR_CONFIG.canvas`.
- PDF previews prefer blob-backed object URLs instead of base64 data URLs where
  supported to reduce memory overhead for large invoices.

## Manual verification checklist

After OCR-related changes:

1. Run `npm run validate`.
2. Serve the app with `npm run serve` and open `http://localhost:8765`.
3. Scan `test-receipt.png` or a receipt photo and confirm the review sheet
   suggests merchant, amount, date, and notes.
4. Scan a digital PDF invoice and confirm embedded text avoids unnecessary OCR
   when enough text is available.
5. In mobile emulation, confirm the Scan control opens a camera-friendly picker
   and the review sheet fits within the viewport.
