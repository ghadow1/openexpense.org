# OCR performance and source tags

OpenExpense receipt scanning is designed for current mobile and desktop browsers without sending images to a server. Keep changes small, measurable, and review-first: OCR should suggest fields, never auto-save an expense.

## Pipeline

1. **Pick a source** from the Scan button or floating action button.
2. **PDF fast path** loads PDF.js on demand and extracts embedded text from every page.
3. **Canvas preparation** renders PDFs or photos to a bounded canvas for OCR quality without mobile memory spikes.
4. **OCR recognition** lazy-loads PP-OCRv5 and ONNX Runtime Web, then reads the prepared canvas.
5. **Parsing** extracts merchant, total, tax, date, and candidate line items.
6. **Review** shows the original preview plus editable fields before saving.

## Human-readable code tags

`src/features/receipt.js` uses short tags to make the OCR flow searchable:

- `OCR-ENGINE` - lazy model loading and warm-up.
- `OCR-PDF` - PDF.js loading and text-first invoice handling.
- `OCR-RECOGNITION` - OCR passes and recognition fallbacks.
- `OCR-CANVAS` - mobile/desktop canvas sizing and image normalization.
- `OCR-PARSE` - receipt text heuristics and result shape.
- `OCR-REVIEW` - confirmation UI before writing to the ledger.

## Cross-platform constraints

- Keep OCR dependency versions in `src/config.js` and the `index.html` import map aligned.
- Respect `navigator.connection.saveData`, very slow effective connection types, and low `navigator.deviceMemory` when preloading OCR.
- Prefer embedded PDF text over OCR whenever possible. It is faster, more accurate, and avoids unnecessary battery use.
- Keep the long canvas edge bounded. Higher values may help dense receipts on desktop but can crash mobile Safari or Android WebView.
- HEIC/HEIF decoding is browser-dependent. Document the limitation unless a dedicated client-side conversion path is added.
- Scanned multi-page PDFs currently OCR the first rendered page only; embedded text extraction still reads all pages.

## Validation checklist

- Run `npm run validate` after editing `src/` so generated deploy assets are refreshed.
- Run `git diff --check` before committing.
- Manually scan at least one photo and one PDF when changing OCR, parser, or preview behavior.
