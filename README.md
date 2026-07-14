# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)

## Quick start

```bash
# Install dependencies the first time you work in the repo
npm ci

# Start the local dev server (http://localhost:8765)
npm run serve

# Kill the dev server when you're done
pkill -f "http.server 8765"

# Rebuild generated assets after editing anything in src/
npm run validate
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero app backend** — no accounts, no database, and no API that receives your ledger.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device. First use downloads OCR/PDF reader assets and then relies on the browser cache.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` and hashed `chunk-*.js` files that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt generated assets.

```
src/
├── config.js          # CONFIG, OCR_CONFIG, PLATFORM_CONFIG, UI_TAGS, themes
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
docs/OCR-PERFORMANCE.md # OCR, platform profiles, and dependency upgrade notes
scripts/clean-build-assets.mjs # Removes stale generated assets before build
app.js                 # Bundled entry (rebuild with `npm run validate`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR and platform performance

Receipt OCR is configured from `OCR_CONFIG` in `src/config.js`. The app lazy-loads `ppu-paddle-ocr` and `pdfjs-dist` only when scanning is needed, while `index.html` provides the import map for the OCR peer dependencies. Keep those versions in sync when upgrading.

`Utils.ocrProfile()` chooses mobile, tablet, or desktop preprocessing targets before images or scanned PDFs are passed to OCR. Mobile profiles use smaller canvases to reduce memory and heat; desktop keeps a larger pixel budget for better recognition. Idle OCR warmup is skipped on data-saver or very slow connections, but manual scans still load the engine on demand.

See [`docs/OCR-PERFORMANCE.md`](docs/OCR-PERFORMANCE.md) for the platform matrix, dependency upgrade checklist, known OCR limits, and the human-readable UI tag conventions.

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
