# OCR performance and code tags

OpenExpense keeps receipt reading private by running the entire OCR flow in the
browser. This page documents the mobile/desktop performance choices and the
human-readable tags used in source comments.

## Receipt pipeline

1. `src/features/receipt.js` receives a photo, image file, or PDF from the
   shared scan input.
2. PDFs load `pdfjs-dist` lazily and try embedded text before any OCR work.
3. Photos and OCR fallback pages are drawn to a white canvas bounded by
   `OCR_CONFIG.canvas` in `src/config.js`.
4. `ppu-paddle-ocr` is loaded lazily from the pinned CDN URL, with peer imports
   declared in `index.html`.
5. Heuristics extract merchant, total, tax, date, and possible line items.
6. The review sheet shows all suggestions before anything is saved to the
   encrypted ledger.

## Mobile and desktop guardrails

- **Mobile capture:** `Utils.prefersCamera()` adds `capture="environment"` for
  phone-sized or coarse-pointer devices so the rear camera is the default.
- **Desktop files:** larger screens keep the normal picker because PDF invoices
  and downloaded image files are common on desktop.
- **Canvas bounds:** `OCR_CONFIG.canvas.minSide` keeps small screenshots readable,
  while `maxSide` prevents high-megapixel phone photos from exhausting memory.
- **PDF text first:** `OCR_CONFIG.thresholds.pdfTextChars` and
  `pdfTextLines` avoid OCR when the PDF already contains enough selectable text.
- **Idle warm-up:** `Utils.shouldWarmOcr()` preloads OCR only when the device is
  not in data-saver mode, not on very slow network classes, and has enough
  reported memory. Manual scans still load OCR on demand.
- **Render batching:** store patches are coalesced with `requestAnimationFrame`
  so desktop sidebars and mobile calendar cells do not redraw more than once per
  frame.

## Searchable code tags

Use these tags when navigating the codebase:

- `ocr-engine-cdn` - lazy CDN imports, dependency pins, and OCR service init.
- `ocr-pdf-text-first` - PDF text extraction before OCR fallback.
- `ocr-canvas-mobile-desktop` - image/PDF canvas normalization for device memory.
- `ocr-parse-review` - merchant/date/amount parser heuristics and confidence.
- `ocr-review-sheet` - user confirmation UI before saving a scan.
- `ocr-idle-warmup` - background model warm-up guardrails.
- `platform-mobile-layout` - shared phone/tablet breakpoints.
- `platform-camera-input` - camera-first mobile scan input behavior.
- `platform-calendar-density` - calendar layout density buckets.
- `privacy-device-key` - non-extractable autosave encryption key.
- `privacy-indexeddb-autosave` - encrypted IndexedDB autosave debounce.
- `ui-render-batching` and `ui-render-invalidation` - render scheduling and
  changed-key branching.

## Updating OCR dependencies

When bumping OCR/PDF packages:

1. Update `OCR_CONFIG.dependencies` in `src/config.js`.
2. Keep the `index.html` import map peer dependencies in sync.
3. Run `npm run validate`.
4. Test at least one mobile photo, one desktop image file, and one PDF invoice.
