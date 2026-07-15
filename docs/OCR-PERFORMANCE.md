# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. The first receipt scan lazy-loads
pinned client-side OCR and PDF libraries from jsDelivr, then the browser cache keeps
repeat scans fast. No receipt image, PDF, parsed text, or ledger data is uploaded by
OpenExpense.

## Human-readable source tags

Use these tags in comments when touching OCR/platform-sensitive code:

- `@ocr-deps` - runtime dependency pins and import-map peer dependencies.
- `@ocr-engine` - OCR engine loading, model initialization, and warmup.
- `@ocr-pdf` - PDF text extraction, rendering, and preview generation.
- `@ocr-pipeline` - image preparation and OCR execution.
- `@ocr-parse` - text normalization and receipt field parsing.
- `@ocr-ui` - progress, preview, and review UI.
- `@platform` - browser/device capability decisions.
- `@perf` - work that affects startup, memory, layout, decoding, or scan latency.
- `@privacy` - local-only processing and storage boundaries.

## Cross-platform performance policy

- Keep OCR/PDF imports lazy. The app shell should boot without downloading OCR models.
- Gate idle warmup with network and device signals (`saveData`, 2G-class links, low
  memory, low hardware concurrency). Manual scanning must still work on demand.
- Prefer modern browser APIs such as `createImageBitmap()` and blob-backed object URLs,
  while retaining fallbacks for older mobile and desktop browsers.
- Keep preprocessing dimensions bounded. Larger canvases can improve OCR, but they
  also increase memory pressure and main-thread work on phones.
- Prefer native PDF text extraction before OCR. Many invoices already contain text,
  so OCR should be the fallback rather than the first path.
- Revoke object URLs when previews close to avoid holding receipt/PDF image memory.

## Current runtime pins

The canonical values live in `src/config.js` under `OCR_CONFIG`.

- `ppu-paddle-ocr` provides PP-OCRv5 receipt recognition.
- `pdfjs-dist` reads PDF text and renders a first-page preview.
- `onnxruntime-web` and `ppu-ocv/canvas-web` are import-map peers required by
  `ppu-paddle-ocr`; keep `index.html` and `OCR_CONFIG.dependencies.peerImports`
  synchronized.

## Privacy language

Use "local OCR" or "local-first" for receipt scanning. Avoid claiming that first use
has no third-party network dependency unless OCR/PDF assets are self-hosted or already
cached. The important privacy boundary is that OpenExpense does not upload user data:
third-party CDNs serve static code, not receipts or ledger contents.
