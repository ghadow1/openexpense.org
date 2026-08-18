# Security policy

OpenExpense is a client-only app. There is no application server and no account system. A vulnerability is anything that lets someone else read or change a ledger that should have stayed on the owner’s device — or that ships a user’s expense data off-device.

## Supported versions

Please report issues against the current `main` branch and the site at [https://www.openexpense.org](https://www.openexpense.org).

## How to report

Use [GitHub Security Advisories](https://github.com/ghadow1/openexpense.org/security/advisories/new) so the report stays private until a fix is ready.

If advisories are unavailable, contact the repository owner through GitHub. Do not open a public issue for a working exploit.

Please include:

- What a person would need (physical access, another page on the same origin, a crafted import file, …)
- Browser and OS
- Steps that stay as small as possible

## What is in scope

- Reading or rewriting the IndexedDB ledger without the owner’s action
- Extracting the non-extractable device key, or weakening AES-GCM wrapping
- Importing a backup that executes script or writes outside the ledger object
- Sending expense text, images, or keys to a host other than the user’s chosen download/share
- XSS through titles, notes, or imported JSON

## What is out of scope

- Someone with this browser profile (or its unencrypted disk image) opening DevTools
- A stolen encrypted ledger.json when the recipient also has the matching key.json
- Availability of the same-origin OCR/PDF runtime assets and models
- Opening the app as `file://` (not a supported secure context)

## Design notes

- Autosave ciphertext uses a **non-extractable** Web Crypto key in IndexedDB (`src/core/crypto.js`). That key is never written as `key.json`. The record's own header is bound in as additional authenticated data, so a record cannot be restamped or relabelled and still open.
- Export creates a **new** 32-byte master secret per save and downloads it only as `key.json` beside the encrypted ledger (`src/core/bundle.js`, `src/core/envelope.js`). HKDF-SHA-256 splits that secret into the AES-256-GCM key and a published key commitment, which is checked before decryption — AES-GCM alone is not key-committing. The whole envelope header is authenticated, so no field can be edited without breaking decryption.
- The secret is not stored in the browser. Without a passphrase, treat the two files as one secret, or keep them apart.
- **Optional passphrase**: the master secret is wrapped under PBKDF2-HMAC-SHA-256 at 600,000 iterations (OWASP 2023), so `key.json` alone is useless. The iteration count is authenticated and floored on read so it cannot be downgraded. PBKDF2 is the strongest passphrase KDF available natively in Web Crypto; it is not memory-hard like Argon2id, a deliberate trade to keep the crypto free of third-party and WASM code. A forgotten passphrase cannot be recovered.
- `localStorage` holds only theme, autosave on/off, first-visit, sidebar face, dashboard view, and whether exports should ask for a passphrase. The passphrase itself is never stored.
- Receipt images are drawn to a canvas and parsed in-page. Executable OCR/PDF code, models, fonts, and icons are served from the OpenExpense origin; receipt contents are not uploaded by the application.

See [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md), [`docs/SECURITY-AUDIT-2026-08-17.md`](docs/SECURITY-AUDIT-2026-08-17.md), and [`docs/SOC2-READINESS.md`](docs/SOC2-READINESS.md).
