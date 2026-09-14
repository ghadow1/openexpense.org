# OCR performance and code tags

OpenExpense reads receipts, invoices, screenshots, and simple PDF bills in the
browser. The OCR path is designed for current mobile and desktop browsers while
keeping receipt pixels, ledger text, and keys on the device.

## Human-readable tags

Use these tags when searching the source:

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin runtime files, models, workers, and dictionaries | `src/config.js`, `src/features/receipt.js` |
| `@ocr-engine` | OCR service boot, WASM runtime setup, and warmup | `src/config.js`, `src/features/receipt.js` |
| `@ocr-pdf` | PDF.js loading, embedded text extraction, and page preview | `src/features/receipt.js` |
| `@ocr-pipeline` | Image decode, resize, contrast, binary retry, and OCR pass order | `src/config.js`, `src/features/receipt.js` |
| `@ocr-parse` | Quality scoring and review-sheet handoff | `src/config.js`, `src/features/receipt.js`, `src/features/receipt-parse.js` |
| `@platform` | Browser, pointer, phone, tablet, and desktop capability choices | `src/config.js`, `src/core/utils.js`, `src/features/receipt.js` |
| `@perf` | CPU, memory, page, text, and canvas limits | `src/config.js`, `src/core/utils.js`, `src/features/receipt.js` |

## Runtime policy

- `src/config.js` owns OCR/PDF asset paths, file limits, canvas budgets, WASM
  thread targets, and OCR retry thresholds.
- `src/core/utils.js` owns cross-platform browser checks. Multi-threaded WASM is
  used only on desktop-class browsers when the page is cross-origin isolated;
  phones and non-isolated browsers stay at one thread for predictable startup.
- `src/features/receipt.js` lazy-loads PDF.js and PP-OCR only after the user
  starts receipt capture. Normal ledger, calendar, and planner flows do not pay
  the OCR bundle cost.

## Mobile and desktop budgets

| Area | Current value | Why it exists |
| --- | --- | --- |
| File size | 15 MB | Avoids loading very large camera/PDF files into memory |
| PDF pages | 20 | Stops accidental long statements from blocking a tab |
| Extracted PDF text | 5000 lines / 250000 chars | Bounds text-only parsing before OCR fallback |
| OCR canvas side | 1200-2600 px | Keeps enough detail for PP-OCR without exhausting phone memory |
| Enhancement canvas | 1.8 million pixels | Keeps contrast/binary retries fast |
| PDF preview side | 2400 px, scale capped at 2.5 | Gives a readable review thumbnail and OCR fallback |

## Review checklist for OCR changes

1. Keep OCR/PDF code, models, workers, fonts, and icons served from this origin.
2. Update `OCR_CONFIG` instead of scattering new numeric limits through
   `receipt.js`.
3. Preserve the text-first PDF path so invoices with embedded text do not run OCR
   unnecessarily.
4. Test at least one phone-class path and one desktop-class path when runtime,
   canvas, or model settings change.
5. Run:

```bash
npm run build
npm test
```
