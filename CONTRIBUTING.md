# Contributing

OpenExpense is a static browser app. Source lives in `src/`, and the generated deployment assets (`app.js` plus `chunk-*.js`) are committed for GitHub Pages.

## Local workflow

```bash
npm install
npm run serve
npm run build
```

Open http://localhost:8765 through the local server. Do not test by double-clicking `index.html`; encryption, file APIs, and other browser features need a secure context.

## Build assets

`npm run build` removes old generated assets before running esbuild. Commit the rebuilt `app.js` and the active `chunk-*.js` files with any source changes that affect the bundle.

## OCR receipt changes

Receipt scanning is local-only. Keep these invariants intact:

- No receipt image, PDF, OCR text, or parsed expense data is uploaded.
- OCR dependency pins and scan labels belong in `OCR_CONFIG` in `src/config.js`.
- Import-map peer dependency pins in `index.html` should match `OCR_CONFIG.peerImportMap`.
- Use the code tag `OCR_RECEIPT_PIPELINE_V1` in logs, docs, or DOM state related to the receipt pipeline.
- Mobile/coarse-pointer devices should avoid eager model downloads and oversized canvases.
- Desktop/high-end devices can use idle warm-up and larger OCR canvas limits.

See `docs/ocr-platform.md` for the pipeline and platform profiles.
