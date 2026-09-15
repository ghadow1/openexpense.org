# OCR performance and code tags

Receipt reading is local-first: images, PDFs, recognized text, and ledger data
stay in the browser. This page documents the cross-platform performance knobs
and the human-readable tags used to find related code.

## Code tags

Search these tags with `rg "@ocr-" src docs scripts` or from the editor:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | OCR, PDF, WASM, model, and dictionary asset ownership |
| `@ocr-engine` | Lazy OCR runtime initialization and model warmup |
| `@ocr-pdf` | PDF text extraction and first-page preview rendering |
| `@ocr-pipeline` | Camera/file selection, image decode, OCR passes, and review handoff |
| `@ocr-parse` | Merchant/date/amount parsing from OCR or PDF text |
| `@platform` | Browser, phone, tablet, desktop, camera, and WASM capability choices |
| `@perf` | Resource budgets, scoring gates, and CPU/memory tradeoffs |

The source of truth for OCR paths, limits, runtime options, and scoring gates is
`OCR_CONFIG` in [`src/config.js`](../src/config.js).

## Cross-platform performance contract

- OCR and PDF code stay out of startup through dynamic imports.
- Native PDF text is parsed before OCR, so text invoices avoid image inference.
- `createImageBitmap()` is preferred for image decode and EXIF orientation when
  the browser supports it; the fallback `Image` path keeps older browsers
  working.
- Images are normalized to a bounded canvas size before inference. Very small
  photos are upscaled enough for text, and very large photos are reduced before
  enhancement to protect memory on mobile devices.
- Desktop browsers may use two WASM workers only when `SharedArrayBuffer` and
  `crossOriginIsolated` are available. Phones and non-isolated browsers stay at
  one worker for compatibility, battery, and GitHub Pages portability.
- PDF pages, extracted lines, extracted characters, file size, and enhancement
  pixels are capped in `OCR_CONFIG.limits`.

## Updating OCR technology

Do dependency and asset updates together. A package bump for `ppu-paddle-ocr`,
`onnxruntime-web`, or `pdfjs-dist` must include any required files under
`vendor/`, updated `vendor/SHA256SUMS`, a rebuild, and a receipt scan smoke
test. Do not switch model families or remote asset URLs without reviewing the
privacy and performance impact.

## Review checklist

- [ ] `src/config.js` still owns OCR paths, limits, runtime, and scoring values.
- [ ] `src/features/receipt.js` has no hard-coded OCR resource budget.
- [ ] Receipt scan still requires human confirmation before saving.
- [ ] `npm run build` and `npm test` pass after OCR changes.
