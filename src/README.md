# Source map

Edit these files. Then run `npm run build` so GitHub Pages gets a new `app.js`.

Each module starts with a short header describing what it owns.

## Entry and config

| File | Role |
| --- | --- |
| [`main.js`](main.js) | Boot, delegated clicks, render subscription |
| [`../docs/SEO-HEAD.html`](../docs/SEO-HEAD.html) | Canonical Open Graph / JSON-LD head snippet |
| [`config.js`](config.js) | Version, `STORAGE_KEYS`, `THEMES`, weekday labels |

## `app/` — shell

| File | Role |
| --- | --- |
| [`app/render.js`](app/render.js) | Theme + calendar + sidebar + status chips |
| [`app/views.js`](app/views.js) | Expenses vs Privacy & Help; welcome modal |

## `core/` — data and crypto

| File | Role |
| --- | --- |
| [`core/store.js`](core/store.js) | `getState`, `patch`, `subscribe` |
| [`core/persist.js`](core/persist.js) | Encrypted IndexedDB autosave |
| [`core/crypto.js`](core/crypto.js) | Device AES-256-GCM key |
| [`core/bundle.js`](core/bundle.js) | Encrypted ledger.json + portable key.json |
| [`core/ledger-file.js`](core/ledger-file.js) | File QC, sanitize (import + IndexedDB load/save), filename pair |
| [`core/utils.js`](core/utils.js) | Dates, money, escape, tooltips |
| [`core/series.js`](core/series.js) | Recurring grouping, cadence (monthly / bi-monthly / quarterly), series delete |
| [`core/summary.js`](core/summary.js) | Month/year totals |
| [`core/summary-pdf.js`](core/summary-pdf.js) | PDF layout |
| [`core/pdf-theme.js`](core/pdf-theme.js) | PDF colors and fonts |

## `features/` — product surfaces

| File | Role |
| --- | --- |
| [`features/calendar.js`](features/calendar.js) | Month grid |
| [`features/modal.js`](features/modal.js) | Day editor |
| [`features/ledger.js`](features/ledger.js) | Import, export, autosave toggle, name |
| [`features/receipt.js`](features/receipt.js) | Camera / file OCR |
| [`features/receipt-parse.js`](features/receipt-parse.js) | Merchant, date, total from text |
| [`features/sidebar.js`](features/sidebar.js) | Expense / income summary (coin-flip card) |

## `ui/` — chrome

| File | Role |
| --- | --- |
| [`ui/components.js`](ui/components.js) | `UI.createButton`, `UI.createInput` |
| [`ui/theme.js`](ui/theme.js) | CSS variables from `THEMES` |
| [`ui/toast.js`](ui/toast.js) | Status toasts |
| [`ui/confirm.js`](ui/confirm.js) | Confirm dialog + optional checkbox |

## Public exports

A module should export only what another file imports. Helpers stay file-private so the tree stays easy to scan.

Do not rename `data-action` values or element ids in `index.html` without updating `main.js` and the feature that owns them.
