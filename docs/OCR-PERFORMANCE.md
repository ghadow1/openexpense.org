# OCR performance and source tags

OpenExpense receipt reading is local-first: images, PDFs, OCR text, and parsed
fields stay in the browser. The OCR code is intentionally tagged so maintainers
can scan the performance-sensitive path without reverse-engineering every
helper.

## Human-readable source tags

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF assets, workers, and lazy imports | `src/config.js`, `src/features/receipt.js`, `docs/DEPENDENCIES.md` |
| `@ocr-engine` | ONNX Runtime and PP-OCR service setup | `src/features/receipt.js` |
| `@ocr-pdf` | PDF.js text extraction and first-page preview raster | `src/features/receipt.js` |
| `@ocr-pipeline` | Recognition passes and retry order | `src/features/receipt.js` |
| `@ocr-parse` | Merchant, amount, date, tax, and item heuristics | `src/features/receipt-parse.js` |
| `@platform` | Mobile, tablet, desktop, camera, and browser capability choices | `src/core/utils.js`, `src/features/receipt-picker.js`, `src/features/receipt.js` |
| `@perf` | Size, pixel, threading, and startup-budget decisions | `src/config.js`, `src/core/utils.js`, `src/features/receipt.js` |

The canonical limits and asset paths live in `OCR_CONFIG` inside
`src/config.js`. If a new OCR limit is needed, add it there first and reference
it from the feature code.

## Mobile and desktop runtime contract

- OCR and PDF dependencies are lazy-loaded only after the user starts a scan,
  keeping the app shell small on phones and low-power tablets.
- `createImageBitmap()` is preferred for receipt images because modern mobile
  and desktop browsers can honor EXIF orientation without decoding through a
  visible DOM image. The `Image` fallback keeps older browsers working.
- `Utils.ocrRuntimeProfile()` uses browser capabilities (`matchMedia`,
  `hardwareConcurrency`, `deviceMemory`, `crossOriginIsolated`, and
  `SharedArrayBuffer`) instead of user-agent guesses wherever possible.
- Phones and coarse-pointer devices use a lower image max side to reduce memory
  pressure. Desktop browsers can keep more pixels and use additional WASM
  threads when cross-origin isolation makes threaded WebAssembly safe.
- PDF text extraction runs before OCR. Text-based invoices can skip model
  recognition entirely when merchant and total are already clear.
- Photo enhancement retries are progressive: original canvas, contrast canvas,
  then a high-contrast pass. Each retry is gated by OCR score and line count.

## Privacy and dependency boundary

Executable OCR/PDF code, model files, fonts, and icons are bundled or served
from the OpenExpense origin. Do not add hosted OCR APIs, telemetry, crash
uploads, or third-party model CDNs. See `docs/DEPENDENCIES.md` for the reviewed
runtime inventory.

## Reviewer checklist

1. Search for the tag that matches the change, then read `OCR_CONFIG`.
2. Confirm a phone-sized path and a desktop path both have bounded pixels.
3. Confirm PDFs still prefer embedded text before raster OCR.
4. Run `npm run build` and `npm test` so generated bundles and OCR tag checks
   stay in sync.
