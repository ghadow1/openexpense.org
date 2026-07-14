# OCR platform notes

OpenExpense keeps receipt reading client-side. The OCR path is designed to use modern browser capabilities on phones, tablets, and desktops while preserving the privacy guarantee that receipt images never leave the device.

## Runtime pipeline

1. **File selection** (`ocr.input.pick`) - mobile and coarse-pointer devices request the rear camera with `capture="environment"`; desktop browsers show the normal file picker.
2. **Decode** (`ocr.image.decode`) - image files use `createImageBitmap()` when available for faster off-main-thread decoding, then fall back to an `Image` element for browser and HEIC compatibility.
3. **Profile sizing** (`ocr.profile.*`) - canvases are scaled by platform profile before OCR:
   - `ocr.profile.mobile`: smaller canvas budget for constrained memory and thermal limits.
   - `ocr.profile.default`: balanced canvas budget for typical laptops and tablets.
   - `ocr.profile.desktop`: higher-resolution canvas budget for desktop-class CPU and memory.
4. **PDF path** (`ocr.pdf.*`) - PDFs are checked for embedded text first. When text is available, OpenExpense skips image OCR and only renders a preview.
5. **OCR path** (`ocr.engine.*`, `ocr.text.read`) - PP-OCR is lazy-loaded from the pinned CDN, warmed once, and cached by the browser.
6. **Review** (`ocr.review`) - parsed merchant, amount, date, tax, and line-item suggestions are shown for human confirmation before anything is saved.

## Human-readable code tags

OCR constants live in `src/config.js` under `OCR_CONFIG`. Tags use dotted names so they are easy to search:

- `ocr.engine.*` - model loading and warmup stages.
- `ocr.pdf.*` - PDF text extraction and preview rendering stages.
- `ocr.profile.*` - platform-specific image sizing profiles.
- `ocr.fix.*` - OCR text normalization rules.
- `merchant.*` - known merchant aliases used by the parser.

When adding receipt heuristics, add a `tag` next to the rule and keep the rule close to related parser settings. This keeps future cleanup searchable without turning the parser into anonymous regular expressions.

## Cross-platform performance rules

- Prefer embedded PDF text over OCR whenever possible.
- Keep all scan processing local; do not introduce server OCR or analytics.
- Treat `navigator.connection.saveData` as a hard signal to avoid background warmup.
- Keep mobile image budgets conservative. Extra pixels can reduce accuracy on low-memory devices by causing browser eviction or long GC pauses.
- Use desktop-class profiles only when viewport, pointer, memory, or CPU signals indicate the browser can afford it.
- Commit regenerated `app.js` and `chunk-*.js` after changing anything in `src/`.
