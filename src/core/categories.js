/**
 * OpenExpense — categories
 *
 * "Where did my money go?" is a question about categories, not merchants. The
 * ledger has always had a `category` string on entries, but only the bank/embed
 * import ever set it. This module is the shared vocabulary: the canonical set,
 * the keyword rules that guess one from a title, and the colour each gets.
 *
 * Categories are stored as their human label ("Groceries"), not an id, because
 * that is what already sits in ledgers written by the embed importer and what a
 * CSV export should read as. Unknown labels stay intact and render as custom
 * categories, so a ledger from elsewhere never loses information.
 */
import { FILE_LIMITS } from './limits.js';
import { Utils } from './utils.js';

/**
 * `group` is the coarse family a category belongs to. Nothing in the app groups
 * by it yet; it is what the embed API reports as `tags`, so a host can bucket
 * spending without knowing every label.
 *
 * Ten hues, reused across both themes via --cat-* tokens in the stylesheet.
 * Kept deliberately small and muted: colour here is for scanning a list, not
 * decoration, so several categories intentionally share a family.
 */
export const CATEGORIES = [
    { label: 'Groceries', kind: 'expense', tone: 'leaf', group: 'Food' },
    { label: 'Dining', kind: 'expense', tone: 'amber', group: 'Food' },
    { label: 'Coffee', kind: 'expense', tone: 'amber', group: 'Food' },
    { label: 'Transit', kind: 'expense', tone: 'sky', group: 'Travel' },
    { label: 'Travel', kind: 'expense', tone: 'sky', group: 'Travel' },
    { label: 'Housing', kind: 'expense', tone: 'clay', group: 'Bills' },
    { label: 'Utilities', kind: 'expense', tone: 'clay', group: 'Bills' },
    { label: 'Subscriptions', kind: 'expense', tone: 'violet', group: 'Bills' },
    { label: 'Entertainment', kind: 'expense', tone: 'violet', group: 'Lifestyle' },
    { label: 'Shopping', kind: 'expense', tone: 'rose', group: 'Lifestyle' },
    { label: 'Health', kind: 'expense', tone: 'teal', group: 'Health' },
    { label: 'Other', kind: 'expense', tone: 'slate', group: 'Other' },
    { label: 'Paycheck', kind: 'income', tone: 'leaf', group: 'Income' },
    { label: 'Refund', kind: 'income', tone: 'teal', group: 'Income' },
    { label: 'Income', kind: 'income', tone: 'leaf', group: 'Income' }
];

/** Shown as one-tap chips on the entry form; the rest live behind "More". */
export const QUICK_PICKS = {
    expense: ['Groceries', 'Dining', 'Transit', 'Shopping', 'Utilities'],
    income: ['Paycheck', 'Refund', 'Income']
};

export const UNCATEGORIZED = 'Uncategorized';

/**
 * Keyword rules, ordered: the first hit wins, so put the specific ahead of the
 * general ("uber eats" is Dining, plain "uber" is Transit).
 */
const RULES = [
    [/doordash|uber eats|grubhub|postmates|seamless/i, 'Dining'],
    [/trader joe|whole foods|safeway|kroger|aldi|costco|grocer|supermarket|market/i, 'Groceries'],
    [/starbucks|dunkin|coffee|cafe|café|espresso|latte/i, 'Coffee'],
    [/mcdonald|burger|chipotle|wendy|taco bell|pizza|sushi|restaurant|diner|takeout|lunch|dinner/i, 'Dining'],
    [/uber|lyft|transit|metro|mta|subway pass|parking|shell|chevron|exxon|bp |fuel|gas station|gasoline/i, 'Transit'],
    [/delta|united|southwest|jetblue|airline|flight|airbnb|marriott|hilton|hotel|hostel/i, 'Travel'],
    [/netflix|spotify|hulu|disney|hbo|max |prime video|youtube|patreon|substack|icloud|dropbox|apple\.com\/bill|subscription/i, 'Subscriptions'],
    [/comcast|xfinity|verizon|at&t|t-mobile|mint mobile|internet|utility|electric|water bill|pg&e|con ?ed/i, 'Utilities'],
    [/rent|landlord|mortgage|hoa|property tax/i, 'Housing'],
    [/cvs|walgreens|pharmacy|rite aid|doctor|dentist|clinic|hospital|gym|fitness/i, 'Health'],
    [/amazon|target|walmart|etsy|ebay|best buy|ikea|clothing|shoes/i, 'Shopping'],
    [/cinema|movie|theater|concert|steam|playstation|xbox|nintendo|game/i, 'Entertainment'],
    [/payroll|paycheck|direct dep|salary|wages?\b/i, 'Paycheck'],
    [/refund|reimburs|rebate|cashback/i, 'Refund']
];

