# OCR performance and platform notes

OpenExpense uses browser-native capabilities and lazy-loaded OCR resources so receipt reading works across current phones, tablets, and desktop browsers without sending receipt content to a server.

## Pipeline tags

These tags are intentionally human-readable and searchable in source:

| Tag | Meaning |
| --- | --- |
| `OCR_INPUT` | File picker, camera capture hints, PDF/image routing. |
| `OCR_ENGINE` | Lazy OCR/PDF runtime loading, model warmup, progress UI. |
| `OCR_PREPROCESS` | Canvas sizing, PDF preview rendering, memory bounds. |
| `OCR_PARSE` | Merchant, date, amount, tax, and line-item heuristics. |
| `OCR_REVIEW` | Human confirmation UI before a scan becomes an expense. |
| `platform-capability` | Feature detection for mobile/desktop APIs. |
| `storage-privacy` | Encrypted local persistence and export behavior. |

`src/config.js` exports `CODE_TAGS` for runtime `data-code-tag` attributes and `OCR_CONFIG` for dependency pins and performance thresholds.

## Runtime dependencies

The app itself has no backend. On first use, receipt scanning can fetch static runtime assets:

- `ppu-paddle-ocr` for PP-OCRv5 text recognition.
- `onnxruntime-web` and `ppu-ocv/canvas-web` via the import map in `index.html`.
- `pdfjs-dist` only when a PDF is scanned.

Receipt images, PDF bytes, extracted text, parsed values, and ledger records remain in the browser. Keep `OCR_CONFIG.dependencies` and the `index.html` import map synchronized when upgrading OCR-related packages.

## Cross-platform behavior

- Mobile and coarse-pointer devices get `capture="environment"` so the rear camera is offered first.
- Desktop export uses the File System Access API when available and secure.
- Mobile export prefers the Web Share API with files, then falls back to a download link.
- OCR idle warmup is skipped when `navigator.connection.saveData` is enabled, effective connection type is 2G, or `navigator.deviceMemory` reports 1 GB or less.

## Image and PDF sizing

OCR accuracy usually improves when receipt text is not too small, but mobile browsers can run out of memory on very large canvases. `OCR_CONFIG.imageBounds` keeps inputs between:

- `minSide`: 1000 px
- `maxSide`: 2400 px
- `pdfPreviewMaxScale`: 2.5x

PDFs follow a text-first path. The app extracts text from every page and skips OCR when it finds at least `pdfTextThreshold.minChars` characters or `pdfTextThreshold.minLines` lines. If text extraction is not useful, the first page is rendered to canvas and OCR is run on that image.

## Parser ownership

Receipt parsing lives in `src/features/receipt-parser.js` so it can be tested without DOM, canvas, OCR, or PDF dependencies. When changing parsing rules:

1. Add or update a focused fixture in `tests/receipt-parser.test.mjs`.
2. Keep vendor/model corrections near `normalizeLines()` and `normalizeText()`.
3. Keep total-resolution changes near the `OCR_PARSE_TOTAL` comment.
4. Run `npm run validate` and commit the regenerated `app.js`/`chunk-*.js` assets.
