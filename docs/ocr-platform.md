# OCR receipt platform notes

OpenExpense reads receipts in the browser. There is no server-side OCR service, upload queue, or remote parsing API. The code is organized around one human-readable runtime tag:

`OCR_RECEIPT_PIPELINE_V1`

Use that tag when searching logs, DOM progress state, and docs for receipt scanning behavior.

## Runtime flow

1. The user taps **Scan** and chooses a photo, image file, or PDF invoice.
2. `src/features/receipt.js` detects PDF vs image input.
3. PDF invoices load `pdfjs-dist` on demand and try embedded text first.
4. Image inputs, and PDFs without usable embedded text, load `ppu-paddle-ocr` on demand.
5. The OCR result is normalized and parsed into merchant, total, tax, date, and line-item notes.
6. The user reviews the suggested fields before anything is saved to the ledger.

## Dependency pins

`src/config.js` owns the OCR and PDF pins in `OCR_CONFIG.cdn`:

- `ppu-paddle-ocr@5.8.0`
- `pdfjs-dist@4.10.38`

`index.html` owns the import map required by the OCR package peer dependencies:

- `onnxruntime-web@1.23.2`
- `ppu-ocv@3.2.2`

Keep those values in sync with `OCR_CONFIG.peerImportMap` when updating OCR dependencies.

## Platform profiles

`Utils.getOcrPlatformProfile()` classifies the browser into one of four tiers:

| Tier | Signals | OCR canvas policy |
| --- | --- | --- |
| `mobile` | Coarse pointer, narrow viewport, or low memory hint | Smaller max side to reduce memory, heat, and battery use. |
| `balanced` | Default when device hints are limited | Conservative quality/performance balance. |
| `desktop` | Wide viewport without high-end hints | Higher canvas limit for sharper OCR input. |
| `highEnd` | Wide viewport with stronger memory/CPU hints | Highest canvas limit currently allowed by the app. |

These are browser hints, not guarantees. Treat them as a safe way to tune resource use without blocking unsupported browsers.

## Warm-up policy

Desktop and high-end profiles prewarm OCR during idle time so the first scan feels faster. Mobile and coarse-pointer devices wait until scan intent (`Receipt.pickImage()`) before downloading OCR models, which avoids spending bandwidth and battery for users who never scan receipts.

## PDF fast path

Many invoices already contain embedded text. For those files, OpenExpense parses the PDF text and skips OCR canvas preparation. That keeps desktop and mobile scans faster and avoids unnecessary model work. The app still renders the first page as a review thumbnail.

## Updating OCR behavior

When changing OCR behavior:

1. Update `OCR_CONFIG` for versions, labels, thresholds, or canvas sizing.
2. Keep import-map peers in `index.html` aligned with `OCR_CONFIG.peerImportMap`.
3. Preserve local-only processing: no uploads, no remote parsing, no telemetry.
4. Run `npm run build` and commit the regenerated `app.js` and current `chunk-*.js` files.
