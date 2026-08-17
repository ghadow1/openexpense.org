# Dependencies

OpenExpense’s ledger path is local. Production executable code, OCR/PDF runtimes and models, fonts, and icons are bundled or served from the OpenExpense origin.

## npm (bundled into `app.js` / chunks)

| Package | Why |
| --- | --- |
| [esbuild](https://esbuild.github.io/) | Dev-time bundler (`npm run build`) |
| [fflate](https://github.com/101arrowz/fflate) | Export/import zip |
| [jspdf](https://github.com/parallax/jsPDF) | Brochure monthly PDF |
| [ppu-paddle-ocr](https://www.npmjs.com/package/ppu-paddle-ocr) | On-device OCR, lazy bundled |
| [onnxruntime-web](https://www.npmjs.com/package/onnxruntime-web) | Local OCR inference runtime |
| [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) | Embedded PDF text and page raster |

## Vendored assets

Runtime binaries, reviewed OCR models, Inter Variable (`@fontsource-variable/inter` 5.3.0), and Tabler Icons (`@tabler/icons-webfont` 3.46.0) are committed under `vendor/`. Checksums are recorded in `vendor/SHA256SUMS`. Receipt runtimes and models load only when needed.

## Design rule

A new dependency must be version-locked, reviewed, documented here, pass the security workflow, and be bundled or served from the application origin. No dependency may receive ledger JSON, receipt pixels, or key material.
