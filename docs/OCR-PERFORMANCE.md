# OCR receipt performance and source tags

OpenExpense reads receipts entirely in the browser. This document explains the
performance policy and the human-readable tags used in source comments so OCR
changes are easier to review.

## Goals

- Keep photos, PDFs, recognized text, and parsed expense fields on the device.
- Lazy-load heavy OCR/PDF dependencies only when a scan needs them.
- Use modern browser capabilities when available, with small fallbacks for older
  mobile and desktop browsers.
- Fit preprocessing work to the current device so phones avoid memory spikes and
  capable desktops can preserve more source detail for OCR.

## Source tag glossary

Use these tags in short comments when a code path affects OCR, platform behavior,
or privacy-sensitive flow:

- `@ocr-deps` - CDN pins, import maps, and peer dependency wiring.
- `@ocr-engine` - OCR engine initialization, caching, and warmup.
- `@ocr-pdf` - PDF text extraction, page rendering, and PDF previews.
- `@ocr-pipeline` - image decoding, canvas preprocessing, OCR, normalization,
  parsing, and review flow.
- `@ocr-parse` - merchant/date/amount/item extraction heuristics.
- `@ocr-ui` - scan controls, progress state, review sheet, and raw text display.
- `@platform` - browser/device capability decisions across mobile, tablet,
  desktop, and installed PWA contexts.
- `@perf` - memory, CPU, network, idle work, canvas sizing, and render-cost
  decisions.
- `@privacy` - data-local behavior and user-confirmed save boundaries.

## Cross-platform OCR policy

The central policy lives in `src/config.js` as `OCR_CONFIG`.

- Dependency URLs are declared once and mirrored by the import map in
  `index.html`.
- OCR canvas limits have three profiles:
  - constrained phones/tablets use a lower maximum side to avoid memory churn;
  - balanced devices use the default quality/performance target;
  - capable desktop browsers can use a larger maximum side for sharper OCR.
- `src/core/utils.js` owns browser capability checks such as device memory,
  hardware concurrency, data-saver, effective connection type, and save-picker
  support.
- Idle OCR warmup is skipped on data-saver, 2G-class, or low-memory sessions.
  Manual scanning still loads the engine on demand.
- Scan-control intent (`pointerover`, `focusin`, and `touchstart`) warms the OCR
  engine shortly before likely use without forcing every visitor to pay that cost.

## Image and PDF flow

1. `Receipt.pickImage()` chooses camera capture on coarse/mobile pointers and
   file upload elsewhere.
2. Image scans prefer `createImageBitmap()` for modern decoders and fall back to
   `HTMLImageElement` for unsupported formats.
3. Images are drawn to a white-backed canvas, smoothed, and resized by the
   current OCR profile before recognition.
4. PDF scans first extract embedded text. If there is enough text, OCR is skipped.
5. PDF previews use blob-backed object URLs when available instead of base64
   data URLs, reducing memory pressure during review.
6. The review sheet always requires user confirmation before saving an expense.

## Build hygiene

The deployed app is generated into root `app.js` plus `chunk-*.js` files. Run:

```bash
npm run validate
```

This removes stale generated bundles, rebuilds from `src/main.js`, and fails if
the module graph no longer bundles.
