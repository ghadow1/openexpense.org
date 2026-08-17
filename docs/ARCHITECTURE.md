# Architecture

OpenExpense is a single-page static app. The browser is the runtime. There is no API.

```
index.html          two views + day modal + welcome
        │
        ▼
src/main.js         boot, event delegation, render subscription
        │
        ├─► core/store.js      getState / patch / subscribe
        ├─► core/persist.js    encrypted IndexedDB (debounced)
        ├─► app/render.js      theme, calendar, sidebar, status chips
        ├─► app/views.js       Expenses ↔ Privacy & Help
        └─► features/*         calendar, modal, ledger, receipt, sidebar
```

## Boot

1. `index.html` loads design CSS, icon/font CDNs, and the bundled `app.js`.
2. `main.js` reads theme and autosave prefs from `localStorage`.
3. `loadLedger()` decrypts the IndexedDB record (if any) into `{ name, events }`.
4. `patch()` fills the store; `initPersist()` starts watching for later writes.
5. Clicks on `[data-action]`, `[data-view]`, and `[data-tab]` are delegated from `document`.

## State

`src/core/store.js` holds:

| Field | Role |
| --- | --- |
| `events` | `{ "YYYY-MM-DD": Expense[] }` |
| `ledgerName` | Display / export name |
| `currentDate` | Visible month |
| `isDark` | Theme |
| `autosaveEnabled` | Whether persist writes |
| `storageEncrypted` | Web Crypto available |
| `selectedKey` | Open day (`YYYY-MM-DD`) or `null` |
| `editingIndex` | Row being edited in that day |

`patch(partial)` merges fields and notifies subscribers. The render loop in `main.js` coalesces those notifications into one animation frame.

## Persistence

- **Autosave** (`persist.js` + `crypto.js`): encrypt `{ name, events }` with a device-scoped AES-256-GCM key and put it in IndexedDB database `openexpense`, store `ledger`, key `current`.
- **Export** (`bundle.js` + `ledger.js`): new key per backup, zip of `ledger.enc.json` + `ledger.key.json` + `README.txt`.
- **Import**: zip, the two files in either order, or legacy plaintext JSON.

`localStorage` never holds expenses. It only stores `oe-theme`, `oe-autosave`, and `hasVisited`.

## UI layers

| Layer | Job |
| --- | --- |
| `ui/` | Theme tokens on `:root`, buttons/inputs, toasts, confirm dialog |
| `features/calendar.js` | Month grid; same-title pills collapse (`Coffee ×2`) |
| `features/modal.js` | Day editor; recurring series delete |
| `features/sidebar.js` | Month math + PDF |
| `features/receipt.js` | On-device OCR / PDF, then `receipt-parse.js` |
| `app/render.js` | When to repaint, plus the “You own your data” / “File loaded” chips |

## Recurring series

`src/core/series.js` treats two expenses as the same series when both are `recurring`, their titles match after trim + lower-case, and they share the same `repeat` cadence (`monthly`, `bimonthly`, or `quarterly`; missing means monthly). The day editor copies about a year of future dates at that step and can remove every occurrence across the ledger.

## Receipts

`receipt.js` lazy-loads PP-OCRv5 (and pdf.js for PDFs) from jsDelivr. Images are oriented and contrast-enhanced in a canvas, recognized locally, then parsed. `saveExpense()` writes the result like a manual add.

## Build

```
npx esbuild src/main.js --bundle --format=esm --minify --splitting --outdir=.
```

Output names: `app.js`, `chunk-[hash].js`. Pages has no build job — commit the new files and delete stale chunks that `app.js` no longer imports.

## What not to add

- A server, database, or auth provider
- A third top-level view or client-side router
- Analytics or error-reporting that uploads ledger text
- Hand-edited bundles