const BY_LABEL = new Map(CATEGORIES.map((cat) => [cat.label.toLowerCase(), cat]));

/** Trim, collapse space, and cap to the stored length. */
export function normalizeCategory(raw) {
    return String(raw ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, FILE_LIMITS.maxCategory);
}

/** The key two spellings of the same category have in common. */
export function categoryKey(raw) {
    return normalizeCategory(raw).toLowerCase();
}

/** Resolve a stored label to a known category, or describe it as a custom one. */
export function categoryInfo(label, kind = 'expense') {
    const name = normalizeCategory(label);
    if (!name) {
        return { label: UNCATEGORIZED, tone: 'slate', group: '', known: false, uncategorized: true, kind };
    }
    const known = BY_LABEL.get(name.toLowerCase());
    if (known) return { ...known, known: true, uncategorized: false };

    // A category from another tool. Keep the label and give it a stable tone so
    // it at least stays visually consistent between renders.
    return { label: name, tone: customTone(name), group: '', known: false, uncategorized: false, kind };
}

const TONES = ['leaf', 'amber', 'sky', 'clay', 'violet', 'rose', 'teal', 'slate'];

function customTone(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
}

/** Categories offered for a kind, most useful first. */
export function categoriesFor(kind = 'expense') {
    const want = kind === 'income' ? 'income' : 'expense';
    const quick = QUICK_PICKS[want] || [];
    const rest = CATEGORIES
        .filter((cat) => cat.kind === want && !quick.includes(cat.label))
        .map((cat) => cat.label);
    return { quick: [...quick], rest };
}

/**
 * Guess a category from an entry's text. Returns null rather than a fallback so
 * callers can tell "no idea" apart from a real guess and avoid stamping
 * everything as Other.
 */
export function suggestCategory({ title = '', note = '', kind = 'expense' } = {}) {
    const text = `${title} ${note}`.trim();
    if (!text) return null;

    for (const [pattern, label] of RULES) {
        if (!pattern.test(text)) continue;
        const info = categoryInfo(label);
        // A paycheck rule must not fire on an expense, or vice versa.
        if (kind === 'income' && info.kind !== 'income') continue;
        if (kind !== 'income' && info.kind === 'income') continue;
        return label;
    }
    return null;
}

/**
 * What a new entry should be filed under: an explicit choice wins, then a
 * keyword guess, then whatever the user last used for that exact title.
 */
export function resolveCategory({ category, title, note, kind = 'expense', history } = {}) {
    const chosen = normalizeCategory(category);
    if (chosen) return chosen;

    const remembered = history?.get?.(String(title ?? '').trim().toLowerCase());
    if (remembered) return remembered;

    return suggestCategory({ title, note, kind }) || '';
}

let historySource = null;
let historyCache = null;

/**
 * Cached view of categoryHistory, keyed on the events object itself.
 *
 * The entry form re-reads this on every keystroke, and a full ledger scan per
 * character would be wasteful. Store patches always replace the events object,
 * so an identity check is enough to know the cache is stale.
 */
export function cachedCategoryHistory(events) {
    if (events !== historySource) {
        historySource = events;
        historyCache = categoryHistory(events);
    }
    return historyCache;
}

