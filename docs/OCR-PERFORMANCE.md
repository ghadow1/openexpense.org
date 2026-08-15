# OCR performance and platform notes

OpenExpense reads receipts entirely in the browser. There is no upload path: photos,
PDFs, recognized text, and parsed expense fields stay on the device until the user
chooses to save an expense.

## Source tags

OCR-related code uses short tags so humans can search by concern:

- `@ocr-deps` - CDN, import map, and peer dependency pins.
- `@ocr-engine` - OCR engine lifecycle and warmup.
- `@ocr-pdf` - PDF parsing, native text extraction, and page rendering.
- `@ocr-pipeline` - image normalization, OCR calls, and text normalization.
- `@ocr-parse` - receipt field heuristics for merchant, date, total, tax, and items.
- `@ocr-ui` - scan progress and review sheet UI.
- `@platform` - mobile, desktop, browser capability, and fallback decisions.
- `@perf` - resource-sensitive behavior that affects load time, memory, or bandwidth.

## Dependency map

The OCR engine is deliberately lazy-loaded from jsDelivr instead of being bundled
into `app.js`. This keeps the default expense tracker fast for users who never scan
receipts. The canonical pins live in `src/config.js` under `OCR_CONFIG`.

Current browser pins:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`

When changing OCR packages, update both:

1. `src/config.js` (`OCR_CONFIG.dependencies`)
2. `index.html` import map for OCR peer imports

Then run `npm run validate` so the committed static bundle is regenerated.

## Cross-platform behavior

Desktop-class sessions use `requestIdleCallback` to warm the OCR engine after the
app boots. That hides the first-scan cost when resources are available. Mobile or
constrained sessions skip idle warmup when the browser reports:

- Data Saver is enabled.
- An effective connection type of `slow-2g` or `2g`.
- Device memory below the configured threshold.

Skipping warmup does not disable scanning. It only delays the OCR engine load until
the user explicitly scans a receipt.

Image input prefers `createImageBitmap()` for modern browser decoding and falls back
to `Image` elements for compatibility. Camera capture is requested on touch/coarse
pointer layouts, while desktop file upload remains available.

## OCR and PDF pipeline

1. **Pick input** - the hidden file input accepts images and PDFs.
2. **PDF fast path** - PDFs are loaded with PDF.js and native text is extracted first.
   If the text is sufficient, OCR is skipped.
3. **Preview render** - the first PDF page is rendered with a capped scale for a
   review thumbnail and OCR fallback.
4. **Image normalization** - images are resized between configured minimum and
   maximum sides so small receipts remain legible and very large photos do not waste
   memory.
5. **OCR pass** - PP-OCR runs structured recognition first, with a flat fallback when
   needed.
6. **Review** - parsed fields are suggestions only. The user confirms before saving.

## Build hygiene

GitHub Pages serves root `app.js` plus hashed `chunk-*.js` files. `npm run build`
runs `scripts/clean-build-assets.mjs` first so old chunk hashes are removed before
esbuild emits the current production assets.
