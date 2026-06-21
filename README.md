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

# Rebuild app.js and chunks after editing anything in src/
npm run build
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## Receipt OCR & platform support

Receipt reading is local-first and browser-native. The app accepts camera photos,
image files, HEIC/HEIF images, and PDFs through the hidden file input in
`index.html`; mobile-size/coarse-pointer devices get `capture="environment"` so
the rear camera is offered when supported. PDF invoices are parsed with embedded
text first, then fall back to OCR when needed.

The OCR stack is lazy-loaded from pinned CDN modules on first use:

| Component | Pin | Where |
| --- | --- | --- |
| `ppu-paddle-ocr` | `5.8.0` | `src/features/receipt.js` |
| `pdfjs-dist` | `4.10.38` | `src/features/receipt.js` |
| `onnxruntime-web` | `1.23.2` | `index.html` import map |
| `ppu-ocv/canvas-web` | `3.2.2` | `index.html` import map |

Cross-platform behavior is handled with progressive browser APIs:

| Surface | Primary path | Fallback |
| --- | --- | --- |
| Mobile scan | Camera/photo picker via file input | Any uploaded image/PDF file |
| Desktop import | File picker | Drag/select file input behavior from the browser |
| Desktop export | File System Access API when available | Download link |
| Mobile export | Web Share with files when available | Download link |

The receipt module exposes readable `Receipt.PIPELINE_TAGS` such as
`ocr.pdf.text-first`, `ocr.image.canvas-normalize`, and
`ocr.review.human-confirm`. Use these code tags in comments, diagnostics, and
future tests to refer to stages without inventing new labels. More implementation
notes live in [`docs/ocr-platform.md`](docs/ocr-platform.md).

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` and hashed chunks
that `index.html` loads. There's no build step on GitHub Pages — after source
edits, run `npm run build` and commit the rebuilt `app.js` plus current
`chunk-*.js` files.

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
app.js                 # Bundled entry (rebuild with `npm run build`)
chunk-*.js             # Split chunks emitted by esbuild
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## OCR performance guardrails

- Keep OCR/PDF dependencies lazy-loaded so the app shell stays small on mobile and
  desktop browsers.
- Keep receipt canvases inside the named side-length range in
  `src/features/receipt.js`; the values balance OCR detail with mobile memory and
  CPU limits.
- Prefer PDF text extraction before OCR for desktop-generated invoices.
- Keep the review-before-save flow. OCR is a suggestion layer, not an automatic
  ledger writer.
- When dependency pins change, update both `src/features/receipt.js` and the
  import map in `index.html`, then rebuild the committed bundle.

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
