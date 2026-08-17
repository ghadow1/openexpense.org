# Threat model

## Assets

- Plaintext ledger entries and receipt contents in memory
- Encrypted IndexedDB ledger and non-extractable device key
- Portable encrypted export and matching `key.json`
- Persisted export-folder permission handle
- Source, release bundles, domain, and hosting configuration

## Trust boundaries

1. Browser page ↔ IndexedDB/Web Crypto
2. Browser page ↔ user-selected files and directories
3. Source dependencies/build pipeline ↔ committed production bundles
4. Public host/domain ↔ browser
5. User/browser profile ↔ device and OS backup

OCR/PDF executable code and model/runtime assets are served from the application origin. No ledger API or analytics endpoint exists.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| XSS reads decrypted state or invokes the device key | No user HTML rendering; bounded allowlist sanitization; self-hosted scripts; CSP; CodeQL |
| Insecure origin causes plaintext fallback | Encrypted persistence fails closed when Web Crypto is unavailable |
| Two tabs create different device keys | Atomic IndexedDB key get-or-create |
| Older asynchronous save overwrites newer state | Serialized encrypt-and-commit queue |
| Corrupt ciphertext is mistaken for no ledger | Distinct load failure pauses autosave and preserves the record |
| Clear leaves recoverable local ciphertext | Ciphertext and device key deleted in one transaction before success |
| Crafted JSON/ZIP exhausts memory or pollutes objects | File, entry, expansion, field, date, and text limits; forbidden prototype keys |
| Partial two-file folder update destroys usable backup | Verified recovery pair staged before overwrite |
| Unrelated files are overwritten by filename collision | Existing destination must validate as a matching OpenExpense pair |
| Receipt/PDF causes resource exhaustion | File, page, line, and extracted-text caps |
| Dependency compromise | Lockfile integrity, self-hosted runtime assets, audit/CodeQL CI, Dependabot |

## Explicit limitations

- A person or malware controlling the browser profile can access the application and may invoke a non-extractable key.
- Possession of both portable export files is equivalent to possession of plaintext.
- JavaScript cannot guarantee memory erasure.
- Two tabs can still make conflicting business edits; commits are last-writer-wins.
- Browser/OS download pickers cannot atomically save two separately selected files.
- Availability of GitHub Pages, DNS, and the user’s device is outside application code.

## Security invariants

1. OpenExpense never writes a new plaintext ledger record to browser persistence.
2. Portable key material is not intentionally written to IndexedDB or localStorage.
3. Imported data never becomes executable markup.
4. Existing linked-folder files are not overwritten unless they are a valid matching pair.
5. No success message is shown for clear or linked-folder save before required writes commit.
6. Production executable dependencies are bundled and served from the application origin.

Review this document when changing persistence, cryptography, imports, export destinations, OCR/PDF processing, hosting, or dependencies.
