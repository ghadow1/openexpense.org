# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. The OCR path is optimized
for current mobile and desktop browsers while keeping the codebase searchable by
plain-language tags.

## Human-readable tags

Search these tags when working on receipt scanning:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN and import-map dependency pins. |
| `@ocr-engine` | Paddle OCR model loading and warmup. |
| `@ocr-pdf` | PDF.js loading, text extraction, and preview rendering. |
| `@ocr-pipeline` | File-to-canvas-to-text scanning flow. |
| `@ocr-parse` | Merchant, total, date, tax, and line item parsing. |
| `@ocr-ui` | Progress and review-sheet user interface. |
| `@platform` | Browser, device, network, and OS capability checks. |
| `@perf` | Memory, canvas size, preload, and decode performance choices. |
| `@privacy` | Boundaries that keep receipt data local to the device. |

The canonical tag list and dependency URLs live in `src/config.js` under
`OCR_CONFIG`.

## Dependency policy

`src/features/receipt.js` lazy-loads OCR and PDF dependencies only when needed:

- `ppu-paddle-ocr` loads on the first image scan or OCR fallback.
- `pdfjs-dist` loads only for PDF files.
- `index.html` owns the import map for OCR peer dependencies. Keep it in sync
  with `OCR_CONFIG.dependencies.peerImports`.

No receipt image, PDF, or recognized text is sent to a server by application
code.

## Mobile and desktop performance notes

- OCR warmup runs during idle time only when the browser is not reporting data
  saver, 2G-class networking, or very low device memory.
- Scan controls also warm the engine on hover, focus, or touch intent on capable
  devices. Actual scans still load OCR on demand if warmup was skipped.
- Image decoding prefers `createImageBitmap()` and falls back to `Image` for
  older browsers.
- Large receipt images are capped before OCR so canvas allocations remain
  predictable on mobile Safari and low-memory Chromium devices.
- PDF previews use blob-backed object URLs when possible instead of large
  base64 data URLs.
- PDFs with enough native text skip OCR and go straight to parsing.

## OCR flow

1. `Receipt.pickImage()` selects camera capture on coarse-pointer/mobile
   devices and file upload elsewhere.
2. `Receipt.recognizeText()` chooses the PDF path or image path.
3. PDFs attempt native text extraction first, render a preview, and only call
   OCR if text is sparse.
4. Images decode to a canvas, normalize size, and run through Paddle OCR.
5. `Receipt.parse()` extracts merchant, amount, date, tax, and item hints.
6. The review sheet asks the user to confirm before anything is saved.

## Validation checklist

Before shipping OCR changes:

```bash
npm run build
git diff --check
```

Then manually scan one photo receipt and one PDF invoice in a local browser.
