# OCR receipt performance notes

OpenExpense keeps receipt reading local to the browser. Images and PDFs are
decoded on-device, parsed in `src/features/receipt.js`, and shown in a review
sheet before anything is saved to the ledger.

## Source tags

Use these human-readable tags when navigating or changing OCR code:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN pins and import-map wiring for OCR/PDF dependencies. |
| `@ocr-engine` | Lazy OCR engine loading, model initialization, and recognition calls. |
| `@ocr-pdf` | PDF text extraction, preview rendering, and PDF-to-canvas fallback OCR. |
| `@ocr-pipeline` | File decoding, canvas sizing, OCR normalization, and scan orchestration. |
| `@ocr-parse` | Merchant, date, amount, tax, and line-item parsing heuristics. |
| `@ocr-ui` | Scan buttons, progress UI, review sheet, and save-from-preview flow. |
| `@platform` | Browser capability checks and mobile/desktop behavior differences. |
| `@perf` | Work that protects startup time, memory, bandwidth, or responsiveness. |
| `@privacy` | Code paths where user data must remain local and user-confirmed. |

Search example:

```bash
rg "@ocr-|@platform|@perf|@privacy" src index.html docs
```

## Runtime strategy

- OCR and PDF dependencies are lazy-loaded from the CDN only when receipt
  scanning is used. Keep the URLs in `OCR_CONFIG.dependencies` synchronized
  with the import map in `index.html`.
- `Receipt.bindIntentWarmup()` uses delegated pointer, touch, and focus events
  so current and future scan controls can warm the engine when the user shows
  intent.
- `Utils.shouldWarmOcr()` skips idle preloading for data-saver, 2G-class, and
  low-memory devices. Manual scanning still works because the engine loads on
  demand.
- Images prefer `createImageBitmap()` for modern browsers and fall back to an
  `Image` element for older mobile browsers and formats that ImageBitmap cannot
  decode.
- PDF invoices use native text extraction first. The OCR engine runs on rendered
  PDF pages only when extracted text is not useful enough.
- Review previews prefer blob-backed object URLs to avoid large base64 strings
  in memory, with data URLs as a final fallback.

## Canvas sizing

Canvas limits live in `OCR_CONFIG.canvas`:

- `minOcrSide` upscales small images enough for OCR to see text.
- `maxOcrSide` caps image memory and recognition cost on high-resolution mobile
  photos.
- `pdfPreviewMaxSide` and `pdfPreviewScaleMax` limit rendered PDF preview size.
- `previewQuality` controls JPEG preview compression.

Adjust these values conservatively. Increasing them can improve tiny text but
also increases memory pressure on phones and tablets.

## Cross-platform checklist

When changing receipt reading:

1. Keep scan input support for `image/*`, HEIC/HEIF, and PDFs.
2. Preserve desktop save-picker behavior and mobile share/download fallbacks in
   ledger export code.
3. Avoid loading OCR during initial app boot unless `Utils.shouldWarmOcr()` says
   the session can afford it.
4. Revoke object URLs after previews close or failed scans.
5. Never auto-save OCR results. The review sheet must remain the user-confirmed
   boundary between scanned text and ledger data.

## Validation

Run these checks after OCR changes:

```bash
npm run build
git diff --check
```

For manual QA, start `npm run serve`, scan a photo on a mobile-sized viewport,
upload a PDF invoice on desktop, and confirm that the raw scanned text plus the
editable review fields appear before saving.
