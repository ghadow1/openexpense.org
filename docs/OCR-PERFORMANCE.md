# OCR receipt performance and code tags

OpenExpense keeps receipt reading local to the browser. The OCR flow uses modern
mobile and desktop browser capabilities when available, with conservative
fallbacks so older devices still complete a scan.

## Human-readable code tags

Search for these tags when changing OCR or platform behavior:

| Tag | Purpose |
| --- | --- |
| `@ocr-deps` | Lazy CDN dependencies and import-map peer pins. |
| `@ocr-engine` | PP-OCRv5 service initialization and warmup. |
| `@ocr-pdf` | PDF.js loading, native PDF text extraction, and PDF preview rendering. |
| `@ocr-pipeline` | Image decode, canvas sizing, and OCR preprocessing. |
| `@ocr-parse` | Conversion from recognized text into merchant, date, tax, amount, and note fields. |
| `@ocr-ui` | User review surfaces before saving scanned data. |
| `@platform` | Mobile/desktop capability checks and fallback selection. |
| `@perf` | Memory, network, and latency tradeoffs. |
| `@privacy` | Local-only data handling and human confirmation boundaries. |

## Cross-platform strategy

- **Lazy loading:** OCR and PDF libraries are not part of the initial app bundle.
  They load only on warmup or when a user scans a file.
- **Warmup gating:** `Utils.shouldWarmOcr()` skips idle model downloads when the
  browser reports data saver, 2G-class network, or very low device memory.
- **Intent warmup:** scan buttons trigger a short delayed warmup on pointer,
  touch, or keyboard focus so capable devices can start scanning faster.
- **Camera-first mobile input:** mobile and coarse-pointer devices get the
  `capture="environment"` hint for rear-camera receipt capture.
- **Modern image decode:** `createImageBitmap()` is used when available; `Image`
  remains the fallback for browsers without that API.
- **Canvas bounds:** receipt images are normalized into OCR-friendly dimensions,
  with lower maximums on constrained devices to reduce memory pressure.
- **PDF fast path:** PDFs are checked for native text before OCR. If text is
  present, the app avoids model inference and only renders a review preview.
- **Blob-backed previews:** generated previews prefer object URLs over data URLs
  to reduce large base64 strings in memory.

## Dependency pins

OCR dependency URLs live in `OCR_CONFIG.dependencies` in `src/config.js`.
Keep the import map in `index.html` synchronized with
`OCR_CONFIG.dependencies.peerImports` whenever `ppu-paddle-ocr`,
`onnxruntime-web`, or `ppu-ocv/canvas-web` versions change.

## Privacy contract

Receipt files, OCR text, and parsed fields stay in the browser. The review sheet
must remain the boundary before scanned values are written to the encrypted
local ledger.

## Build hygiene

The app is deployed from tracked root bundle files. Run `npm run build` after
editing `src/`; the `prebuild` script removes stale `app.js` and `chunk-*.js`
files before esbuild writes the current bundle.
