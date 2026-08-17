# Dependencies

OpenExpense’s ledger path is local. Some **engines and fonts** load from public CDNs so the git repo stays small. Those requests are for library files, not expenses.

## npm (bundled into `app.js` / chunks)

| Package | Why |
| --- | --- |
| [esbuild](https://esbuild.github.io/) | Dev-time bundler (`npm run build`) |
| [fflate](https://github.com/101arrowz/fflate) | Export/import zip |
| [jspdf](https://github.com/parallax/jsPDF) | Monthly summary PDF |
| [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | PDF tables |

## Loaded by `index.html`

| Resource | Host | Why |
| --- | --- | --- |
| Inter Variable | jsDelivr (`@fontsource-variable/inter`) | UI type |
| Tabler Icons | jsDelivr (`@tabler/icons-webfont`) | Header and button icons |

These stylesheets are requested for every page load (with `preconnect` + print-media swap). They do not see ledger data.

## Lazy-loaded on first receipt scan

| Resource | Host | Why |
| --- | --- | --- |
| [ppu-paddle-ocr](https://www.npmjs.com/package/ppu-paddle-ocr) | jsDelivr | On-device OCR |
| onnxruntime-web, ppu-ocv | jsDelivr (import map in `index.html`) | OCR peers |
| pdf.js | jsDelivr | Embedded PDF text + page raster |

Constants live on `Receipt` in `src/features/receipt.js`. If the CDN is blocked, typing an expense still works; only scan is unavailable.

## Design rule

A new dependency must either:

1. Be bundled (npm + esbuild), or
2. Be optional and documented here, and must never receive ledger JSON, receipt pixels, or key material.
