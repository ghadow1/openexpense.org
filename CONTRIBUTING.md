# Contributing to OpenExpense

Thank you for helping keep a small, offline expense tracker easy to read and safe to run.

## What this project is

A static site. Source lives in `src/`. esbuild writes `app.js` and hashed `chunk-*.js` for [GitHub Pages](https://www.openexpense.org). There is no server-side code and no user accounts.

Please keep it that way. New features should work with the ledger already on the device.

## Before you start

1. Read [`CHANGELOG.md`](CHANGELOG.md) (user-facing notes), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and [`src/README.md`](src/README.md).
2. Use a secure context (`localhost` or `https`). `file://` will fail encryption and some APIs.
3. Do not commit a real ledger, receipts, or key files.

```bash
npm install
npm run serve          # http://localhost:8765
npm run build          # after any src/ change
```

## Ground rules

- **No backend.** No analytics, accounts, or remote ledger storage.
- **No new pages or routes.** The product has two views: Expenses (`#view-app`) and Privacy & Help (`#view-docs`). Wire new UI into those shells.
- **Do not edit `app.js` or `chunk-*.js` by hand.** Change `src/`, then `npm run build`.
- **Leave live DOM ids alone** unless the change requires it: `#modal`, `#ledger-name-input`, `[data-action]`, `[data-view]`, `[data-tab]`.
- **Encryption stays local.** Autosave uses `src/core/crypto.js` + `persist.js`. Export uses `src/core/bundle.js`. Treat those files as security-sensitive.
- **Match the existing style.** Vanilla ES modules, short module headers, design-system CSS classes instead of one-off inline colors.

## Suggested workflow

1. Branch from `main`.
2. Change the smallest set of `src/` files that solves the issue.
3. Run `npm run build` and commit **source + rebuilt bundles** together.
4. Open a pull request with what changed, how you tried it, and any risk to encryption or import/export.

## Where to put new code

| Kind of change | Folder |
| --- | --- |
| Shared state or persistence | `src/core/` |
| Calendar, editor, files, OCR, summary UI | `src/features/` |
| Reusable controls, theme, toasts | `src/ui/` |
| View switching / header orchestration | `src/app/` |
| Tokens, version, preference keys | `src/config.js` |
| Architecture notes | `docs/` |

Export only what other modules import. Keep helpers file-private.

## Testing locally

There is no automated test suite yet. Before you open a PR, click through:

- Add, edit, and delete an expense, including a recurring series.
- Toggle theme and autosave. Confirm the privacy and file-loaded chips update.
- Export a zip, then import it in a fresh browser profile (or after clearing the site data).
- If you touched OCR: scan a paper receipt photo, a screenshot, and a PDF if you can.

## Reporting issues

Use GitHub issues for bugs and ideas. Include browser, OS, and whether you opened the app on `localhost` or the public site.

For vulnerabilities, follow [`SECURITY.md`](SECURITY.md) instead of a public issue.