/**
 * Built-in labels plus every category already in the ledger, most recently
 * used first. A typed field needs both: the vocabulary the app ships and the
 * tags the user has already invented.
 */
export function collectCategories(events, { kind } = {}) {
    const want = kind === 'income' || kind === 'expense' ? kind : '';
    const byKey = new Map();

    CATEGORIES.forEach((cat) => {
        if (want && cat.kind !== want) return;
        byKey.set(cat.label.toLowerCase(), {
            key: cat.label.toLowerCase(),
            label: cat.label,
            count: 0,
            lastKey: '',
            builtIn: true,
            tone: cat.tone
        });
    });

    Object.keys(events || {}).sort().forEach((dateKey) => {
        const day = Array.isArray(events[dateKey]) ? events[dateKey] : [];
        day.forEach((entry) => {
            const label = normalizeCategory(entry?.category);
            if (!label) return;
            if (want && Utils.entryKind(entry) !== want) return;
            const key = label.toLowerCase();
            const prev = byKey.get(key) || {
                key,
                label,
                count: 0,
                lastKey: '',
                builtIn: false,
                tone: categoryInfo(label).tone
            };
            prev.count += 1;
            if (dateKey >= prev.lastKey) {
                prev.lastKey = dateKey;
                if (!prev.builtIn) prev.label = label;
            }
            byKey.set(key, prev);
        });
    });

    return [...byKey.values()].sort((a, b) => {
        if (a.count && !b.count) return -1;
        if (!a.count && b.count) return 1;
        if (a.lastKey !== b.lastKey) return a.lastKey < b.lastKey ? 1 : -1;
        return b.count - a.count || a.label.localeCompare(b.label);
    });
}

/**
 * Categories matching what has been typed so far. A prefix match is what the
 * typist usually means, so those sort first.
 */
export function suggestCategories(events, { query = '', kind, limit = 8 } = {}) {
    const q = categoryKey(query);
    const rows = collectCategories(events, { kind });
    if (!q) return rows.slice(0, limit);

    const hits = rows.filter((row) => row.key.includes(q));
    hits.sort((a, b) => {
        const aStarts = a.key.startsWith(q) ? 0 : 1;
        const bStarts = b.key.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        if (a.count && !b.count) return -1;
        if (!a.count && b.count) return 1;
        return b.count - a.count || a.label.localeCompare(b.label);
    });
    return hits.slice(0, limit);
}

/**
 * The spelling already in the ledger or the built-in list, so "groceries"
 * joins "Groceries". Unknown tags are returned as typed, which is how Enter
 * creates a new category.
 */
export function canonicalCategory(events, raw) {
    const label = normalizeCategory(raw);
    if (!label) return '';
    const known = BY_LABEL.get(label.toLowerCase());
    if (known) return known.label;
    const match = collectCategories(events).find((row) => row.key === label.toLowerCase());
    return match ? match.label : label;
}

/**
 * Categories the user has already applied to a given title. Their own past
 * choice should outrank a keyword rule, which is how "learns from corrections"
 * works without any model.
 */
export function categoryHistory(events) {
    const history = new Map();
    if (!events || typeof events !== 'object') return history;

    for (const list of Object.values(events)) {
        if (!Array.isArray(list)) continue;
        for (const entry of list) {
            const title = String(entry?.title ?? '').trim().toLowerCase();
            const category = normalizeCategory(entry?.category);
            if (title && category) history.set(title, category);
        }
    }
    return history;
}

/**
 * File every entry that has no category yet, using the keyword rules and the
 * user's own past choices.
 *
 * Anyone who used the app before categories existed has a ledger where every
 * row is uncategorized, and re-entering years of history by hand is not a real
 * option. Entries that already have a category are never touched, and one that
 * matches no rule is left alone rather than swept into Other.
 *
 * @returns {{events: object, filled: number}} a new events map, or the original
 *   when nothing changed, so callers can skip a pointless save.
 */
