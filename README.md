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

# Clean stale chunks and rebuild deployment assets
npm run validate
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero app servers** — no backend and no database; OCR assets are lazy-loaded from a CDN, while receipt and ledger data stay in your browser.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); receipt images are processed locally, with a review step before anything is saved.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into a single `app.js` that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt `app.js`.

```
src/
├── config.js          # CONFIG, DAYS, STORAGE_KEYS, THEMES, OCR_CONFIG, CODE_TAGS
├── main.js            # Bootstrap + store subscription
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   └── utils.js
├── ui/                # components, theme, toast
├── features/          # calendar, ledger (autosave + export/import), modal, receipt OCR, sidebar
└── app/               # render orchestration, view switching
app.js                 # Bundled entry (rebuild with `npm run build`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

Receipt scanning is browser-only and human-in-the-loop:

1. `src/features/receipt.js` accepts image files or PDFs from the Scan button.
2. PDFs are handled with PDF.js first. If embedded text is available, the app parses that text without running image OCR.
3. Photos, screenshots, and scanned PDFs are rendered to a canvas and read by PP-OCRv5 (`ppu-paddle-ocr`) through ONNX Runtime Web.
4. Parsed merchant, amount, date, tax, and line-item suggestions are shown in a review sheet. The ledger is updated only after the user confirms.

The OCR, PDF, and peer dependency URLs are centralized in `OCR_CONFIG` inside `src/config.js`; the peer import map in `index.html` must stay in sync with that config. The first OCR scan downloads and browser-caches the OCR engine/model resources from jsDelivr; receipt content itself is processed in the browser and is not uploaded by OpenExpense.

Cross-platform performance settings also live in `OCR_CONFIG`. Mobile browsers use smaller OCR canvases to reduce memory pressure and battery drain, tablets use a middle tier, and desktop browsers keep the highest resolution path. Idle OCR warmup is skipped on data-saver, very slow connections, or very low-memory devices; manual scans still load OCR on demand.

Human-readable code tags are exported as `CODE_TAGS` in `src/config.js` and applied to key receipt scanning UI nodes through `data-code-tag` attributes. Use those tags when debugging, documenting, or writing future automated checks.

See `docs/OCR-PERFORMANCE.md` for the tuning matrix and maintenance notes.

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
