# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)

## Quick start

```bash
# Install the local build toolchain
npm install

# Start the local dev server (http://localhost:8765)
npm run serve

# Kill the dev server when you're done
pkill -f "http.server 8765"

# Rebuild app.js and chunk-*.js after editing anything in src/
npm run build
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` and hashed `chunk-*.js` files that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt bundle files.

```
src/
├── config.js          # CONFIG, DAYS, STORAGE_KEYS, THEMES
├── main.js            # Bootstrap + store subscription
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   └── utils.js
├── ui/                # components, theme, toast
├── features/          # calendar, ledger (autosave + export/import), modal, receipt, sidebar
└── app/               # render orchestration, view switching
docs/ocr-platform.md   # OCR pipeline, platform requirements, performance notes
app.js                 # Bundled entry (rebuild with `npm run build`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

Receipt scanning is fully client-side. `src/features/receipt.js` handles the scan button flow, lazy-loads PP-OCRv5 and PDF.js from pinned CDN URLs in `OCR_CONFIG`, extracts PDF text before falling back to OCR, parses likely receipt fields, then shows a review sheet before anything is saved.

The OCR module is tagged with human-readable section names and `OCR_CONFIG.codeTags`:

- `receipt-ocr-engine` — lazy OCR loading, model warmup, ONNX Runtime Web execution.
- `receipt-pdf-text-layer` — PDF.js text extraction and first-page preview rendering.
- `receipt-image-canvas` — mobile/desktop canvas sizing for OCR quality and memory control.
- `receipt-parser` — merchant, amount, tax, date, and line-item heuristics.
- `receipt-review` — editable review UI and save flow.

See [docs/ocr-platform.md](docs/ocr-platform.md) for browser support notes, mobile/desktop performance guidance, and the manual scan checklist.

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
