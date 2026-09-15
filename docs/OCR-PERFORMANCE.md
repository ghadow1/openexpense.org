# OCR performance and code tags

Receipt reading is local-first: photos, screenshots, PDF pages, model files, and
parsed text stay in the browser. The scanner is designed to use modern browser
capabilities when available while keeping a small, predictable memory footprint
on mobile hardware.

## Human-readable code tags

OCR comments use short tags so future cleanup work can find the right ownership
boundary without guessing.

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin PP-OCR, ONNX Runtime, PDF.js, WASM, model, worker, and dictionary assets |
| `@ocr-engine` | Runtime initialization, warmup, and capability checks |
| `@ocr-pdf` | PDF text extraction, page limits, and first-page preview rendering |
| `@ocr-pipeline` | Image decode, orientation, canvas preparation, OCR passes, and scoring |
| `@ocr-parse` | Merchant, date, total, tax, line-item, and confidence parsing |
| `@platform` | Phone, tablet, desktop, browser, and host capability choices |
| `@perf` | Memory, canvas, threading, and latency budgets |

The canonical values live in `OCR_CONFIG` in [`../src/config.js`](../src/config.js).
Use those constants rather than adding new literals to `src/features/receipt.js`.

## Platform profile

`src/features/receipt.js` chooses an OCR profile at scan time:

- **Mobile / coarse pointer / low-memory devices** keep receipt images to a
  smaller canvas and use a lower enhancement pixel budget. This reduces memory
  pressure and battery drain during repeated receipt capture.
- **Desktop-class browsers** can keep a larger canvas, preserving fine print on
  long receipts and invoices.
- **Cross-origin-isolated hosts** may use more than one ONNX WASM thread.
  Ordinary GitHub Pages browsers remain single-threaded for compatibility.

The picker stays synchronous (`src/features/receipt-picker.js`) so phone camera
launch keeps the user activation. Heavy OCR modules load only after a file is
selected.

## Pipeline

1. The native file picker accepts camera photos, screenshots, images, and PDFs.
2. PDFs are checked against page and extracted-text limits. Text-based invoices
   skip OCR when their parsed merchant and total are already usable.
3. Images prefer `createImageBitmap()` for orientation-aware decoding and fall
   back to `Image` where needed.
4. Canvas preparation scales small images up enough for OCR and scales large
   images down to the active platform profile.
5. OCR starts with the original canvas, then tries contrast and binary retries
   only when score and line-count thresholds say the result is weak.
6. `receipt-parse.js` normalizes OCR/PDF text into merchant, date, total, tax,
   item notes, document kind, and a low-confidence flag for human review.

## Dependency upgrades

When updating OCR or PDF packages, update these together:

- `package.json` and `package-lock.json`
- checked-in `vendor/` runtime/model/worker files
- `vendor/SHA256SUMS`
- this document if limits, model size, or runtime behavior changes

Then run:

```bash
npm run build
npm test
```

Manual OCR smoke coverage should include one paper receipt photo, one screenshot,
and one text-based PDF invoice on at least one phone-sized browser and one
desktop browser.
