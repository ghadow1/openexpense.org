# Embed and host API

OpenExpense stays a standalone encrypted calendar. This layer lets a banking app **prefetch** transactions (Plaid or any core) and inject them. OpenExpense does not call bank APIs and does not change the current theme or pages.

## 1. Headless engine (`/engine.js`)

```js
import {
  categorize,
  mapTransaction,
  mapTransactions,
  mergeTransactions,
  createSession,
  snapshot,
  detectRecurring,
  flagAnomalies,
  budgetStatus
} from 'https://www.openexpense.org/engine.js';

const session = createSession({ name: 'Bank ledger' });
session.importTransactions([
  { amount: 45.2, merchant: "Trader Joe's", date: '2026-08-17', transaction_id: 'tx_1' },
  { amount: -961, merchant: 'Payroll', date: '2026-08-21', transaction_id: 'tx_2' }
]);

session.get();          // { name, events, plan, goals }
session.getSnapshot();  // same math as the dashboard
```

Plaid-style amounts: positive is spend, negative is income. Override with `kind: 'income' | 'expense'`.

## 2. Live calendar hooks (`window.OpenExpense`)

After the page boots:

```js
OpenExpense.get()
OpenExpense.set({ name, events, budgets, plan, goals })
OpenExpense.importTransactions(rawRows)
OpenExpense.getSnapshot()
OpenExpense.subscribe((ledger) => { /* host copy */ })
OpenExpense.categorize(row)
OpenExpense.allowOrigin('https://bank.example')
```

Every write is sanitized with the same allowlist as import/autosave.
`getSnapshot()` returns `goalAssessment` when ordered goals are present.

`allowOrigin` only enables the cross-origin `postMessage` bridge in **embed mode** (`embed.html` or `?embed=1`). On the default wallet it is a no-op, so a parent frame cannot read or write the visitor’s IndexedDB ledger. Same-origin `get` / `set` / `importTransactions` still work after boot.

Parent origins must be `https:` (or `http:` on `localhost` / `127.0.0.1` / `::1`). Wildcards, credentials, and other schemes are rejected. A path on the origin URL is ignored (`https://bank.example/app` becomes `https://bank.example`).

## 3. iframe

```html
<iframe src="https://www.openexpense.org/embed.html?origin=https://bank.example"></iframe>
```

```js
iframe.contentWindow.postMessage({
  channel: 'openexpense',
  type: 'oe:import',
  transactions: rawRows
}, 'https://www.openexpense.org');
```

The iframe only accepts `channel: 'openexpense'` from a validated `origin` query (or `allowOrigin` in embed mode). It does not load the visitor’s IndexedDB ledger and does not autosave unless the user turns autosave on.

| type | payload | reply |
| --- | --- | --- |
| `oe:hello` | | `oe:ready` |
| `oe:get` | | `oe:state` |
| `oe:set` | `ledger` | `oe:state` |
| `oe:import` | `transactions` | `oe:state` |
| `oe:snapshot` | optional `date` | `oe:snapshot` |

## Host responsibilities

1. Ingest bank data and hold credentials.
2. Pass transaction arrays into `importTransactions` / `oe:import`.
3. Render OpenExpense as the calendar and analytics layer.

Optional entry fields `category`, `group`, `source`, and `sourceId` are stored. `category` and `group` show on the day sheet and in search (`cat:` / `tag:` and `group:`). `source` and `sourceId` are for idempotent host imports and are not shown in the UI.
