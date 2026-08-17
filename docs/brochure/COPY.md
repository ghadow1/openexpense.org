# OpenExpense marketing brochure — copy and asset inventory

Publication: OpenExpense Product Brochure · Version 2.2.0 · August 2026  
Format: A4 landscape, 6 pages · Colors: print-safe hex from the live theme  
Live site: https://www.openexpense.org  
Source: https://github.com/ghadow1/openexpense.org

## Visual identity (extracted)

| Token | Hex | Use |
| --- | --- | --- |
| Brand navy | `#002244` | Header, cover, back cover |
| Deep navy | `#081c38` | Dark-mode header / cover shade |
| Accent blue | `#1170cf` | Primary actions, links, selected day |
| Accent hover | `#0a4d9a` | Pressed / hover navy-blue |
| Income green | `#059669` | Income figures, paid/received |
| Success | `#16a34a` | Positive chips |
| Danger | `#b91c1c` | Negative funds |
| Ink | `#1a202c` | Headings |
| Body | `#2d3748` | Body copy |
| Muted | `#64748b` | Hints, labels |
| Paper | `#f3f1eb` | Brochure page ground |
| Surface | `#ffffff` | Cards |
| Surface 2 | `#f0f4f8` | Recessed panels |
| Border | `#c5d0dc` | Hairlines |
| Pill fill | `#e8f1fb` | Calendar chips |

Typography: Inter Variable (100–900). Headings 750–800, labels 700 uppercase 0.06em, body 400–500. Aesthetic: high-contrast utility banking — navy chrome, green money-in, square 2px radii, no glassmorphism.

Target audience: privacy-first households, contractors, and teams who want a calendar wallet without accounts or a cloud ledger. Secondary: banks and fintechs that prefetch transactions and embed the engine.

## Page 1 — Cover

- Kicker: Product brochure · Version 2.2.0
- Title: OpenExpense
- Subtitle: Encrypted local expense wallet
- Tagline: Current funds, projected income, and a calendar that never leaves this browser.
- Meta: openexpense.org · MIT License · August 2026
- Hero vector: navy field, arc grid, credit-card mark, lock chip
- Photo marker: `[PHOTO: navy header + snapshot chips, 16:9]`

## Page 2 — Overview

Headline: Your ledger stays on your device.  
Lead: OpenExpense is a static, account-free calendar wallet. AES-256-GCM wraps the ledger in this browser. Export writes an encrypted JSON plus a key you keep.

Differentiators:
1. Zero servers — no API, no analytics, no account.
2. Settled funds — paid income minus paid spend through today.
3. One file — expense and income in a single events map.
4. Host-ready — banking apps can inject prefetched rows; OpenExpense does not call Plaid.

Architecture strip: Browser → Store → Encrypted IndexedDB → Optional key.json export.

## Page 3 — Features

- Calendar wallet — month grid, net badges, drag between days
- Snapshot slides — Overview, Income, Expenses
- Recurring series — weekly through quarterly
- Encrypted autosave — non-extractable device key
- Portable export — ledger.json + key.json
- On-device OCR — receipts and PDFs stay local
- Monthly PDF reports — generated in the browser
- Embed engine — map, categorize, set/get calendar data

## Page 4 — Workflow

1. Open https://www.openexpense.org on https or localhost.
2. Name the ledger. Autosave encrypts in IndexedDB.
3. Tap a day. Add expense or income. Mark paid or received.
4. Scan a receipt if you want a draft line.
5. Export the encrypted pair. Keep both files.
6. Import later with the matching key.json.

## Page 5 — Showcase and specs

- SVG mockups: snapshot chips, August calendar, income paycheck pills
- Specs: AES-256-GCM, IndexedDB, GitHub Pages, MIT, v2.2.0
- Privacy: no accounts, no first-party ledger upload, portable key never stored in the browser
- Deploy: static files; encryption requires a secure context

## Page 6 — Back cover

- CTA: Open the wallet at openexpense.org
- Start: `npm install && npm run serve`
- Links: site, GitHub, security advisories, docs/EMBED.md
- Copyright: © 2026 Gregory Medina · MIT License

## Vectors

All illustrations are inline SVG in `openexpense-brochure.html` using the tokens above. No third-party icon font is required for print.
