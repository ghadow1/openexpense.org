# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR path is optimized for
current mobile and desktop browsers while preserving the project's privacy rule:
receipt images, PDFs, and parsed text never leave the device.

## Human-readable source tags

Use these tags in comments when changing OCR or platform-sensitive code:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN pins, import maps, and OCR/PDF peer dependency notes. |
| `@ocr-engine` | Lazy loading, model initialization, and warmup behavior. |
| `@ocr-pdf` | PDF text extraction, rendering, worker setup, and preview generation. |
| `@ocr-pipeline` | Image decode, canvas preparation, OCR calls, and result normalization. |
| `@ocr-parse` | Merchant, amount, date, tax, and line-item parsing heuristics. |
| `@platform` | Browser/device capability checks such as camera, save picker, memory, and network. |
| `@perf` | Tuning that directly affects startup, memory, canvas size, or repeated rendering. |

The goal is not to tag every line. Tag the entry point for a concept so future
contributors can search for it quickly.

## Current browser OCR stack

The active pins live in `src/config.js` under `OCR_CONFIG` and must stay in sync
with the import map in `index.html`.

- `ppu-paddle-ocr@6.4.0` for PP-OCR receipt recognition.
- `pdfjs-dist@6.2.108` for browser-native PDF text extraction and page preview.
- `onnxruntime-web@1.27.0` and `ppu-ocv@4.0.0` as OCR peer dependencies.
- `@tabler/icons-webfont@3.46.0` for UI icon delivery.

When upgrading the OCR stack, update both `OCR_CONFIG.dependencies` and the
HTML import map together, then run `npm run validate`.

## Cross-platform performance policy

- **Startup:** OCR warms during idle time only on capable devices. Data Saver,
  2G-class connections, and low-memory devices skip warmup and lazy-load on the
  first manual scan.
- **Images:** Photos are decoded with `createImageBitmap()` when available, then
  drawn to a bounded canvas. Older browsers use an `Image` fallback with the
  same canvas limits.
- **PDFs:** Text-based PDFs skip OCR when extracted text is sufficient. Scanned
  PDFs render only the first page preview at a bounded scale before OCR.
- **Previews:** Canvas previews use blob-backed object URLs when supported to
  avoid large base64 strings in memory.
- **Review first:** OCR never auto-saves. The user always confirms merchant,
  amount, date, and notes before a ledger entry is written.

## Tuning checklist

1. Keep canvas limits in `OCR_CONFIG.image` balanced for phone memory and
   desktop accuracy.
2. Keep PDF thresholds in `OCR_CONFIG.pdf` high enough to avoid false positives
   but low enough to skip OCR for normal invoice PDFs.
3. Prefer capability checks in `src/core/utils.js` over one-off browser checks.
4. Rebuild tracked deployment assets with `npm run build` after source changes.
