# OCR platform notes

OpenExpense keeps receipt reading local to the browser. The scanner downloads
runtime assets on first use, caches them through the browser, and asks the user
to review every parsed field before anything is saved to the ledger.

## Runtime ownership

- `src/config.js` owns `OCR_CONFIG`, including CDN pins, OCR canvas budgets,
  warm-up timing, progress copy, and human-readable code tags.
- `index.html` owns the import map for `onnxruntime-web` and
  `ppu-ocv/canvas-web`, which are peer dependencies of `ppu-paddle-ocr`.
- `src/features/receipt.js` owns loading, image/PDF normalization, OCR calls,
  parsing, and the review sheet.
- `src/core/utils.js` owns the platform profile used by OCR and other
  cross-platform affordances.

When updating the OCR engine, keep the `OCR_CONFIG.runtime` pins and
`index.html` import map in sync.

## Cross-platform performance contract

Receipt photos can be very large on modern phones and desktop scanners. The OCR
path intentionally normalizes images before recognition:

1. Decode with `createImageBitmap` when the browser supports it.
2. Fall back to `Image` decoding for formats that browsers expose there first.
3. Draw onto a white-backed canvas to avoid alpha blending artifacts.
4. Bound the longest side by the platform profile:
   - desktop-like devices use the largest OCR budget,
   - mobile-like devices use a smaller budget,
   - low-memory or low-core devices use the constrained budget.
5. Upscale small receipts to the minimum OCR side so text remains readable.

PDFs are handled in two stages. The app first extracts embedded text through
PDF.js; if enough text is found, OCR is skipped. Otherwise the first page is
rendered to a bounded canvas and sent through the same OCR path.

## Human-readable code tags

The app uses `data-code-tag` attributes as stable, readable markers for receipt
workflows. These are not analytics beacons and do not send data anywhere. They
exist so developers, QA, and accessibility/debug tooling can identify important
surfaces without relying on CSS class names.

Current OCR tags:

| Tag | Surface |
| --- | --- |
| `receipt.quick-scan` | Floating scan button |
| `receipt.scan-input` | Hidden file/camera input |
| `ocr.progress-dialog` | OCR progress modal |
| `ocr.review-dialog` | Receipt review modal |
| `ocr.review.merchant` | Suggested merchant field |
| `ocr.review.amount` | Suggested amount field |
| `ocr.review.date` | Suggested date field |
| `ocr.review.notes` | Suggested notes field |
| `ocr.review.raw-text` | Raw OCR text disclosure |

Add new tags to `OCR_CONFIG.codeTags` first, then reference them from the DOM
that owns the user interaction.