export function backfillCategories(events) {
    if (!events || typeof events !== 'object') return { events, filled: 0 };

    const history = categoryHistory(events);
    const next = {};
    let filled = 0;

    for (const [date, list] of Object.entries(events)) {
        if (!Array.isArray(list)) {
            next[date] = list;
            continue;
        }
        next[date] = list.map((entry) => {
            if (!entry || typeof entry !== 'object') return entry;
            if (String(entry.category ?? '').trim()) return entry;

            const kind = entry.kind === 'income' ? 'income' : 'expense';
            const guess = resolveCategory({
                title: entry.title,
                note: entry.note,
                kind,
                history
            });
            if (!guess) return entry;

            filled += 1;
            return { ...entry, category: guess };
        });
    }

    return filled ? { events: next, filled } : { events, filled: 0 };
}

/**
 * Compare a month's spend against its caps.
 *
 * `pace` is the part people actually act on: how far through the month you are
 * versus how much of the cap is gone. Being 90% spent means nothing on the 28th
 * and quite a lot on the 5th, so a bare percentage is not enough to judge by.
 *
 * @param {Array} rows      output of rollUpCategories
 * @param {object} budgets  `{ Groceries: 400 }`
 * @param {object} [period] `{ daysElapsed, daysInMonth }` for the pace read
 */
export function budgetProgress(rows = [], budgets = {}, period = {}) {
    const spentBy = new Map(rows.map((row) => [row.label.toLowerCase(), row]));
    const elapsed = Number(period.daysElapsed) || 0;
    const length = Number(period.daysInMonth) || 0;
    const throughMonth = length > 0 ? Math.min(1, Math.max(0, elapsed / length)) : null;

    const out = [];
    for (const [label, limit] of Object.entries(budgets || {})) {
        const cap = Number(limit);
        if (!Number.isFinite(cap) || cap <= 0) continue;

        const row = spentBy.get(String(label).toLowerCase());
        const spent = row ? row.amount : 0;
        const capCents = Utils.toCents(cap);
        const spentCents = Utils.toCents(spent);
        const used = (spentCents / capCents) * 100;

        let state = 'on-track';
        if (spentCents > capCents) state = 'over';
        else if (used >= 80) state = 'close';
        // Spending faster than the month is passing, with room still left.
        else if (throughMonth != null && throughMonth > 0.15 && used / 100 > throughMonth * 1.15) state = 'ahead';

        out.push({
            label: categoryInfo(label).label,
            tone: categoryInfo(label).tone,
            limit: Utils.fromCents(capCents),
            spent: Utils.fromCents(spentCents),
            remaining: Utils.fromCents(capCents - spentCents),
            used,
            state,
            overBy: spentCents > capCents ? Utils.fromCents(spentCents - capCents) : 0,
            count: row ? row.count : 0
        });
    }

    // Trouble first: over, then close, then running hot, then the calm ones.
    const rank = { over: 0, close: 1, ahead: 2, 'on-track': 3 };
    return out.sort((a, b) => rank[a.state] - rank[b.state] || b.used - a.used);
}

/**
 * Spend per category for a set of summary items, largest first. `share` is the
 * percent of the period's total, which is what the breakdown bars render.
 */
export function rollUpCategories(items = []) {
    const buckets = new Map();
    let totalCents = 0;

    for (const item of items) {
        const cents = Utils.toCents(item.amount);
        if (cents <= 0) continue;
        totalCents += cents;

        const info = categoryInfo(item.category, item.kind);
        const key = info.label;
        const bucket = buckets.get(key) || {
            label: key,
            tone: info.tone,
            uncategorized: info.uncategorized,
            cents: 0,
            count: 0
        };
        bucket.cents += cents;
        bucket.count += 1;
        buckets.set(key, bucket);
    }

    return [...buckets.values()]
        .map((bucket) => ({
            label: bucket.label,
            tone: bucket.tone,
            uncategorized: bucket.uncategorized,
            amount: Utils.fromCents(bucket.cents),
            count: bucket.count,
            share: totalCents ? (bucket.cents / totalCents) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));
}
