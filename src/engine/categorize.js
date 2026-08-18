/**
 * OpenExpense — lite merchant categorizer
 *
 * Hosts can pass their own category; this fills a gap. The keyword rules live
 * in core/categories.js so the embed importer and the in-app entry form always
 * agree on what "Starbucks" is — two rule sets would drift apart.
 */
import { categoryInfo, suggestCategory } from '../core/categories.js';

function haystack(raw) {
    if (!raw || typeof raw !== 'object') return '';
    return [raw.merchant, raw.name, raw.title, raw.category, raw.original_description]
        .filter(Boolean)
        .join(' ')
        .slice(0, 240);
}

export function categorize(raw) {
    const given = String(raw?.category || '').trim();
    if (given) {
        const info = categoryInfo(given);
        return {
            category: given.slice(0, 40),
            tags: info.group ? [info.group] : [],
            kind: raw?.kind === 'income' ? 'income' : 'expense'
        };
    }

    const text = haystack(raw);
    // A bank row does not say whether it is income, so try both readings and
    // let the matching rule decide: "PAYROLL DIRECT DEP" is money coming in.
    const asIncome = suggestCategory({ title: text, kind: 'income' });
    const guess = asIncome || suggestCategory({ title: text, kind: 'expense' });

    if (guess) {
        const info = categoryInfo(guess);
        const kind = info.kind === 'income' || raw?.kind === 'income' ? 'income' : 'expense';
        return { category: guess, tags: info.group ? [info.group] : [], kind };
    }

    return {
        category: raw?.kind === 'income' ? 'Income' : 'Other',
        tags: [],
        kind: raw?.kind === 'income' ? 'income' : 'expense'
    };
}
