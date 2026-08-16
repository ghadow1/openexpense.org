# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The ledger, receipt image,
and OCR output do not leave the device, but browser assets for fonts, icons,
PaddleOCR, ONNX Runtime, OpenCV, and PDF.js load from jsDelivr when needed.

## Human-readable source tags

Use these tags in comments when changing OCR or platform-sensitive code:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN, import-map, and version pins for OCR/PDF/browser assets. |
| `@ocr-engine` | PaddleOCR initialization, model warmup, and engine reuse. |
| `@ocr-pdf` | PDF.js loading, native PDF text extraction, and PDF previews. |
| `@ocr-pipeline` | File decoding, canvas preparation, OCR execution, and text normalization. |
| `@ocr-parse` | Merchant, amount, tax, date, and item heuristics. |
| `@ocr-ui` | Progress, review, confirmation, and save flows. |
| `@platform` | Mobile/desktop capability checks, camera hints, and browser support. |
| `@perf` | Memory, network, idle warmup, and canvas-size tradeoffs. |

## Scan pipeline

1. `Receipt.pickImage()` chooses camera capture on mobile-style inputs and a
   standard file picker on desktop.
2. `Receipt.scan(file)` opens progress UI and calls `Receipt.recognizeText()`.
3. PDFs go through `Receipt.pdfToCanvasAndText()` first. If the PDF already has
   usable embedded text, parsing skips OCR and uses that text directly.
4. Images use `createImageBitmap()` when available, with an `Image` fallback for
   browsers that do not support it for the selected file type.
5. `Receipt.prepareForOcr()` keeps the longest canvas side between
   `OCR_CONFIG.canvas.minSide` and `OCR_CONFIG.canvas.maxSide`.
6. `Receipt.ocrCanvas()` runs structured OCR, then a flattened fallback if the
   first pass returns no usable lines.
7. `Receipt.parse()` extracts merchant, amount, tax, date, and note candidates.
8. `Receipt.showPreview()` requires a human review before saving anything.

## Dependency pins

The active pins live in `OCR_CONFIG` (`src/config.js`) and the HTML import map
(`index.html`). Keep them synchronized:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`
- `@fontsource-variable/inter@5.3.0`
- `@tabler/icons-webfont@3.46.0`

When bumping these, run `npm run validate` so `app.js` and `chunk-*.js` are
rebuilt from the same source pins.

## Cross-platform performance policy

- OCR loads lazily on first scan. Startup may warm it during idle time only when
  `Utils.shouldWarmOcr(OCR_CONFIG)` says the device and connection are suitable.
- Warmup is skipped for data-saver sessions, 2G-class connections, low-memory
  devices, and low-core devices. Manual scanning still loads OCR on demand.
- PDF text extraction avoids OCR for native invoices when the extracted text
  meets `OCR_CONFIG.pdf.nativeTextMinCharacters` or
  `OCR_CONFIG.pdf.nativeTextMinLines`.
- PDF previews use blob-backed object URLs rather than base64 data URLs when the
  browser supports `canvas.toBlob()`, reducing memory pressure on mobile.
- HEIC/HEIF decoding depends on browser support. Keep JPEG, PNG, WebP, and PDF
  in the core smoke-test set.

## Manual QA checklist

After scanner changes:

1. Run `npm run validate`.
2. Serve locally with `npm run serve`.
3. Scan `test-receipt.png` and confirm the review sheet opens with editable
   merchant, amount, date, notes, and raw text.
4. Scan a text-based PDF invoice and confirm it parses without downloading OCR
   again when embedded text is sufficient.
5. On a mobile browser, verify the Scan button opens the camera/file picker and
   that saving releases the preview without leaving the page locked in modal
   state.
