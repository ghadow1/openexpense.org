# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. This guide documents the OCR pipeline, cross-platform resource choices, and human-readable tags used in the codebase.

## Goals

- Keep receipt and invoice processing local to the user's device.
- Use current browser capabilities when available: `createImageBitmap`, PDF.js workers, File System Access save picker, Web Share files, `requestIdleCallback`, and Network Information hints.
- Preserve mobile performance by avoiding unnecessary OCR model preload on data-saver, slow-network, or low-memory sessions.
- Keep desktop workflows fast for image uploads, searchable PDFs, and encrypted exports.

## Source tags

Search these tags when changing OCR or platform behavior:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | OCR, PDF, ONNX, and OpenCV dependency pins/import maps. |
| `@ocr-engine` | OCR service initialization, warmup, and recognition calls. |
| `@ocr-pdf` | PDF.js loading, native PDF text extraction, and first-page preview rendering. |
| `@ocr-pipeline` | Image decode, resize, canvas preparation, and scan input flow. |
| `@ocr-parse` | Merchant, amount, date, tax, and line-item heuristics. |
| `@ocr-ui` | Progress dialog, review sheet, confidence messaging, and scan actions. |
| `@platform` | Mobile/desktop feature gates and browser capability detection. |
| `@perf` | Resource limits, idle scheduling, and constrained-device gates. |
| `@privacy` | Local-only processing and no-upload guarantees. |

## Runtime pipeline

1. The user chooses a receipt photo/image or PDF. Mobile/coarse-pointer devices prefer rear-camera capture.
2. OCR dependencies are lazy-loaded from the CDN only when scanning is requested or warmed during safe idle time.
3. Images prefer `createImageBitmap()` for modern desktop/mobile browsers, with an `Image` fallback for Safari, HEIC, and older engines.
4. Images are drawn onto a white canvas and normalized to the shared `OCR_CONFIG.image` bounds before recognition.
5. PDFs are checked for native text first. If enough text is present, the parser skips OCR and uses the PDF text directly.
6. Image-only PDFs render the first page to canvas within `OCR_CONFIG.pdf` bounds, then use OCR.
7. Parsed merchant, total, tax, date, and notes are always shown in a review sheet before anything is saved.

## Cross-platform resource strategy

- `Utils.shouldWarmOcr()` skips idle OCR warmup when the browser reports data saver, `slow-2g`/`2g`, or very low device memory.
- Intent warmup still listens for pointer, touch, and focus interaction on scan controls so deliberate scans can start faster.
- `requestIdleCallback` is used when available; `setTimeout` is the fallback for browsers without idle callbacks.
- Desktop export prefers `showSaveFilePicker()` in secure contexts; mobile export prefers `navigator.share()` with files; both fall back to a download link.
- Calendar density, camera preference, and save-picker gating share platform helpers in `src/core/utils.js`.

## Dependency pins

The active OCR dependency pins live in `OCR_CONFIG.dependencies` (`src/config.js`). The import map in `index.html` must mirror `OCR_CONFIG.dependencies.peerImports` because browser import maps cannot be generated from JavaScript config at runtime.

When updating OCR or PDF libraries:

1. Update `OCR_CONFIG.dependencies`.
2. Update the matching `index.html` import map peer URLs.
3. Run `npm run build`.
4. Smoke-test photo upload, camera capture on a mobile browser, searchable PDF parsing, and scanned PDF OCR fallback.

## Privacy expectations

Receipt images, PDF contents, recognized text, and parsed fields stay in the browser. The app has no backend. CDN requests download code and model assets only; user documents are not uploaded.
