# OCR performance and code tags

Receipt reading is a local browser pipeline. It uses current cross-platform web
technology -- native file/camera pickers, `createImageBitmap()` where available,
PDF.js text extraction, WebAssembly ONNX inference, canvas enhancement, and
same-origin PP-OCRv6 Tiny assets -- so receipt pixels and ledger text stay on
the device.

## Contributor path

1. Start in [`src/config.js`](../src/config.js) at `OCR_CONFIG`.
2. Follow the tags below into [`src/features/receipt-picker.js`](../src/features/receipt-picker.js),
   [`src/features/receipt.js`](../src/features/receipt.js), and
   [`src/features/receipt-parse.js`](../src/features/receipt-parse.js).
3. Run `npm test` and `npm run build` after OCR changes. GitHub Pages serves the
   committed root bundles, so generated `app.js` and `chunk-*.js` must be
   rebuilt with source changes.

## Human-readable tags

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF workers, models, dictionaries, and WASM runtimes. |
| `@ocr-engine` | OCR runtime initialization and model warm-up. |
| `@ocr-pdf` | PDF.js text extraction, page limits, and preview rendering. |
| `@ocr-pipeline` | Image normalization, OCR passes, enhancement, and text routing. |
| `@ocr-parse` | Merchant, date, amount, tax, and item heuristics over extracted text. |
| `@platform` | Browser capability checks for phone, tablet, desktop, camera, sharing, and file APIs. |
| `@perf` | Limits and choices that protect startup time, memory, battery, and scan latency. |

The tags are intentionally plain comments. They are search handles for humans,
not a second type system.

## Central tuning points

`OCR_CONFIG` owns the values that should move together:

- `assets`: PDF worker, ONNX WASM path, PP-OCR detection/recognition models, and
  character dictionary. These remain same-origin under `vendor/`.
- `limits`: receipt file size, PDF page count, extracted line count, and
  extracted text size. These caps protect mobile memory and desktop tab
  responsiveness.
- `canvas`: normalization and enhancement sizes. Large photos are downscaled
  before inference; tiny receipts are upscaled enough for text recognition.
- `runtime`: WASM thread count and execution provider. Single-threaded WASM is
  the broadest compatible default across iOS, Android WebView, desktop Safari,
  hardened browsers, and standard Chromium/Firefox.
- `quality`: score and line thresholds that decide whether to accept the first
  OCR pass or spend more CPU on contrast/binary retries.

## Cross-platform performance contract

- Startup stays light: `receipt-picker.js` opens the native chooser synchronously,
  and `receipt.js` is imported only after a scan action.
- Mobile camera works through the web input contract: coarse pointers and phones
  prefer `capture="environment"` while desktops keep a regular file chooser.
- Decoding prefers `createImageBitmap(file, { imageOrientation: 'from-image' })`
  and falls back to `Image` for older Safari/WebView support.
- Text PDFs are parsed before image OCR. Native PDF text that yields a merchant
  and total avoids unnecessary model inference.
- Canvas pixel work is bounded before enhancement. This keeps memory predictable
  on phones while still giving desktop screens enough detail for receipts and
  invoices.
- OCR output is advisory. The review sheet remains the user confirmation step
  before anything is saved to the encrypted ledger.

## Evaluating newer OCR technology

Prefer browser-portable upgrades that keep the local-first promise:

- Same-origin WebAssembly/WebGPU runtimes and model files that can be reviewed
  and pinned in `vendor/`.
- Smaller or more accurate receipt/invoice models that preserve offline use.
- Native browser capabilities that are available behind feature detection and
  have a safe fallback.

Avoid adding mobile-only SDK bridges, cloud OCR APIs, analytics, crash reporters,
or remote model downloads unless the product explicitly changes its privacy
model.
