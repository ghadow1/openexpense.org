# Receipt OCR platform notes

OpenExpense reads receipts entirely in the browser. No receipt image, PDF, OCR
text, or parsed expense data is uploaded to a server.

## Runtime stack

- **OCR:** `ppu-paddle-ocr` (PP-OCRv5) loaded on demand from jsDelivr.
- **OCR runtime peers:** `onnxruntime-web` and `ppu-ocv/canvas-web` are pinned in
  the `index.html` import map so bare imports resolve in every supported
  browser.
- **Image decode:** `createImageBitmap()` is used when available for modern
  browser decoding and EXIF-aware camera images, with an `Image` element fallback.
- **PDF:** `pdfjs-dist` is lazy-loaded only for PDF files. Embedded PDF text is
  preferred; OCR runs on a rendered first page only when text extraction is too
  sparse.
- **Storage:** parsed results are shown in a review sheet first. Saving uses the
  same encrypted IndexedDB autosave path as manual expenses.

## Code map

- `src/features/receipt.js` is the implementation entry point. It is tagged with
  section comments for OCR lifecycle, PDF handling, image normalization, text
  cleanup, field parsing, and review UI.
- `src/config.js` exports `OCR_CONFIG`, the single place for OCR CDN pins,
  canvas bounds, preview quality, and parser confidence thresholds.
- `src/main.js` binds scan-intent warmup events for desktop hover/focus and
  mobile touch.
- `src/features/calendar.js` and the floating scan action both call
  `Receipt.pickImage()`.

## Cross-platform performance rules

1. **Lazy by default.** Do not import OCR or PDF code at startup. Warm OCR only
   after scan intent so edit/export-only sessions avoid model downloads and WASM
   initialization.
2. **Bound canvas memory.** Keep receipt canvases under `OCR_CONFIG.canvas.maxSide`
   and upscale very small images to `OCR_CONFIG.canvas.minSide`. This balances
   mobile RAM use with recognizer accuracy on desktop uploads.
3. **Decode with browser-native paths.** Prefer `createImageBitmap()` for
   camera/upload images, but keep the `Image` fallback for Safari gaps and
   unsupported formats such as HEIC on some desktops.
4. **Prefer Blob preview URLs.** PDF previews use `canvas.toBlob()` when
   available, which avoids large base64 strings on iOS/Android. Always revoke
   object URLs in the preview close/error path.
5. **Use PDF text first.** Invoices often contain real text. If enough text is
   extracted, skip OCR and return a high-confidence parsed result.
6. **Keep parsing reviewable.** Heuristics should produce suggestions, not final
   hidden writes. New merchant corrections belong in `KNOWN_MERCHANTS`; broader
   OCR text cleanup belongs near `normalizeLines()` and `normalizeText()`.

## Updating OCR dependencies

When upgrading OCR-related packages, update every pin together:

1. `OCR_CONFIG.paddleUrl` in `src/config.js`.
2. `OCR_CONFIG.pdfUrl` and `OCR_CONFIG.pdfWorkerUrl` in `src/config.js`.
3. The `onnxruntime-web` and `ppu-ocv/canvas-web` import-map URLs in
   `index.html`.

After source edits, run `npm run build` and commit the regenerated `app.js` and
`chunk-*.js` files.
