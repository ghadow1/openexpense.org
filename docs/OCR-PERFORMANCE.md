# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. Images, PDFs, recognized
text, and parsed expense suggestions stay on the device; OCR only proposes
fields that the user reviews before saving.

## Human-readable code tags

Use these tags when reviewing or searching the source:

| Tag | Purpose |
| --- | --- |
| `@ocr-deps` | CDN and import-map dependency pins for OCR, PDF, and browser peers. |
| `@ocr-engine` | Lazy OCR engine startup and model warmup. |
| `@ocr-pdf` | PDF text extraction, rendering, and preview creation. |
| `@ocr-pipeline` | Image/PDF normalization and OCR recognition flow. |
| `@ocr-parse` | Deterministic parsing from recognized text into expense fields. |
| `@ocr-ui` | User review surfaces before scanned data enters the ledger. |
| `@platform` | Mobile/desktop capability checks and browser API selection. |
| `@perf` | Bounded work for memory, CPU, and canvas-heavy operations. |

## Cross-platform OCR strategy

- **Lazy load heavy engines.** `src/features/receipt.js` imports Paddle OCR and
  pdf.js only when receipt scanning needs them.
- **Respect constrained devices.** Startup warmup is skipped when data saver is
  enabled, the effective connection is 2G-class, or reported memory/CPU is low.
  Manual scanning still loads OCR on demand.
- **Prefer native browser decoders.** Image receipts use `createImageBitmap()`
  when available, with an `Image` fallback for Safari/iOS and older engines.
- **Bound canvas work.** Large photos and PDF previews are scaled before OCR so
  high-resolution mobile cameras and desktop scans do not create unbounded
  memory pressure.
- **Avoid OCR when PDFs already contain text.** Text invoices use native PDF text
  extraction when enough text is present; OCR remains the fallback for scans.
- **Use blob previews when possible.** Canvas previews become object URLs via
  `toBlob()` where supported, falling back to data URLs only when needed.

## Dependency update checklist

1. Check the latest published versions:
   `npm view ppu-paddle-ocr version && npm view pdfjs-dist version && npm view onnxruntime-web version && npm view ppu-ocv version && npm view @fontsource-variable/inter version && npm view @tabler/icons-webfont version`
2. Update `OCR_CONFIG.dependencies` in `src/config.js`.
3. Keep the `index.html` import map aligned with `onnxruntime-web` and
   `ppu-ocv/canvas-web`.
4. Run `npm run validate` and commit the rebuilt `app.js` and current chunk
   files because GitHub Pages serves the tracked bundle directly.
