/**
 * OpenExpense — lite merchant categorizer
 *
 * Keyword rules only. Hosts can pass their own category; this fills a gap.
 */
const RULES = [
    [/trader joe|whole foods|safeway|kroger|aldi|grocery|supermarket/i, 'Groceries', ['Food']],
    [/starbucks|dunkin|coffee|cafe|espresso/i, 'Coffee', ['Food']],
    [/mcdonald|burger|chipotle|wendy|taco bell|restaurant|doordash|uber eats/i, 'Dining', ['Food']],
    [/uber|lyft|transit|metro|mta|parking|shell|chevron|exxon|gas/i, 'Transit', ['Travel']],
    [/delta|united|southwest|airbnb|marriott|hilton|hotel/i, 'Travel', ['Travel']],
    [/netflix|spotify|hulu|disney|youtube|apple.com\/bill/i, 'Subscriptions', ['Bills']],
    [/comcast|verizon|at&t|t-mobile|mint mobile|internet|utility|electric|pg&e/i, 'Utilities', ['Bills']],
    [/rent|landlord|mortgage|hoa/i, 'Housing', ['Bills']],
    [/cvs|walgreens|pharmacy|rite aid/i, 'Health', ['Health']],
    [/payroll|paycheck|direct dep|salary|wage/i, 'Paycheck', ['Income']],
    [/refund|reimburs/i, 'Refund', ['Income']]
];

function haystack(raw) {
    if (!raw || typeof raw !== 'object') return '';
    return [raw.merchant, raw.name, raw.title, raw.category, raw.original_description]
        .filter(Boolean)
        .join(' ')
        .slice(0, 240);
}

export function categorize(raw) {
    const text = haystack(raw);
    const given = String(raw?.category || '').trim();
    if (given) {
        return { category: given.slice(0, 40), tags: [], kind: raw?.kind === 'income' ? 'income' : 'expense' };
    }
    for (const [pattern, category, tags] of RULES) {
        if (pattern.test(text)) {
            const kind = tags.includes('Income') || raw?.kind === 'income' ? 'income' : 'expense';
            return { category, tags, kind };
        }
    }
    return {
        category: raw?.kind === 'income' ? 'Income' : 'Other',
        tags: [],
        kind: raw?.kind === 'income' ? 'income' : 'expense'
    };
}
