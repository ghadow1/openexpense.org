# OCR performance and source tags

OpenExpense reads receipts in the browser. The goal is fast, private OCR on
current phones, tablets, and desktops without adding a server or sending
receipt pixels away from the device.

## Human-readable tags

Use these tags in comments and documentation when touching receipt reading:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF model, worker, and WASM asset policy |
| `@ocr-engine` | Lazy OCR/PDF loading, ONNX runtime setup, model warmup |
| `@ocr-pdf` | PDF text extraction and first-page preview rasterizing |
| `@ocr-pipeline` | Capture, image/PDF normalization, OCR, parse, review |
| `@ocr-parse` | Merchant, date, total, tax, and line-item parsing |
| `@platform` | Phone, tablet, desktop, camera, picker, or browser capability logic |
| `@perf` | Canvas sizing, threading, memory, latency, and bundle-loading tradeoffs |

These are source-reading aids, not public API. Keep them near ownership points
instead of tagging every helper.

## Runtime contract

- `src/config.js` owns `OCR_CONFIG`: asset paths, size limits, canvas targets,
  PDF preview settings, and WASM thread caps.
- `src/features/receipt-picker.js` stays lightweight and synchronous so phone
  browsers keep the native camera/file picker user activation.
- `src/features/receipt.js` lazy-loads `onnxruntime-web`, `ppu-paddle-ocr`,
  and `pdfjs-dist` after the user starts a scan.
- `src/features/receipt-parse.js` is text-only. It should not import DOM,
  runtime, or model code.
- `vendor/` holds reviewed OCR models, ONNX runtime files, and the PDF worker.
  Update `vendor/SHA256SUMS` when replacing any of those files.

## Cross-platform performance notes

Phones and tablets are usually memory-bound during OCR. Desktops are more often
CPU-bound. Current defaults keep the image readable while capping peak memory:

- Images decode through `createImageBitmap()` when available, preserving
  orientation on modern mobile browsers, with an `Image` fallback for older
  engines.
- Input images are downscaled before OCR when their longest edge exceeds the
  configured decode limit.
- Small images are upscaled to the OCR minimum side so tiny receipt text is not
  starved before recognition.
- Contrast and binary retry canvases are capped separately because
  `getImageData()` duplicates pixel memory.
- PDF files use native text first. OCR runs only when embedded text does not
  produce a usable merchant and total.
- ONNX WASM threads stay at one unless the page is cross-origin isolated.
  Cross-origin isolation is required for SharedArrayBuffer-backed threading on
  capable desktop/tablet hosts; GitHub Pages custom domains may not provide
  those headers.

## Upgrade checklist

When updating OCR, PDF, or ONNX dependencies:

1. Update `package.json` and `package-lock.json`.
2. Replace reviewed same-origin files in `vendor/`.
3. Recompute `vendor/SHA256SUMS`.
4. Review `OCR_CONFIG` for asset paths, limits, and runtime caps.
5. Run `npm run build` and `npm test`.
6. Manually scan at least one paper receipt photo, one screenshot, and one PDF.

Do not switch model assets to remote URLs. Keeping models and workers on the
application origin is part of the privacy and offline-loading contract.
