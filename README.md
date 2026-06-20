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

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into a single `app.js` that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt `app.js`.

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
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

Receipt scanning lives in `src/features/receipt.js` and runs entirely in the browser:

1. The Scan button opens the hidden `#receipt-scan-input`. Mobile/coarse-pointer devices request the rear camera with `capture="environment"`.
2. PDFs are parsed text-first with PDF.js. If usable text is found, OCR is skipped; scanned/image PDFs fall back to OCR on the first rendered page.
3. Images are resized into an OCR-friendly canvas between 1000px and 2400px on the longest side to balance accuracy and mobile memory use.
4. PP-OCRv5 is lazy-loaded only when needed. Idle warmup runs after boot on capable devices, but data-saver, 2G, and very low-memory devices wait until the first scan.
5. Parsed merchant, total, tax, date, and notes are suggestions. The review sheet must be confirmed before anything is written to the ledger.

Human-readable `@codeTag` comments and `data-oe-receipt` attributes label the major receipt flow stages (`receipt-input`, `receipt-engine`, `receipt-pdf`, `receipt-parser`, and `receipt-review`) so maintainers and browser automation can identify them without relying on minified bundles.

## Cross-platform performance notes

| Capability | Desktop browsers | Mobile browsers |
| --- | --- | --- |
| Receipt input | File picker for images and PDFs | Camera capture hint plus file picker |
| OCR loading | Idle warmup when network and memory look healthy | Deferred on data-saver, 2G, or low-memory devices |
| Export | File System Access save picker when available | Web Share sheet when files can be shared |
| Fallbacks | Download link and manual file import | Download link and manual file import |

Large receipts and PDFs are capped before OCR to avoid excessive canvas memory. Browser HEIC/HEIF support varies; if a phone photo cannot be decoded, take a JPEG screenshot or export the receipt as PDF. The receipt-PDF reader (`pdfjs-dist`) is separate from the monthly spending report exporter (`jspdf`).

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
