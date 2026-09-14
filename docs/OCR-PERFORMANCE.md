# OCR performance and readable code tags

OpenExpense reads receipts in the browser. Receipt images, PDF pages, OCR model
inputs, and parsed text stay on the user's device; OCR assets are bundled or
served from the OpenExpense origin.

## Human-readable source tags

Use these tags in comments near code that owns a receipt OCR decision:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin PDF/OCR workers, WASM, models, and dictionaries. |
| `@ocr-engine` | Runtime creation, warmup, model loading, and inference providers. |
| `@ocr-pdf` | PDF.js text extraction, PDF page limits, and PDF preview rendering. |
| `@ocr-pipeline` | Image decode, canvas resize, OCR attempts, and parser handoff. |
| `@platform` | Browser/device decisions for iOS, Android, desktop, camera, or files. |
| `@perf` | CPU, memory, startup, network, or canvas budget decisions. |

The canonical OCR constants live in `src/config.js` under `OCR_CONFIG`.
Implementation details live in `src/features/receipt.js`, while text parsing
lives in `src/features/receipt-parse.js`.

## Cross-platform performance contract

- Lazy-load `onnxruntime-web`, `ppu-paddle-ocr`, and `pdfjs-dist` only after the
  user starts a receipt scan so the normal ledger startup remains small.
- Keep OCR/PDF executable code and model files same-origin. If OCR packages or
  vendored model files change, update `docs/DEPENDENCIES.md`,
  `vendor/SHA256SUMS`, and the `OCR_CONFIG` asset paths together.
- Use the WASM execution provider and one WASM thread as the compatibility
  baseline across mobile Safari, Android WebView/Chrome, Firefox, and desktop
  Chromium. Raise this only with focused mobile and desktop smoke testing.
- Prefer native PDF text extraction before OCR. Text-based invoices can be
  parsed without rasterizing every page through the OCR model.
- Decode photos with `createImageBitmap()` when available, then fall back to an
  `Image` element for browsers that do not expose it.
- Cap input canvases before OCR and cap enhancement canvases separately. The
  enhancement path calls `getImageData()`, so it needs a stricter pixel budget.
- Retry OCR enhancement only when text quality gates indicate the extra pass is
  worth the CPU and memory cost.

## Updating the latest receipt tech

When updating OCR, PDF, or runtime packages, treat dependency and asset changes
as one reviewable unit:

1. Update npm package versions and same-origin files under `vendor/`.
2. Confirm `OCR_CONFIG.assets`, `OCR_CONFIG.runtime`, and `OCR_CONFIG.limits`
   still match the reviewed files and browser support target.
3. Run `npm run build` and `npm test`.
4. Manually smoke test at least one camera photo or screenshot and one
   text-based PDF on a mobile-class viewport and a desktop viewport.
