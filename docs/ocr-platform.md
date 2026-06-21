# OCR receipt platform notes

OpenExpense reads receipts entirely in the browser. The ledger and receipt
images are not uploaded to a backend, but the OCR, PDF, and icon libraries are
loaded from jsDelivr the first time the browser needs them.

## Pipeline

1. **Input selection** - Mobile and coarse-pointer devices receive the
   `capture="environment"` hint so the camera opens directly. Desktop browsers
   keep the normal file picker for screenshots, photos, HEIC/HEIF images, and
   PDF invoices.
2. **Modern image decode** - `Receipt.decodeImageSource()` uses
   `createImageBitmap()` when available so current mobile and desktop browsers
   can decode images off the main UI path. Older WebViews and unsupported image
   formats fall back to an `Image` element.
3. **Adaptive OCR canvas** - `OCR_CONFIG.canvas` sets the readable quality and
   memory tradeoffs. Low-memory mobile devices cap the long edge lower, while
   higher-memory desktop browsers can use a larger OCR canvas.
4. **PDF shortcut** - PDF.js extracts embedded text from every page first. OCR
   only runs when the PDF does not expose enough text to parse reliably.
5. **Review before save** - Parsed merchant, total, tax, date, and line items
   are suggestions. The user reviews and edits them before the expense is saved.

## Human-readable code tags

Receipt parser comments use `OCR_TAG` labels for the areas most likely to need
tuning:

- `OCR_TAG amount-scoring` - scores candidate total rows.
- `OCR_TAG invoice-cluster` - handles PDF invoice row totals and fees.
- `OCR_TAG merchant-name` - identifies merchant names while skipping metadata.
- `OCR_TAG line-items` - keeps useful purchase detail out of tender/total rows.

The user-facing stage labels live in `OCR_CONFIG.progress`, keeping loading,
PDF parsing, OCR recognition, and completion copy in one place.

## Performance behavior

- OCR and PDF libraries are lazy loaded. Users who never scan receipts do not
  download or initialize the OCR model during normal app startup.
- Scan buttons warm the OCR engine on intent signals (`pointerenter`, `focus`,
  and `touchstart`). Returning scanner users also warm during browser idle time.
- The first scan may still take longer because the browser must download and
  cache model assets. Later scans reuse the initialized service.
