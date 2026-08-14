# OCR performance and source tags

OpenExpense keeps receipt reading local to the browser. The OCR path should stay
fast on current desktop hardware, conservative on mobile battery and memory, and
easy for contributors to audit.

## Source tags

Use these short tags in comments when changing OCR or platform-sensitive code:

- `@ocr-deps` - CDN pins, import maps, workers, and model-loading contracts.
- `@ocr-engine` - OCR service initialization, warmup, and recognition calls.
- `@ocr-pdf` - PDF text extraction, PDF rendering, and PDF worker behavior.
- `@ocr-pipeline` - image decoding, canvas preparation, OCR passes, and result normalization.
- `@ocr-parse` - merchant, date, amount, tax, and item extraction heuristics.
- `@ocr-ui` - scan controls, progress state, preview review, and accessibility copy.
- `@platform` - browser, mobile, desktop, network, and device-memory capability branches.
- `@perf` - changes made primarily for responsiveness, memory, latency, or battery.
- `@privacy` - local-only processing, storage, or data-safety boundaries.

Tags are intentionally human-readable. Prefer a tag plus one sentence explaining
the reason for the branch instead of a long comment that restates the code.

## Cross-platform OCR checklist

- Keep dependency versions in `src/config.js` and the `index.html` import map in
  sync. The OCR engine relies on peer imports resolved by the browser import map.
- Load OCR lazily. Idle warmup is appropriate only when
  `Utils.shouldWarmOcr()` allows it; scan intent and manual scans still load on
  demand.
- Size canvases through `OCR_CONFIG.canvas` and `Utils.ocrCanvasMaxSide()`.
  Desktop can use larger canvases, while camera-first and low-memory devices
  should avoid unnecessary megapixels.
- Prefer native PDF text before OCR. Text extraction is faster, more accurate,
  and easier on battery than rendering pages for OCR.
- Prefer `createImageBitmap()` for modern browsers, with `Image` fallback for
  compatibility and HEIC/PDF-adjacent edge cases.
- Use blob-backed preview URLs when possible and revoke them when the preview
  closes. Data URLs are retained only as a compatibility fallback.
- Never auto-save OCR output. The review sheet is the privacy and correctness
  boundary: users confirm fields before anything is written to the ledger.

## Tuning guide

Most OCR behavior is configured in `OCR_CONFIG`:

- `dependencies` names the lazy-loaded OCR/PDF URLs and peer import pins.
- `warmup` controls idle warmup scheduling.
- `canvas` controls minimum OCR legibility and maximum memory pressure.
- `progress` keeps user-facing scan status strings together.
- `parsing` defines confidence and amount thresholds for deterministic receipt
  parsing.

When changing parser heuristics, add or update a receipt fixture if one exists
for the merchant class being changed. Keep the parser deterministic and
review-first; OCR should suggest values, not silently mutate the ledger.
