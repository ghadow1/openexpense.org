# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR engine, PDF reader, parsing heuristics, and review UI are intentionally tagged in source so contributors can find the right layer quickly.

## Human-readable source tags

Use these tags when searching the codebase:

- `@ocr-deps` - CDN pins and peer dependency notes.
- `@ocr-engine` - OCR engine loading, warmup, and recognition calls.
- `@ocr-pdf` - PDF.js loading, text extraction, and PDF preview rendering.
- `@ocr-pipeline` - Image decode, canvas sizing, and OCR-ready preprocessing.
- `@ocr-parse` - Merchant, date, amount, tax, and line-item heuristics.
- `@ocr-ui` - Scan progress, review sheet, and user confirmation controls.
- `@platform` - Mobile/desktop capability checks.
- `@perf` - Performance-sensitive thresholds and warmup policy.
- `@privacy` - Privacy-sensitive boundaries or guarantees.

## Cross-platform loading policy

The app favors desktop speed without forcing mobile users to pay the first-scan cost on page load:

1. Desktop-class sessions warm the OCR engine during browser idle time.
2. Data Saver, 2G-class connections, and low-memory devices skip idle warmup.
3. Any scan intent (pointer, touch, or keyboard focus on scan controls) starts warmup early.
4. Manual scanning still works when warmup is skipped; the engine loads on demand.

The policy lives in `OCR_CONFIG.warmup` and `Utils.shouldWarmOcr()`.

## OCR and PDF dependencies

OCR dependencies are loaded lazily from jsDelivr:

- `ppu-paddle-ocr@5.8.0`
- `pdfjs-dist@4.10.38`
- `onnxruntime-web@1.23.2` (import map peer)
- `ppu-ocv@3.2.2` (import map peer)

Keep `OCR_CONFIG.dependencies` in `src/config.js` aligned with the `index.html` import map whenever versions change.

## Canvas sizing

Camera photos and PDF previews are normalized through shared thresholds:

- `minSide` protects OCR quality on small screenshots.
- `maxSide` limits memory and CPU on modern desktop and mobile hardware.
- `lowMemoryMaxSide` lowers peak canvas memory on constrained devices.
- `pdfMaxScale` prevents oversized first-page previews.

These values live in `OCR_CONFIG.canvas`. Avoid hard-coding OCR sizes in feature files.

## Receipt formats

Preferred inputs are JPEG, PNG, WebP, and PDF. Mobile camera flows usually produce browser-decodable images. HEIC/HEIF files are accepted so mobile pickers can surface camera-roll assets, but browser decode support varies; if a HEIC file fails, export it as JPEG/PNG or scan a PDF/screenshot.

## Privacy boundary

Receipt OCR is local-only. Images and PDFs are rendered in the browser, OCR runs against local canvas data, and the parsed result is only written after the user reviews and saves it. Do not add network upload, telemetry, or background receipt submission to the scan path.
