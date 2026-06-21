# Contributing

OpenExpense is a static browser app. Keep changes small, rebuild generated
assets, and validate privacy-sensitive flows locally before opening a pull
request.

## Local workflow

```bash
npm install
npm run serve
npm run build
```

Open `http://localhost:8765` from the local server. Do not use `file://`;
encrypted storage and modern browser APIs require a secure context.

## Generated assets

Source lives in `src/`. GitHub Pages serves the checked-in bundle files, so any
change under `src/` must be followed by:

```bash
npm run build
```

Commit the regenerated `app.js` and current `chunk-*.js` files with the source
change. If esbuild emits new chunk hashes, remove stale generated chunks that
are no longer referenced by `app.js`.

## Receipt OCR changes

Receipt scanning is local-only and should stay review-first: OCR may suggest
fields, but the user confirms before the ledger is updated.

When touching `src/features/receipt.js`, `src/config.js` OCR settings, or the
scan UI:

- Keep OCR CDN pins and import-map peer pins documented in
  `docs/ocr-platform.md`.
- Preserve the human-readable code tags in `OCR_CONFIG.codeTags`.
- Validate at least one mobile camera capture path and one desktop upload path.
- Check a selectable-text PDF and an image-only PDF or screenshot.
- Confirm the review sheet remains editable before saving.
