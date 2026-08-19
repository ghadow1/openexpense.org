/**
 * OpenExpense — canonical ledger resource limits
 *
 * Shared normalization code imports this policy without depending on the
 * ledger-file parser. Keep aggregate cents below Number.MAX_SAFE_INTEGER when
 * changing maxEntries or maxPrice.
 */
export const FILE_LIMITS = Object.freeze({
    // A cheap pre-filter so a hostile file cannot force a huge parse; the real
    // retained bound is maxEntries/maxDays. This remains above the largest
    // ledger the application can export under the field limits below.
    maxBytes: 32 * 1024 * 1024,
    maxDays: 4000,
    maxPerDay: 250,
    maxEntries: 25000,
    maxTitle: 200,
    maxNote: 2000,
    maxPrice: 1e9,
    maxCategory: 40,
    maxGroup: 40,
    maxSource: 24,
    maxSourceId: 80,
    maxBudgets: 60
});
