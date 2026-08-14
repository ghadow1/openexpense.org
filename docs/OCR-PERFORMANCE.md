# OCR receipt performance guide

OpenExpense reads receipts locally in the browser. This guide documents the code tags and platform decisions that keep
the OCR path maintainable across current mobile and desktop browsers.

## Human-readable code tags

Use these short tags in comments near OCR/platform decisions:

- `@ocr-deps` - lazy OCR, PDF, and peer dependency pins.
- `@ocr-engine` - model initialization, warmup, and OCR service lifecycle.
- `@ocr-pdf` - PDF text extraction, rendering, and preview generation.
- `@ocr-pipeline` - image decoding, canvas preparation, and OCR input normalization.
- `@ocr-parse` - receipt field extraction heuristics for merchant, amount, date, and notes.
- `@ocr-ui` - progress, review, retry, and scan controls.
- `@platform` - browser, mobile, desktop, input, network, or storage capability choices.
- `@perf` - work that affects startup, memory, canvas size, model loading, or rendering.
- `@privacy` - decisions that keep images, receipts, and ledger data on-device.

## Dependency pins

`src/config.js` exposes `OCR_CONFIG.dependencies` as the source of truth for:

- PP-OCRv5 (`ppu-paddle-ocr`)
- PDF.js and its worker
- OCR peer imports resolved by the `index.html` import map

When updating OCR dependencies, update both `OCR_CONFIG.dependencies.peerImports` and the import map in `index.html`.
Keep OCR and PDF code lazy-loaded; the app should still boot and render the ledger without downloading receipt models.

## Cross-platform behavior

- Mobile and coarse-pointer devices set `capture="environment"` so receipt scans open the rear camera where browsers
  support it.
- Desktop browsers use standard file picking and native save-picker support where available.
- `createImageBitmap()` is used when supported to decode images efficiently, with an `Image` fallback for Safari/iOS or
  unsupported file formats.
- PDF invoices are checked for embedded text before OCR. If the PDF already has usable text, the OCR model is not loaded.
- Idle OCR warmup is skipped for data-saver, 2G-class, and lower-memory devices. User-initiated scans always load OCR on
  demand.

## Performance guardrails

- Keep OCR input canvas dimensions bounded by `OCR_CONFIG.image.minSide` and `OCR_CONFIG.image.maxSide`.
- Keep PDF preview rendering bounded by `OCR_CONFIG.pdf.renderMaxSide` and `OCR_CONFIG.pdf.renderMaxScale`.
- Prefer blob-backed preview URLs over base64 data URLs to reduce memory overhead.
- Revoke object URLs when previews close or scans fail.
- Do not move OCR imports into the main bundle; receipt scanning must remain an optional cost.

## Verification checklist

Before shipping OCR/platform changes:

1. Run `npm run validate`.
2. Confirm `git diff --check` passes.
3. Review generated `app.js` and `chunk-*.js` churn after build cleanup.
4. Manually smoke-test, when possible:
   - desktop image upload
   - mobile camera capture
   - text PDF import
   - scanned/image-only PDF import

