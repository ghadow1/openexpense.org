# OCR receipt performance and platform guide

OpenExpense runs in the browser, so the OCR path has to balance privacy, memory use, and browser feature support across phones, tablets, and desktop computers. Receipt images and PDFs are processed locally; the first OCR scan downloads the OCR engine and model assets from the configured CDN and then relies on the browser cache.

## Source of truth

Keep OCR and platform constants in `src/config.js`:

- `OCR_CONFIG.dependencies` pins the lazy-loaded OCR/PDF URLs and the peer import-map URLs.
- `OCR_CONFIG.platformProfiles` defines canvas targets for mobile, tablet, and desktop.
- `OCR_CONFIG.progressLabels` keeps user-facing scan status text readable and consistent.
- `PLATFORM_CONFIG.breakpoints` keeps JavaScript breakpoints in sync across utility and calendar code.
- `UI_TAGS` documents human-readable action/view identifiers used by delegated UI handlers.

If you upgrade `ppu-paddle-ocr`, `pdfjs-dist`, `onnxruntime-web`, or `ppu-ocv`, update both `OCR_CONFIG.dependencies` and the import map in `index.html`. The import map is required because `ppu-paddle-ocr` imports its peer dependencies by bare specifier at runtime.

## Platform profiles

| Profile | When used | OCR canvas target | Why |
| --- | --- | --- | --- |
| `mobile` | Small screens | 900-1800 px longest side | Keeps memory and thermal load lower on mobile browsers while preserving receipt text size. |
| `tablet` | Coarse pointer or mid-size screens | 1000-2200 px longest side | Uses more pixels when the device is likely to have more memory. |
| `desktop` | Wider fine-pointer devices | 1000-2400 px longest side | Gives OCR the highest local detail budget for desktop CPUs and larger memory pools. |

`Utils.ocrProfile()` selects the current profile. Image uploads and scanned PDF fallbacks use that profile before passing a canvas to OCR.

## Scan pipeline

1. The user chooses a photo, image file, or PDF from `#receipt-scan-input`.
2. Images are decoded by the browser, drawn to a white canvas, then resized to the current platform profile.
3. PDFs first go through `pdfjs-dist` text extraction. If enough text is embedded, OCR is skipped and the parser receives the extracted text.
4. If OCR is needed, `ppu-paddle-ocr` is lazy-loaded from the CDN and runs entirely in the browser.
5. Parsed merchant, amount, date, tax, and line items appear in a review sheet. The user confirms or edits before anything is saved.

## Mobile and desktop capabilities

- Mobile capture uses `capture="environment"` when the browser reports a coarse pointer or camera-sized screen.
- Mobile layout uses the scan floating action button, safe-area padding, and touch-friendly controls.
- Desktop exports use the File System Access API when available and secure.
- Mobile exports prefer Web Share with files when supported, with download fallback everywhere else.
- `navigator.connection.saveData` and very slow effective connection types skip idle OCR warmup. Manual scans still load OCR on demand.

## Known limitations

- HEIC/HEIF files are accepted, but decoding depends on the browser and operating system.
- OCR and PDF reader assets need a network connection on first use unless they are already cached.
- Scanned multi-page PDFs currently render the configured preview page for OCR fallback; embedded text is still extracted from all pages.
- Receipt parsing is heuristic and should remain human-in-the-loop.

## Upgrade checklist

1. Update dependency URLs in `OCR_CONFIG.dependencies`.
2. Update the matching import-map URLs in `index.html`.
3. Run `npm run validate`.
4. Confirm the generated `app.js` and current `chunk-*.js` files are committed.
5. Manually smoke-test a photo receipt and a PDF invoice in a secure browser context (`https://` or `localhost`).
