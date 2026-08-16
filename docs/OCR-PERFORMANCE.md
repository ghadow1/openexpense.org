# OCR performance and source tags

OpenExpense reads receipts locally in the browser. The scanner is designed to use modern
mobile and desktop capabilities without sending images, PDFs, or parsed text to a server.

## Human-readable code tags

Use these tags in comments when changing receipt scanning code:

- `@ocr-deps` - CDN versions and import-map peer dependencies.
- `@ocr-engine` - PP-OCR initialization and model warm-up.
- `@ocr-pdf` - PDF.js text extraction, preview rendering, and OCR fallback.
- `@ocr-pipeline` - file decoding, canvas preparation, OCR calls, and text normalization.
- `@ocr-parse` - transparent rule-based merchant, total, tax, date, and item extraction.
- `@ocr-ui` - review sheet and save flow that requires explicit user confirmation.
- `@platform` - mobile, desktop, pointer, memory, CPU, network, and save/share behavior.
- `@perf` - latency, memory, bundle cleanup, canvas sizing, and idle scheduling.

## Runtime stack

The OCR path is lazy-loaded on first use:

- `ppu-paddle-ocr` for local receipt text recognition.
- `onnxruntime-web` and `ppu-ocv/canvas-web` as OCR peer imports from `index.html`.
- `pdfjs-dist` only when a scanned file is a PDF.

Keep version pins in `src/config.js` and the `index.html` import map synchronized. The
app preconnects to jsDelivr, but no receipt data is uploaded there; only JavaScript,
fonts, and icons are downloaded.

## Cross-platform performance rules

- Desktop-class browsers may warm the OCR engine during idle time after the app is ready.
- Mobile, low-memory, low-core, data-saver, and 2G-class sessions skip warm-up and load
  OCR only after the user chooses Scan.
- Image decoding prefers `createImageBitmap()` and falls back to `Image` for compatibility.
- Canvas dimensions are bounded by device profile: desktop keeps a larger OCR canvas for
  accuracy, while mobile and low-memory devices use smaller caps to avoid tab reloads.
- PDFs use embedded text first. OCR runs only when native PDF text is insufficient.
- Preview images are blob-backed when possible so large data URLs do not inflate memory.

## Parser expectations

The parser is intentionally rule-based and inspectable. It should suggest fields, not
auto-save. Preserve the review step and keep `rawText` visible so users can verify OCR
output before writing anything to the encrypted ledger.
