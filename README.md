# [openexpense.org](https://www.openexpense.org)

**A privacy-first, local-first expense tracker. Your data never leaves your browser.**

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

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero backend** — no accounts, database, analytics, or ledger-data API calls. Static app/OCR assets can be fetched from CDNs, then run locally in the browser.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5) and PDF text extraction; receipt images and parsed text never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into a single `app.js` that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt `app.js`.

```
src/
├── config.js          # CONFIG, DAYS, STORAGE_KEYS, OCR_CONFIG, BREAKPOINTS, CODE_TAGS, THEMES
├── main.js            # Bootstrap + store subscription
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   └── utils.js
├── ui/                # components, theme, toast
├── features/
│   ├── receipt.js     # OCR/PDF engine lifecycle, preprocessing, progress/review UI
│   ├── receipt-parser.js # Testable merchant/date/amount parser heuristics
│   └── ...            # calendar, ledger (autosave + export/import), modal, sidebar
└── app/               # render orchestration, view switching
app.js                 # Bundled entry (rebuild with `npm run build`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

The receipt scanner is designed for current mobile and desktop browsers while keeping the ledger private:

- **Asset loading**: `src/config.js` pins OCR/PDF runtime URLs in `OCR_CONFIG`. `index.html` pins the peer import map required by `ppu-paddle-ocr`. Keep those versions in sync.
- **Local processing**: first scan downloads the OCR/PDF runtime assets from jsDelivr; photos, PDFs, OCR text, and parsed expense fields stay in the browser.
- **Mobile capture**: touch/coarse-pointer devices prefer `capture="environment"` so phones can open the rear camera directly.
- **Desktop capability path**: desktop browsers can use the File System Access save picker for exports; mobile devices prefer the share sheet when available.
- **Performance guardrails**: OCR input canvases are scaled to the shared `OCR_CONFIG.imageBounds` range (large enough for recognition, bounded for memory). Idle warmup is skipped on data-saver, very slow connections, and very low-memory devices.
- **PDF behavior**: PDFs are text-extracted first across all pages. If useful text is found, OCR is skipped; otherwise the first page is rendered to canvas and scanned.
- **HEIC/HEIF caveat**: the file picker accepts HEIC/HEIF because modern mobile browsers often decode them, but unsupported desktop browsers may need a JPEG/PNG export or screenshot.
- **Human-readable tags**: code comments and UI shells use tags such as `OCR_INPUT`, `OCR_ENGINE`, `OCR_PREPROCESS`, `OCR_PARSE`, `OCR_REVIEW`, and `data-code-tag="ocr-review"` to make the scanning pipeline searchable.

For deeper contributor notes, see `docs/OCR-PERFORMANCE.md`.

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
