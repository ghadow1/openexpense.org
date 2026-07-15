# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. Ledger data never leaves the
device, but the OCR runtime and PDF reader are lazy-loaded from jsDelivr the first
time a scan needs them.

## Runtime dependencies

The dependency pins live in two places and should stay in sync:

- `src/config.js` -> `OCR_CONFIG.dependencies`
- `index.html` -> import map for `onnxruntime-web` and `ppu-ocv/canvas-web`

`ppu-paddle-ocr` provides the PP-OCRv5 scanner, while `pdfjs-dist` is loaded only
for PDF invoices. Browser caching makes later scans faster after the first model
download.

## Cross-platform tuning

`src/core/utils.js` exposes `getOcrCanvasSettings()`, which selects one of the
profiles in `PLATFORM_CONFIG.ocr.canvasProfiles`:

- `compact` for save-data, slow network, or lower-memory devices.
- `balanced` for phones, tablets, and coarse-pointer devices.
- `desktop` for larger desktop/laptop browsers.

These profiles cap the longest canvas side before OCR. The caps protect mobile
heap and GPU memory while still upscaling small receipts enough for text
recognition. Desktop browsers keep the highest cap for sharper invoice scans.

OCR warm-up is skipped when the browser reports save-data or a very slow
connection. Manual scanning still loads the engine on demand.

## Human-readable code tags

`src/features/receipt.js` uses JSDoc and inline tags to keep the long receipt
pipeline navigable:

- `@tag ocr-engine` - lazy loading, OCR/PDF services, and warm-up.
- `@tag ocr-preprocess` - image/PDF canvas preparation.
- `@tag receipt-parse` - deterministic parsing of text into merchant, total,
  tax, date, and notes.
- `@tag ocr-review` - the editable confirmation UI before saving.

When adding OCR behavior, place it under the closest tag or add a similarly named
tag if the responsibility is genuinely new.
