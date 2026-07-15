# Receipt OCR performance notes

OpenExpense reads receipts entirely in the browser. The OCR stack is designed to use current mobile and desktop browser capabilities without sending images, PDFs, or parsed text to a server.

## Runtime stack

- `src/features/receipt.js` lazy-loads PP-OCRv5 from jsDelivr on the first scan.
- `index.html` provides an import map for PP-OCRv5 peer dependencies:
  - `onnxruntime-web`
  - `ppu-ocv/canvas-web`
- `src/config.js` mirrors those URLs in `OCR_CONFIG.dependencies.peerImportMap` so contributors can see the full runtime set in one place.
- PDF invoices use PDF.js. Embedded text is parsed directly before falling back to OCR.

Keep the import map and `OCR_CONFIG.dependencies` together when updating OCR libraries. A mismatched import map can fail only at scan time because the OCR engine is loaded dynamically.

## Cross-platform loading

`src/main.js` may warm the OCR engine during idle time so the first scan feels faster. `Utils.shouldWarmOcr()` skips that preload when the browser reports data-saver mode or a very slow connection. In those cases the Scan button still works; the engine loads after the user chooses a file.

This keeps desktop and modern Wi-Fi/mobile experiences responsive while avoiding surprise model downloads on constrained connections.

## Image and PDF sizing

OCR quality improves when tiny images are upscaled, but large canvases can be expensive on mobile GPUs and memory-constrained browsers. `OCR_CONFIG.canvas` sets both bounds:

- `minSide` upscales small photos enough for text recognition.
- `maxSide` caps large camera images before OCR.

PDF page rendering uses `OCR_CONFIG.pdf.maxRenderSide` and `maxRenderScale` for the same reason. Change these values conservatively and test on both a phone-sized viewport and a desktop viewport.

## Human-readable action tags

The global click router in `src/main.js` handles user actions with readable `data-action` tags. Receipt review actions use:

- `receipt-preview-close`
- `receipt-preview-save`
- `receipt-preview-save-and-scan`
- `scan-receipt`

Prefer this pattern for user-facing controls that cross module boundaries. It makes generated markup self-describing and keeps action names searchable in code review.

## Privacy and confirmation

Receipt parsing is a convenience layer, not an autopilot:

1. The file is decoded locally.
2. OCR and parsing suggest fields.
3. The review sheet shows the suggested fields and raw scanned text.
4. The user confirms before anything is saved to the encrypted ledger.

Do not add automatic save behavior to OCR flows without preserving an explicit user confirmation step.
