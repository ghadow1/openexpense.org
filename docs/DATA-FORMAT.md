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

## Encrypted backup zip

Produced by **Export**. Members:

| File | Format | Purpose |
| --- | --- | --- |
| `ledger.enc.json` | `{ format: "openexpense-encrypted", version, iv, ciphertext }` | AES-256-GCM envelope of the ledger object |
| `ledger.key.json` | `{ format: "openexpense-key", version, key }` | JWK for that envelope (one key per export) |
| `README.txt` | text | Human reminder that both files are needed |

`src/core/bundle.js` defines the member names and `format` strings.

### Import order

1. A `.zip` with both members.
2. The two JSON files chosen separately, in either order (the second click completes the pair).
3. A plaintext `.json` ledger (legacy). It is re-encrypted on the next autosave.

## IndexedDB

| Database | Store | Key | Value |
| --- | --- | --- | --- |
| `openexpense` (v2) | `ledger` | `current` | Encrypted envelope of `{ name, events }` |
| `openexpense` (v2) | `meta` | `ledger-key-v1` | Non-extractable `CryptoKey` for autosave |

Do not check a real database dump or `ledger.key.json` into git.

## Sample file

[`examples/sample-ledger.json`](examples/sample-ledger.json) is fictional data you can import to see the calendar and summary. It is not used by the app at runtime.
