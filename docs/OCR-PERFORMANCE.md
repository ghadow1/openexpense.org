# OCR performance and code tags

OpenExpense reads receipts, screenshots, and PDF invoices in the browser. There
is no upload path: OCR models, PDF workers, WebAssembly runtime files, and
receipt pixels stay on the OpenExpense origin and on the current device.

## Human-readable code tags

Search these tags when changing receipt capture or OCR behavior:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF runtime, model, dictionary, and worker paths |
| `@ocr-engine` | Lazy initialization of ONNX Runtime Web and PP-OCRv6 Tiny |
| `@ocr-pdf` | PDF text extraction and first-page raster preview |
| `@ocr-pipeline` | Recognition pass ordering and enhancement retries |
| `@ocr-parse` | Text normalization and deterministic receipt-field parsing |
| `@platform` | Browser capability choices for phone, tablet, and desktop |
| `@perf` | Canvas, file, page, text, and score limits that protect responsiveness |

## Runtime contract

- `src/config.js` owns `OCR_CONFIG`. Keep model paths, wasm paths, browser
  runtime choices, canvas limits, PDF limits, and scoring thresholds there.
- `src/features/receipt-picker.js` stays small and synchronous so mobile
  browsers preserve the user gesture needed to open the camera or file picker.
- `src/features/receipt.js` lazy-loads `onnxruntime-web`, `ppu-paddle-ocr/web`,
  and `pdfjs-dist` only after receipt capture starts.
- `src/features/receipt-parse.js` receives text and lines only. It should remain
  deterministic and independent of browser canvas, files, or DOM APIs.

## Cross-platform performance notes

| Surface | Performance choice |
| --- | --- |
| Phone camera | Use `capture="environment"` when the viewport or pointer suggests a phone or touch device. |
| Desktop file picker | Leave `capture` off and accept images plus PDFs from disk. |
| Image decode | Prefer `createImageBitmap()` with EXIF orientation support, then fall back to `Image`. |
| PDF invoice | Try native PDF text first, then OCR the first rendered page if text is not good enough. |
| Canvas size | Downscale large photos and upsample tiny receipts within `OCR_CONFIG.limits`. |
| Enhancement retries | Run contrast and binary passes only when the first OCR score is weak. |
| WebAssembly | Use the checked-in ONNX Runtime Web assets from `vendor/ort/`. |

These limits are intentional for local-first devices: a high-end desktop should
read sharper source material, while a phone should avoid memory spikes and long
main-thread stalls.

## Dependency and asset policy

OCR uses the reviewed dependencies in `package.json` and checked-in assets under
`vendor/`. Update `docs/DEPENDENCIES.md`, `vendor/SHA256SUMS`, `OCR_CONFIG`, and
the built bundles together when changing OCR/PDF runtimes or models. Do not add
remote model URLs, analytics, or telemetry around receipt pixels.

## Quality gate

`scripts/qc-ocr-performance.mjs` checks that the tags, config, docs, and source
boundaries stay aligned. Run:

```bash
npm run build
npm test
```
