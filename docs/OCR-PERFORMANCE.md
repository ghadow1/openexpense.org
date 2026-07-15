# Receipt OCR performance and tags

OpenExpense receipt scanning is designed for current mobile and desktop browsers:
camera capture on phones, file upload on desktops, searchable PDF text extraction
when available, and browser-only OCR as the fallback.

## Runtime flow

1. `src/main.js` wires scan controls and the hidden file input.
2. `src/features/receipt.js` lazy-loads OCR/PDF dependencies only when needed.
3. PDFs are parsed with embedded text first. If the PDF has little or no text, page 1 is rendered to canvas and sent through OCR.
4. Images decode through `createImageBitmap()` when available, falling back to `Image`.
5. Canvases are normalized through `OCR_CONFIG.canvas` bounds before recognition.
6. Parsed fields are shown in a review sheet; nothing is saved until the user confirms.

The heavy OCR dependency pins live in `OCR_CONFIG.dependencies` in
`src/config.js`. The peer import map in `index.html` must stay in sync with
those pins because `ppu-paddle-ocr` resolves `onnxruntime-web` and
`ppu-ocv/canvas-web` as bare specifiers.

## Cross-platform performance choices

- **Lazy load by default:** OCR and PDF code stay out of the initial bundle.
- **Conservative idle warmup:** `Utils.shouldWarmOcr()` skips idle warmup on data-saver, very slow network, coarse-pointer, and low-memory devices. Scanning still loads on demand.
- **Intent warmup:** `Receipt.bindIntentWarmup()` starts warming when a user hovers, focuses, or touches a scan control.
- **Canvas bounds:** photos and rendered PDFs are clamped to the configured min/max side lengths to balance OCR accuracy against memory use.
- **Searchable PDF fast path:** embedded text avoids OCR work and improves battery life.
- **Revocable previews:** PDF previews prefer blob URLs from `canvas.toBlob()` so they can be released after review.

## Human-readable OCR tags

Receipt-specific elements expose `data-ocr-tag` attributes. These are intended
for code review, accessibility/debug inspection, lightweight QA scripts, and
future platform-specific UI checks.

| Tag | Meaning |
| --- | --- |
| `ocr:scan-control` | User-visible control that opens receipt scanning |
| `ocr:file-input` | Hidden file input that receives receipt image/PDF files |
| `ocr:progress` | OCR loading/recognition progress dialog |
| `ocr:review-sheet` | Review dialog shown after parsing |
| `ocr:preview-image` | Receipt/PDF preview image |
| `ocr:raw-text` | Raw OCR/PDF text disclosure |
| `ocr:save-expense` | Save parsed receipt as an expense |
| `ocr:save-and-scan` | Save and immediately scan another receipt |
| `ocr:cancel` | Cancel or close receipt review |

Add new tags to `OCR_CONFIG.tags` before using them in markup.
