# OCR performance and source tags

Receipt OCR is a local-first feature: camera images, PDF pages, and parsed text
stay in the browser. The code uses lazy-loaded PP-OCRv6 Tiny, ONNX Runtime Web,
and PDF.js assets served from this repository's `vendor/` directory.

Use this guide when changing receipt scanning, PDF invoices, OCR parsing, or the
platform gates that decide whether the app behaves like a phone, tablet, or
desktop.

## Human-readable source tags

Search for these tags before editing OCR or platform behavior:

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin OCR, PDF, WASM, and model resources | `src/config.js`, `docs/DEPENDENCIES.md` |
| `@ocr-engine` | ONNX Runtime and PP-OCR service initialization | `src/features/receipt.js` |
| `@ocr-pdf` | PDF.js text extraction and first-page raster preview | `src/features/receipt.js` |
| `@ocr-pipeline` | File decode, canvas sizing, OCR retries, and review sheet | `src/features/receipt.js` |
| `@ocr-parse` | Merchant, date, amount, tax, and line-item parsing | `src/features/receipt-parse.js` |
| `@platform` | Mobile, tablet, desktop, camera, and browser feature gates | `src/core/utils.js`, `src/config.js` |
| `@perf` | File, pixel, thread, lazy-load, and memory budgets | `src/config.js`, `src/features/receipt.js` |

`src/config.js` owns the tag legend and the live `OCR_CONFIG` values. Keep the
legend, this document, and the source comments in sync.

## Resource budget

The scanner is tuned for modern mobile and desktop browsers without assuming a
backend or a GPU:

- OCR/PDF dependencies load only when the user starts a scan.
- Models, the PDF worker, ONNX WASM files, fonts, and icons come from the app's
  origin so repeat scans can use the browser cache.
- Images are decoded with `createImageBitmap()` when available, with an `Image`
  fallback for browsers that do not expose it.
- Input photos are capped before drawing to canvas, then normalized into an OCR
  size band. This keeps phone memory use predictable while preserving enough
  text detail for desktop scans and screenshots.
- Enhancement passes run against a separate pixel cap so contrast retries do not
  allocate a second full-size receipt on memory-constrained devices.
- PDF invoices try native text first. OCR is used only when the extracted text is
  not good enough to fill merchant and amount fields.
- WASM threads stay at one on phones and iOS. Desktop browsers may use more
  threads only when the page is `crossOriginIsolated`, which is required for
  shared-memory WebAssembly threads.

## Platform matrix

| Surface | Resource choice | Why |
| --- | --- | --- |
| Phone camera | Synchronous native picker plus one WASM thread | Preserves user activation and limits heat, battery, and memory use |
| Tablet | Same local OCR path, larger layout from `data-frame` | Keeps the capture flow touch-friendly while using more screen space |
| Desktop | Same-origin cached models and optional threaded WASM | Uses available cores only where browser isolation makes it safe |
| PDF invoices | Native PDF text before OCR rasterization | Fast path for digital invoices and lower memory use |
| Screenshots / photos | Canvas resize plus contrast and binary retries | Balances OCR quality with predictable browser heap pressure |

## Changing dependencies or models

Do not bump OCR, PDF, or ONNX packages by version number alone. A safe upgrade
needs all of these in the same change:

1. Update `package.json` and `package-lock.json`.
2. Review and replace same-origin assets under `vendor/`.
3. Update `vendor/SHA256SUMS`.
4. Confirm paths in `OCR_CONFIG.assets`.
5. Run `npm run build`, `npm test`, and a receipt/PDF smoke test in a browser.
6. Update this document if the platform or resource budget changes.

The local-first rule is part of the product contract: no OCR dependency may
receive ledger JSON, receipt pixels, key material, or parsed receipt text.

## Maintenance checklist

- Keep OCR constants in `OCR_CONFIG`; do not reintroduce one-off limits in the
  scanner.
- Prefer feature detection over user-agent checks. Use UA checks only for known
  platform constraints such as iOS save-picker behavior.
- Keep DOM ids, `data-*` hooks, and CSS class prefixes aligned with
  `docs/CODEMAP.md`.
- Rebuild committed bundles after editing `src/`.
- Let `scripts/qc-ocr-performance.mjs` fail loudly when tags, docs, or OCR
  resource budgets drift.
