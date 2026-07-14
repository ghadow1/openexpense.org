# OCR performance and platform guide

OpenExpense receipt reading is designed for privacy first: photos, PDFs, and parsed text stay in the browser. The app uses current web platform capabilities to make the same OCR flow work on mobile and desktop without a server.

## Human-readable code tags

Shared tags and limits live in `src/config.js`:

- `UI_TAGS` names user-facing capability surfaces such as receipt OCR, mobile camera capture, desktop save picker, and offline private processing.
- `OCR_CONFIG` pins OCR/PDF dependencies, canvas sizing, progress labels, first-scan copy, and parser confidence thresholds.
- `PLATFORM_CONFIG` defines responsive breakpoints, idle OCR warm-up timing, and object URL cleanup delays.

When changing OCR, camera, upload, export, or responsive behavior, update these named objects first and then update the consuming feature.

## OCR technology

- **OCR engine:** PP-OCRv5 via `ppu-paddle-ocr` lazy import.
- **Inference runtime:** `onnxruntime-web` from the `index.html` import map.
- **Image preprocessing:** browser canvas with bounded dimensions before recognition.
- **PDF handling:** PDF.js reads embedded text first, then renders the first page for preview and scanned-PDF OCR fallback.
- **Processing boundary:** there is no server upload path; OCR and parsing happen on the device.

## Mobile considerations

- The scan picker requests the environment camera when the viewport or pointer suggests a phone/tablet.
- Canvas input is bounded between `OCR_CONFIG.canvas.minSide` and `OCR_CONFIG.canvas.maxSide` to balance OCR clarity with mobile memory use.
- Idle model warm-up is skipped when `navigator.connection.saveData` is enabled or the browser reports a very slow connection.
- First scan still works on demand; users on constrained networks are not forced into background model downloads.

## Desktop considerations

- Desktop users can upload image files or PDFs through the same scan input.
- Export uses the File System Access API when available in a secure context, then falls back to mobile share or a standard download link.
- Larger desktop screens use wider calendar densities while still sharing the same receipt parsing and review flow.

## Upgrade checklist

1. Update `OCR_CONFIG.dependencies` and the matching `index.html` import map pins together.
2. Verify first scan, warm scan, image upload, and PDF-with-text behavior in a secure context (`https://` or `localhost`).
3. Check a mobile browser with camera capture and a desktop browser with file upload/export.
4. Run `npm run validate` so generated `app.js` and `chunk-*.js` assets are rebuilt from `src/`.
