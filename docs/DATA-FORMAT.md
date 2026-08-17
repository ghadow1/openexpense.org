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
  "savedAt": 1780000000000
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `name` | no | Sanitized file-safe string, max 80 characters. Shown in the header and used as the export filename. |
| `events` | yes | Object keyed by `YYYY-MM-DD`. Missing days are omitted, not stored as empty arrays. |
| `savedAt` | export only | Unix ms, written by `Ledger.exportPayload()`. Ignored on import. |

## Expense

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | string | — | Required to save. Compared case-insensitively when grouping a series. |
| `price` | number or string | `0` | Parsed with `parseFloat`. Legacy notes may still contain `$12.00`; `Utils.getPrice` reads that fallback. |
| `recurring` | boolean | `false` | Marks a re-accruing payment. Series delete matches title + this flag + `repeat`. |
| `repeat` | string | `"monthly"` | How often a recurring payment copies forward: `monthly`, `bimonthly` (every 2 months), or `quarterly`. Omitted on one-time expenses. Missing on older ledgers means monthly. |
| `kind` | string | `"expense"` | `expense` (default, omitted) or `income`. Calendar colors and the sidebar face use this. |
| `paid` | boolean | `false` | Used by the summary paid / pending split. Receipts save as paid. On income, the UI label is Received. |
| `note` | string | `""` | Free text. HTML is escaped before render. |

Unknown fields are kept if present in JSON. The UI does not edit them.

## Encrypted files (export)

**Export** writes two JSON files with the same stem, for example `Home-ledger-2026-08-17.json` and `Home-ledger-2026-08-17.key.json`. There is no separate income file — both kinds live in one encrypted ledger.

| File | Format | Purpose |
| --- | --- | --- |
| `{name}-{date}.json` | `{ format: "openexpense-encrypted", version, kid, iv, ct }` | AES-256-GCM envelope. No plaintext expenses or income. |
| `{name}-{date}.key.json` | `{ format: "openexpense-key", version, kid, key }` | Portable JWK for that envelope only |

The two files share a `kid`. Import refuses a key that does not match. The portable key is **never** written to IndexedDB or `localStorage`. It exists only in the downloaded `key.json` (and briefly in memory while you unlock a file).

Older `.zip` backups (ciphertext + key + README) still import.

### Import order

1. Encrypted `{name}.json` — the app asks you to choose the matching `key.json`.
2. The two JSON files in either order (the second completes the pair).
3. A legacy `.zip` with both members.
4. A plaintext `.json` (legacy sample or old export) — only after you confirm. It is then stored encrypted in autosave.

## Quality control

On load, OpenExpense checks format strings, ciphertext fields, key type (`oct`), matching `kid`, successful AES-GCM decrypt, and a sanitized `events` map (valid `YYYY-MM-DD` keys, known entry fields, `kind` expense or income). Prototype-pollution keys are dropped.

## IndexedDB

| Database | Store | Key | Value |
| --- | --- | --- | --- |
| `openexpense` (v2) | `ledger` | `current` | Encrypted envelope of `{ name, events }` |
| `openexpense` (v2) | `meta` | `ledger-key-v1` | Non-extractable `CryptoKey` for **autosave only** — not the portable `key.json` |

Do not check a real database dump or `*.key.json` into git. The sample under `examples/` is fictional plaintext for humans to read; it is not a user export.

## Sample file

[`examples/sample-ledger.json`](examples/sample-ledger.json) is fictional data you can import to see the calendar and summary. It is not used by the app at runtime.
