# Data format

This is the shape stored inside encrypted IndexedDB and inside a decrypted export.

## Ledger object

```json
{
  "name": "Home ledger",
  "events": {
    "2026-06-03": [
      {
        "title": "Transit pass",
        "price": 49.99,
        "recurring": true,
        "repeat": "monthly",
        "paid": true,
        "note": "90-day reload"
      }
    ]
  },
  "budgets": {
    "Groceries": 400
  },
  "savedAt": 1780000000000
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `name` | no | Sanitized file-safe string, max 80 characters. Shown in the header and used as the export filename. |
| `events` | yes | Object keyed by `YYYY-MM-DD`. Missing days are omitted, not stored as empty arrays. The array order on a date is the order shown on that day after a drag-reorder. |
| `budgets` | no | Monthly cap per category label, e.g. `{ "Groceries": 400 }`. Positive numbers only, max 60 entries. Omitted entirely when no caps are set. Kept in the ledger rather than in browser storage so restoring a backup on another device brings the caps back with the history. |
| `savedAt` | export only | Unix ms, written by `Ledger.exportPayload()`. Ignored on import. |

## Expense

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | string | — | Required to save. Compared case-insensitively when grouping a series. Blank and leftover placeholder titles never match as a series or as Change All twins. |
| `price` | number or string | `0` | Parsed with `parseFloat`. Legacy notes may still contain `$12.00`; `Utils.getPrice` reads that fallback. |
| `recurring` | boolean | `false` | Marks a re-accruing payment. Series delete matches title + this flag + `repeat`. |
| `repeat` | string | `"monthly"` | How often a recurring payment or income copies forward: `weekly`, `monthly`, `bimonthly` (every 2 months), or `quarterly`. Omitted on one-time entries. Missing on older ledgers means monthly. |
| `kind` | string | `"expense"` | `expense` (default, omitted) or `income`. Calendar colors and the sidebar face use this. |
| `paid` | boolean | `false` | Used by the summary paid / pending split. Receipts save as paid. On income the UI label is Deposited, and only income with this flag counts as cash in the account overview — one flag rather than two, because "received but not deposited" is a state with no answer. |
| `note` | string | `""` | Free text. HTML is escaped before render. |
| `category` | string | omitted | Spending category label (max 40), e.g. `Groceries`. Set from the entry form, guessed from the title by the keyword rules in `src/core/categories.js`, or supplied by a host import. Stored as the human label rather than an id so a ledger written elsewhere keeps its own vocabulary; an unrecognised label renders as a custom category rather than being rewritten. |
| `group` | string | omitted | A bucket of the user's own naming (max 40), e.g. `Bella`, `Rome trip`, `Rental`. Where `category` answers what a thing was from a fixed vocabulary, `group` answers what it belonged to and has no canonical list. Typed into one find-or-add field, matched case-insensitively with runs of whitespace collapsed, so `bella` joins an existing `Bella` rather than forking it. The spelling stored is the one most recently typed. |
| `source` | string | omitted | Optional origin, e.g. `bank` or `ocr` (max 24). |
| `sourceId` | string | omitted | Optional bank transaction id for idempotent host imports (max 80). |

Unknown fields are dropped on load and import. Quality control keeps only the fields above.

## Encrypted files (export)

**Export** writes two JSON files with the same stem into an **OpenExpense** folder by default. A one-off download uses a dated pair such as `Home ledger-2026-08-17.json` and `Home ledger-2026-08-17.key.json`. After a folder is linked, **Save** overwrites the existing pair in that folder (`Home ledger.json` when none exists yet, or the latest dated pair already there). There is no separate income file — both kinds live in one encrypted ledger. Long-press Export to pick another folder. On iPhone and Android the share sheet is the save path — choose OpenExpense in Files.

| File | Format | Purpose |
| --- | --- | --- |
| `{name}-{date}.json` | `{ format: "openexpense-encrypted", version: 2, alg, kdf, kid, salt, iv, commit, ct, createdAt }` | AES-256-GCM envelope. No plaintext expenses or income. |
| `{name}-{date}.key.json` | `{ format: "openexpense-key", version: 2, kid, alg, kdf, secret }` or `{ …, wrap }` | The master secret for that envelope only |

The two files share a `kid`. Import refuses a key that does not match. The portable key is **never** written to IndexedDB or `localStorage`. It exists only in the downloaded `key.json` (and briefly in memory while you unlock a file).

### Envelope v2

`key.json` does not hold the AES key. It holds a 32-byte **master secret**, and HKDF-SHA-256 splits that into two independent values using the envelope's `salt`:

| Info string | Output | Where it goes |
| --- | --- | --- |
| `openexpense/v2/enc` | AES-256-GCM key | Never leaves memory |
| `openexpense/v2/commit` | 32-byte commitment | Published as `commit` in the envelope |

The commitment is checked before any decryption is attempted. AES-GCM is not key-committing on its own — a ciphertext can be constructed to authenticate under more than one key, which is the property partitioning-oracle attacks exploit. Publishing a commitment makes "wrong key" a definite answer.

Every header field is passed to AES-GCM as additional authenticated data, using a canonical JSON encoding with sorted keys. That covers fields this version does not know about, so no part of the envelope — `kid`, `createdAt`, `salt`, `commit`, or anything added later — can be edited without breaking decryption. The tag length is pinned to 128 bits.

### Passphrase (optional)

If the user sets one, `key.json` carries `wrap` instead of `secret`:

```json
{ "kdf": "PBKDF2-HMAC-SHA-256", "iterations": 600000, "salt": "…", "iv": "…", "ct": "…" }
```

The master secret is encrypted under a key derived from the passphrase, so a copied pair of files is no longer enough to read the ledger. The iteration count is itself authenticated in the wrap's AAD and floored at 210,000 on read, so it cannot be edited down to make guessing cheap. Passphrases are NFKC-normalized before use so the same typed word matches regardless of how the platform composes it.

PBKDF2 is used because it is the strongest passphrase KDF the Web Crypto API offers natively. It is not memory-hard the way Argon2id is; choosing it keeps the crypto free of third-party code and WASM, which matters for an offline-first app served as static files. 600,000 iterations follows OWASP's 2023 guidance for PBKDF2-HMAC-SHA-256.

Export asks about a passphrase once and remembers a deliberate "Not now" in `localStorage` (only the choice, never the passphrase), so export stays one click for anyone who does not want one. Dismissing that dialog with Escape is not treated as an answer. **Long-press Export to reopen the question** — that is the way to turn a passphrase on after declining, or off after enabling.

### Older files

v1 envelopes — a raw AES-256-GCM JWK in `key.json`, no salt, no commitment, no AAD — still import. Older `.zip` backups (ciphertext + key + README) still import too. Exports are always written as v2.

### Import order

1. Encrypted `{name}.json` — the app asks you to choose the matching `key.json`.
2. The two JSON files in either order (the second completes the pair).
3. A legacy `.zip` with both members.
4. A plaintext `.json` (legacy sample or old export) — only after you confirm. It is then stored encrypted in autosave.

## Quality control

The same QC path (`src/core/ledger-file.js`) runs on encrypted import, plaintext import, IndexedDB boot, and autosave:

- File size cap (8 MB) before parse
- Format / version / algorithm / `kid` checks
- v2: `kdf` is HKDF-SHA-256, `salt` is 32 bytes, `commit` is 32 bytes, `iv` is 12 bytes
- v2 key file: a 32-byte `secret`, or a `wrap` whose iteration count clears the floor
- v1 key file: key type `oct` (AES-256-GCM JWK)
- Matching `kid` between ledger and key.json
- Key commitment match, then a successful AES-GCM decrypt over the authenticated header
- Sanitized `events` map: real calendar dates, known entry fields, `kind` expense or income, entry/day caps
- Sanitized `budgets` map: non-empty labels, positive finite amounts, prototype keys refused, count capped
- Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) are dropped

OpenExpense drops its portable-key references after unlock, on timeout, and when the page unloads. JavaScript cannot guarantee physical memory erasure. The portable key is never intentionally written to IndexedDB or `localStorage`. Exporting again creates a **new** key pair; the previous `key.json` still unlocks the earlier file.

## IndexedDB

| Database | Store | Key | Value |
| --- | --- | --- | --- |
| `openexpense` (v2) | `ledger` | `current` | Encrypted envelope of `{ name, events }`, with its own header bound in as AAD |
| `openexpense` (v2) | `meta` | `ledger-key-v1` | Non-extractable `CryptoKey` for **autosave only** — not the portable `key.json` |

Do not check a real database dump or `*.key.json` into git. The sample under `examples/` is fictional plaintext for humans to read; it is not a user export.

## Sample file

[`examples/sample-ledger.json`](examples/sample-ledger.json) is fictional data you can import to see the calendar and summary. It is not used by the app at runtime.
