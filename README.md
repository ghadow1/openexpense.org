# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)

## Quick start

```bash
# Start the local dev server (http://localhost:8765)
npm run serve

# Kill the dev server when you're done
pkill -f "http.server 8765"

# Rebuild app.js after editing anything in src/
npm run build
```

Then open http://localhost:8765 in your browser. Open it through the server, not by double-clicking `index.html` -- encryption and several modern browser APIs need a secure context.

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images and PDFs never leave your device.
- **Cross-platform** — responsive layout, desktop save-picker, mobile share fallbacks, and platform-aware OCR canvas sizing.

## Receipt OCR and platform resources

Receipt reading is intentionally local-first. The browser lazily loads the OCR stack only when scanning is likely:

- `ppu-paddle-ocr@5.8.0` for OCR.
- `onnxruntime-web@1.23.2` and `ppu-ocv@3.2.2` as import-map peers in `index.html`.
- `pdfjs-dist@4.10.38` only for PDF invoices.

The source of truth for OCR versions, progress labels, human-readable code tags, confidence thresholds, and mobile/desktop canvas limits is `OCR_CONFIG` in `src/config.js`. The runtime tag is `OCR_RECEIPT_PIPELINE_V1`, which appears in scan progress DOM attributes and OCR error logs.

`src/core/utils.js` classifies the browser as `mobile`, `balanced`, `desktop`, or `highEnd` using viewport, pointer, memory, and CPU hints. `src/features/receipt.js` uses that profile to keep lower-memory mobile scans smaller while allowing sharper OCR input on desktop-class hardware. PDF files use embedded text first; OCR canvas preparation is skipped when a PDF already contains enough text to parse.

More details: [`docs/ocr-platform.md`](docs/ocr-platform.md).

## How it works

OpenExpense is ES modules under `src/`, bundled into a single `app.js` that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt `app.js`.

```
src/
├── config.js          # CONFIG, DAYS, STORAGE_KEYS, THEMES
├── main.js            # Bootstrap, responsive bindings, OCR warm-up
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   ├── summary.js     # Monthly totals and insights
│   ├── summary-pdf.js # Monthly PDF report generation
│   ├── pdf-theme.js   # PDF color/theme helpers
│   └── utils.js
├── ui/                # components, theme, toast, confirm
├── features/          # calendar, ledger (autosave + export/import), modal, receipt, sidebar
└── app/               # render orchestration, view switching
app.js                 # Bundled entry (rebuild with `npm run build`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

The root `app.js` and `chunk-*.js` files are generated deployment assets for GitHub Pages and should be committed after source edits. `npm run build` runs `scripts/clean-build-assets.mjs` first, so stale hashed chunks are removed before esbuild writes the current bundle.

## Data format

Calendar dates map to expense records. This is the shape used in exports and inside the encrypted record.

```json
{
  "name": "GBA Expenses",
  "events": {
    "2026-06-03": [
      { "title": "API Hosting", "price": 49.99, "recurring": true }
    ]
  }
}
```

## Encryption & storage

- **Autosave = encrypted local storage.** Changes are debounced and written to the `openexpense` IndexedDB (v2), encrypted with AES-256-GCM. No files are involved — autosave never touches the disk as plaintext. It's on by default; the header disk button pauses it (changes then stay in memory only until re-enabled).
- The AES-GCM key is stored **non-extractable**, so its raw bytes can't be read back — even from devtools.
- Only non-sensitive UI prefs (theme, autosave on/off, first-visit) use `localStorage`. The ledger name and entries never do.
- **Export** is an encrypted `.zip` (via [`fflate`](https://github.com/101arrowz/fflate)) with `ledger.enc.json` (ciphertext) + `ledger.key.json` (the key) + `README.txt`. Anyone with both files can decrypt — for sensitive backups, store or send them separately.
- **Import** auto-detects: a full zip, a key and encrypted file loaded separately (in any order), or a legacy plaintext `.json`.
