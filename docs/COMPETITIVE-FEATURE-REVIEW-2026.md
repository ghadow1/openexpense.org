# Competitive Feature Review (August 2026)

This review asks a narrow product question: which capabilities from leading
personal-finance products improve an encrypted, local-first ledger without
turning it into a bank-aggregation service? Marketing claims are not treated as
mathematical evidence. Forecasts must disclose their inputs, use the same
cent-exact ledger math as the rest of OpenExpense, and avoid implying certainty.

## Market scan

| Product | Useful reference patterns | OpenExpense position |
| --- | --- | --- |
| YNAB | Flexible dated targets, color-coded target progress, category/time filters, spending trends, and income-versus-spending reports | Goals now calculate dated pace and priority. Full Jan–Dec ledger trends and actual-versus-target week bars close the largest visualization gap without adopting account sync. |
| Monarch Money | Cash-flow Sankey reports, on/off-track save goals, contribution scenarios, debt payoff modelling, and long-horizon forecasting | Goal feasibility and savings holds fit the local model. Scenario and debt-interest tools are valuable future modules, but must not be mixed into the short-term cash ledger without explicit assumptions. |
| Copilot Money | Adaptive budgets, recurring-charge review, cash-flow charts, category alerts, transaction splits, and net-worth views | Deterministic categorization and recurring entries already work offline. Split entries, explainable budget suggestions, and local threshold alerts are strong next candidates. |
| Rocket Money | Subscription review, budget-limit alerts, goals, and net-worth tracking | A local recurring-cost review can be built from existing schedules. Cancellation, negotiation, bank alerts, and credit monitoring require external services and are intentionally out of scope. |
| Quicken Simplifi | Spending Plan plus a scheduled cash-flow projection based on recurring and future-dated activity | OpenExpense already has scheduled entries and a planner waterfall. A future balance table is appropriate only after account opening balances and transfer semantics are modelled explicitly. |

## What shipped from this review

1. **Complete yearly evidence.** Year charts retain every observed or scheduled
   monthly value instead of reducing the year to a start, one extreme, and an
   end point. Historical years show all twelve months; the current year stops
   before unknown future months rather than implying a zero forecast. Negative
   net months use a real zero baseline, selected months are marked, and dated
   savings goals remain visible as milestones.
2. **Actual versus target pacing.** Planner week bars now plot actual spend and
   the allocated weekly target on one scale. The target allocation still uses
   integer cents and parks rounding remainder in the final week.
3. **Chart accessibility.** Interactive trends have one tab stop with arrow,
   Home, and End navigation. Every month has an exact accessible label; static
   charts expose their complete data summary.
4. **Visual honesty.** Domains include zero, mixed-sign data is not flattened,
   non-finite inputs become zero, and abbreviated visual labels do not replace
   exact values elsewhere in the interface.
5. **Observed runway.** Daily burn now divides only spend dated through the
   observation day. Scheduled future bills still reduce available-to-spend,
   but no longer inflate historical burn. Current-month deficits reduce runway
   cash, and nonpositive available cash reports zero days rather than a
   negative or overstated result.

## Local-first roadmap

### High value, compatible

- **Recurring-cost review:** group existing recurring entries by monthly and
  annual cost; flag duplicates and upcoming renewals. No bank connection or
  cancellation promise.
- **Explainable budget suggestions:** use a median of recent complete months,
  show the sample window and outlier treatment, and require confirmation before
  writing a cap.
- **Transaction splits:** let one ledger entry allocate exact cents across
  categories while preserving one source transaction and a sum invariant.
- **Threshold alerts inside the app:** local warnings for category pace,
  unusually large entries, and low projected leftover; no push-service claim.

### Medium value, requires a stronger data model

- **Debt payoff scenarios:** avalanche/snowball comparisons need principal,
  APR, minimum payment, compounding convention, and payment timing.
- **Net-worth history:** requires explicit asset/liability balances and
  transfers so ordinary cash movement is not mistaken for income or expense.
- **Future cash-balance table:** requires opening balances and account ownership
  for each scheduled item. Current savings alone is not an account ledger.
- **Budget rollover:** requires a policy per category for overspend, surplus,
  negative rollover, and year boundaries.

### Deliberately excluded

- Bank and brokerage aggregation, automated transfers, credit scores, bill
  negotiation/cancellation, market quotes, household cloud sync, and remote
  push alerts all require credentials, counterparties, or server processing.
  Adding them would contradict the current static, encrypted, no-account
  security boundary.
- Opaque “AI forecast” labels are excluded. A local suggestion may use robust
  statistics, but it must show its source months and remain advisory.

## Sources

- YNAB, [Goal Tracking](https://www.ynab.com/features/goal-tracking) and
  [Reports and Data](https://www.ynab.com/blog/ynab-reports-and-data).
- YNAB, [Income vs. Spending on Mobile](https://www.ynab.com/whats-new/check-your-income-vs-spending-on-mobile),
  February 18, 2026.
- Monarch Money, [Goals, reimagined](https://www.monarch.com/blog/goals) and
  [Mobile Reports, Smarter Forecasting, and New Goals Features](https://www.monarch.com/blog/june-product-update).
- Copilot Money, [FAQ](https://www.copilot.money/faq).
- Rocket Money, [FAQ](https://www.rocketmoney.com/faq) and
  [How to get the most out of Rocket Money](https://help.rocketmoney.com/en/articles/1940551-how-to-get-the-most-out-of-rocket-money).
- Quicken Simplifi community support,
  [Projected Cash Flow scope](https://community.simplifimoney.com/discussion/15009/projected-cash-flow-does-not-account-for-pending-transactions)
  and [report limitation](https://community.simplifimoney.com/discussion/16067/is-there-a-report-for-projected-cash-flow-edited).
