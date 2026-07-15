# Receipt OCR performance and code tags

OpenExpense keeps receipt OCR client-side: files are decoded in the browser,
OCR/PDF dependencies are lazy-loaded from the CDN, and parsed fields are shown in
a review sheet before anything is saved.

## Resource strategy

OCR settings live in `src/config.js` under `OCR_CONFIG`.

- **Dependency pins**: `OCR_CONFIG.dependencies` owns the PaddleOCR and PDF.js
  URLs. Keep `peerImports` synchronized with the import map in `index.html`.
- **Canvas profile**: `canvasProfile.minSide` and `maxSide` keep OCR inputs large
  enough for small receipt text while capping memory on phones and tablets.
- **Warmup gates**: `Utils.shouldWarmOcr()` skips idle preload when Data Saver is
  enabled, the connection reports a very slow effective type, or a coarse-pointer
  low-memory device is likely to be resource constrained. Manual scans still load
  OCR on demand.
- **Modern image decode**: image receipts use `createImageBitmap()` when the
  browser supports it, with an `Image` fallback for older desktop/mobile engines.
  HEIC/HEIF files are attempted, then receive a clear browser-compatibility
  message when decoding fails.
- **PDF preview memory**: PDF page previews use revocable object URLs instead of
  long-lived data URLs when `canvas.toBlob()` is available.

## Human-readable OCR tags

Use these tags when searching markup or adding instrumentation:

| Tag | Meaning |
| --- | --- |
| `ocr-scan-intent` | Visible controls that launch receipt scanning. |
| `ocr-file-input` | Hidden file input used by camera/gallery/file pickers. |
| `ocr-progress-dialog` | Modal shown while OCR or PDF extraction is running. |
| `ocr-review-sheet` | Human review sheet for parsed receipt fields. |
| `ocr-preview-image` | Receipt/PDF image shown next to parsed fields. |
| `ocr-raw-text` | Collapsible raw OCR/PDF text block. |
| `ocr-save` | Save reviewed fields as an expense. |
| `ocr-save-and-scan` | Save, then reopen the scanner for the next receipt. |
| `ocr-cancel` | Close the OCR review without saving. |

The runtime actions use `data-action` (`ocr-save`, `ocr-cancel`, etc.) so OCR
buttons follow the same event delegation convention as the rest of the app.
The descriptive `data-oe-tag` values are for readers, tests, and diagnostics.

## Code map

- `src/features/receipt.js`
  - `OCR_INPUT`: picker and intent warmup.
  - `OCR_ENGINE`: lazy loading and model/PDF initialization.
  - `OCR_IMAGE`: image decoding and canvas normalization.
  - `OCR_PARSER`: OCR text cleanup and expense-field inference.
  - `OCR_UI`: progress and review sheet.
- `src/core/utils.js`: cross-platform browser capability checks.
- `src/main.js`: delegated OCR review actions and idle warmup scheduling.
- `index.html`: import map for OCR peer dependencies and static scan tags.

Run `npm run validate` after editing OCR code. It rebuilds `app.js` and current
`chunk-*.js` assets after removing stale build outputs.
