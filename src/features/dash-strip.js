/**
 * OpenExpense — dashboard snapshot
 *
 * Four swipeable views. Each slide is one period dial plus a three-point
 * year spark. Budget holds weekly savings and the rules Overview uses.
 * Extra figures stay folded so the strip never fills the screen.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import {
    computeMonthlySummary,
    computeNetSnapshot,
    formatMoney,
    formatChipMoney,
    yearSeriesPoints
} from '../core/summary.js';
import { sanitizePlan } from '../core/plan.js';
import { createBars, createDial, createSpark } from '../ui/dial-chart.js';
import { UI } from '../ui/components.js';
import { closeModal } from './modal.js';
import { openBudgetEditor } from './sidebar.js';

/** Wide enough to read a dial, a year line, and the split side by side. */
const WIDE_DASH = '(min-width: 1100px)';

function wideQuery() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia(WIDE_DASH);
}

function isWideDash() {
    return !!wideQuery()?.matches;
}

/**
 * The slide is built for one width, so crossing the breakpoint has to repaint
 * it. Without this the bars stay on a window that has been dragged narrow.
 */
let widthBound = false;
function bindWidth() {
    if (widthBound) return;
    const query = wideQuery();
    if (!query?.addEventListener) return;
    widthBound = true;
    query.addEventListener('change', () => renderDashStrip());
}

const VIEWS = ['overview', 'income', 'expense', 'budget'];
const VIEW_COPY = {
    overview: {
        tab: 'Overview',
        title: 'Left to spend',
        description: 'Deposits minus this month’s spending.'
    },
    income: {
        tab: 'Income',
        title: 'Deposited',
        description: 'What has landed this month.'
    },
    expense: {
        tab: 'Expenses',
        title: 'Month spending',
        description: 'Logged bills for the month on screen.'
    },
    budget: {
        tab: 'Planner',
        title: 'Planner',
        description: 'Withholding, savings hold, and the leftover ÷ days that remain.'
    }
};

let activeView = readStoredView();

function readStoredView() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.dashView);
        if (stored === 'planner' || stored === 'plan') return 'budget';
        if (VIEWS.includes(stored)) return stored;
    } catch (_) { }
    return 'overview';
}

function persistView(view) {
    activeView = view;
    try { localStorage.setItem(STORAGE_KEYS.dashView, view); } catch (_) { }
}

function chip({ label, value, tone, hint, signed = true, track = false }) {
    const article = document.createElement('article');
    article.className = `dash-chip${tone ? ` is-${tone}` : ''}${track ? ' is-track' : ''}`;
    article.setAttribute('role', 'listitem');

    const shown = signed ? formatChipMoney(value) : formatMoney(value);
    const exact = !signed
        ? formatMoney(value)
        : (tone === 'flat'
            ? formatMoney(value)
            : `${tone === 'up' ? '+' : tone === 'down' ? '-' : ''}${formatMoney(Math.abs(value))}`);

    article.setAttribute('aria-label', `${label} ${exact}${hint ? `, ${hint}` : ''}`);
    article.title = exact;

    const kicker = document.createElement('span');
    kicker.className = 'dash-chip-label';
    kicker.textContent = label;

    const amount = document.createElement('strong');
    amount.className = 'dash-chip-value';
    amount.textContent = shown;

    article.append(kicker, amount);

    if (hint) {
        const meta = document.createElement('span');
        meta.className = 'dash-chip-hint';
        meta.textContent = hint;
        article.appendChild(meta);
    }

    return article;
}

function textChip({ label, value, hint, tone, track = false }) {
    const article = document.createElement('article');
    article.className = `dash-chip${tone ? ` is-${tone}` : ''}${track ? ' is-track' : ''}`;
    article.setAttribute('role', 'listitem');
    article.setAttribute('aria-label', `${label} ${value}${hint ? `, ${hint}` : ''}`);
    article.title = hint || `${label} ${value}`;

    const kicker = document.createElement('span');
    kicker.className = 'dash-chip-label';
    kicker.textContent = label;

    const amount = document.createElement('strong');
    amount.className = 'dash-chip-value';
    amount.textContent = value;

    article.append(kicker, amount);

    if (hint) {
        const meta = document.createElement('span');
        meta.className = 'dash-chip-hint';
        meta.textContent = hint;
        article.appendChild(meta);
    }

    return article;
}

function toneFor(n) {
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'flat';
}

function countHint(count, one, many) {
    if (!count) return many;
    return `${count} ${count === 1 ? one : many}`;
}

function clampRatio(part, whole) {
    if (!(whole > 0)) return part > 0 ? 1 : 0;
    return Math.max(0, Math.min(1, part / whole));
}

function goMonth(year, monthIndex) {
    patch({ currentDate: new Date(year, monthIndex, 1) });
    if (getState().selectedKey) closeModal();
}

function yearTotalsFor(events, currentDate, kind) {
    if (kind === 'overview') {
        const income = computeMonthlySummary(events, currentDate, 'income');
        const spend = computeMonthlySummary(events, currentDate, 'expense');
        return Array.from({ length: 12 }, (_, i) => (income.monthTotals[i] || 0) - (spend.monthTotals[i] || 0));
    }
    return computeMonthlySummary(events, currentDate, kind).monthTotals;
}

function yearSpark(events, currentDate, kind, ariaLabel) {
    const year = currentDate.getFullYear();
    const totals = yearTotalsFor(events, currentDate, kind);
    return createSpark({
        // Anchored on the month on screen so the dial figure is also a point
        // on the line; otherwise the headline and the chart disagree.
        points: yearSeriesPoints(totals, year, { anchorIndex: currentDate.getMonth() }),
        ariaLabel,
        onSelect: (pt) => goMonth(year, pt.index)
    });
}

function foldExtras(title, items, open) {
    const details = document.createElement('details');
    details.className = 'dash-fold';
    // A wide screen has the room, so the figures start open there and the
    // disclosure only does real work on a laptop or phone.
    details.open = !!open;

    const summary = document.createElement('summary');
    summary.className = 'dash-fold-sum';
    summary.textContent = title;

    const grid = document.createElement('div');
    grid.className = 'dash-block-grid';
    grid.setAttribute('role', 'list');
    grid.setAttribute('aria-label', title);
    grid.append(...items);

    details.append(summary, grid);
    return details;
}

function heroSlide({ title, description, dial, spark, bars, extrasTitle, extras }) {
    const wide = isWideDash();
    const section = document.createElement('section');
    section.className = 'dash-hero-card';

    const header = document.createElement('header');
    header.className = 'dash-block-head';
    const heading = document.createElement('h3');
    heading.className = 'dash-block-title';
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.className = 'dash-block-description';
    copy.textContent = description;
    header.append(heading, copy);

    const row = document.createElement('div');
    row.className = 'dash-hero';
    row.append(dial, spark);
    if (wide && bars) {
        row.classList.add('has-bars');
        row.appendChild(bars);
    }

    section.append(header, row, foldExtras(extrasTitle, extras, wide));
    return [section];
}

function savingsRateChip(snap) {
    const saved = snap.savingsRate == null
        ? '—'
        : `${snap.savingsRate > 0 ? '+' : ''}${snap.savingsRate.toFixed(0)}%`;
    return textChip({
        label: 'Income left',
        value: saved,
        hint: 'After this month’s spending',
        tone: snap.savingsRate > 0 ? 'up' : 'flat',
        track: true
    });
}

function overviewDescription(snap) {
    if (snap.taxWithheld > 0 || snap.savingsHold > 0) {
        return 'After-tax counted income minus counted spending and the savings hold.';
    }
    if (snap.spendUsed !== snap.monthOut || snap.incomeUsed !== snap.deposited) {
        return 'Counted income minus counted spending for this month.';
    }
    return VIEW_COPY.overview.description;
}

function overviewSlide(snap, events, currentDate) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? `${countHint(snap.leftToPayCount, 'bill', 'bills')} · ${snap.monthLabel}`
        : snap.monthLabel;
    const depositedHint = snap.incomeDue > 0
        ? `${formatMoney(snap.incomeDue)} still to land`
        : `Landed in ${snap.monthLabel}`;
    const leftHint = snap.drawsOnSavings
        ? `${formatMoney(Math.abs(snap.leftToSpend))} from savings funds`
        : (snap.savingsHold > 0
            ? `After ${formatMoney(snap.savingsHold)} held`
            : (snap.taxWithheld > 0
                ? `After ${formatMoney(snap.taxWithheld)} withheld`
                : (snap.planCaption && snap.planCaption !== 'deposited income minus all logged bills'
                    ? snap.planCaption
                    : 'Deposited − spending')));
    const savingsHint = snap.drawsOnSavings
        ? `${formatMoney(snap.savingsAfterMonth)} left after ${snap.monthLabel}`
        : `Carried into ${snap.monthLabel}`;

    return heroSlide({
        title: VIEW_COPY.overview.title,
        description: overviewDescription(snap),
        dial: createDial({
            value: snap.leftToSpend,
            label: 'Left to spend',
            caption: snap.monthLabel,
            ratio: clampRatio(Math.max(0, snap.leftToSpend), snap.incomeUsed || snap.deposited)
        }),
        spark: yearSpark(events, currentDate, 'overview', `${currentDate.getFullYear()} month net`),
        bars: createBars({
            ariaLabel: `${snap.monthLabel} cash`,
            rows: [
                { label: 'Deposited', value: snap.deposited },
                { label: 'Spent', value: snap.monthOut },
                { label: 'Savings', value: snap.savingsFunds }
            ]
        }),
        extrasTitle: 'More figures',
        extras: [
            chip({
                label: 'Deposited',
                value: snap.deposited,
                tone: snap.deposited > 0 ? 'up' : 'flat',
                hint: depositedHint
            }),
            chip({
                label: 'Savings funds',
                value: snap.savingsFunds,
                tone: toneFor(snap.savingsFunds),
                hint: savingsHint
            }),
            chip({
                label: 'Due next 7 days',
                value: snap.dueSoon,
                tone: snap.dueSoon > 0 ? 'flat' : 'up',
                hint: dueHint,
                signed: false,
                track: true
            }),
            chip({
                label: 'Unpaid bills',
                value: snap.leftToPay,
                tone: snap.leftToPay > 0 ? 'flat' : 'up',
                hint: unpaidHint,
                signed: false,
                track: true
            }),
            ...(snap.taxWithheld > 0 ? [chip({
                label: 'Tax withheld',
                value: snap.taxWithheld,
                tone: 'flat',
                hint: `${snap.plan.taxWithholdPct}% of counted income`,
                signed: false,
                track: true
            })] : []),
            ...(snap.savingsHold > 0 ? [chip({
                label: 'Savings hold',
                value: snap.savingsHold,
                tone: 'flat',
                hint: snap.reserveOn && snap.weeklyReserve === snap.savingsHold
                    ? `${formatMoney(snap.weeklySavings)} / week`
                    : 'Weekly + monthly + percent',
                signed: false,
                track: true
            })] : []),
            chip({
                label: 'Daily safe',
                value: snap.dailySafe,
                tone: snap.dailySafe >= 0 ? 'up' : 'down',
                hint: snap.daysLeft ? `${snap.daysLeft} day${snap.daysLeft === 1 ? '' : 's'} left` : 'Month closed'
            }),
            textChip({
                label: 'Days of cash',
                value: snap.runwayDays == null ? '—' : String(snap.runwayDays),
                hint: snap.avgDailyBurn > 0
                    ? `${formatMoney(snap.avgDailyBurn)} / day burn`
                    : 'No spending to divide',
                tone: snap.runwayDays == null ? 'flat' : 'up',
                track: true
            }),
            chip({
                label: 'Recurring unpaid',
                value: snap.unpaidRecurring,
                tone: snap.unpaidRecurring > 0 ? 'flat' : 'up',
                hint: snap.unpaidRecurringCount
                    ? countHint(snap.unpaidRecurringCount, 'bill', 'bills')
                    : 'None left this month',
                signed: false,
                track: true
            }),
            savingsRateChip(snap)
        ]
    });
}

function incomeSlide(snap, events, currentDate) {
    const expectedHint = snap.incomeDueCount
        ? countHint(snap.incomeDueCount, 'check', 'checks')
        : snap.monthLabel;

    return heroSlide({
        title: VIEW_COPY.income.title,
        description: VIEW_COPY.income.description,
        dial: createDial({
            value: snap.deposited,
            label: 'Deposited',
            caption: snap.monthLabel,
            ratio: clampRatio(snap.deposited, snap.projectedIncome)
        }),
        spark: yearSpark(events, currentDate, 'income', `${currentDate.getFullYear()} income`),
        bars: createBars({
            ariaLabel: `${snap.monthLabel} income`,
            rows: [
                { label: 'Deposited', value: snap.deposited },
                { label: 'Expected', value: snap.incomeDue },
                { label: 'Recurring', value: snap.incomeRecurring }
            ]
        }),
        extrasTitle: 'More figures',
        extras: [
            chip({
                label: 'Scheduled income',
                value: snap.projectedIncome,
                tone: snap.projectedIncome > 0 ? 'up' : 'flat',
                hint: snap.monthLabel
            }),
            chip({
                label: 'Still expected',
                value: snap.incomeDue,
                tone: snap.incomeDue > 0 ? 'up' : 'flat',
                hint: expectedHint,
                signed: false
            }),
            chip({
                label: 'Recurring income',
                value: snap.incomeRecurring,
                tone: snap.incomeRecurring > 0 ? 'up' : 'flat',
                hint: 'On the calendar',
                signed: false,
                track: true
            }),
            ...(snap.incomeUsed !== snap.deposited ? [chip({
                label: 'Counted income',
                value: snap.incomeUsed,
                tone: snap.incomeUsed > 0 ? 'up' : 'flat',
                hint: 'Used for left-to-spend'
            })] : []),
            ...(snap.taxWithheld > 0 ? [chip({
                label: 'After tax',
                value: snap.afterTax,
                tone: snap.afterTax > 0 ? 'up' : 'flat',
                hint: `${formatMoney(snap.taxWithheld)} withheld`
            })] : [])
        ]
    });
}

function expenseSlide(snap, events, currentDate) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? countHint(snap.leftToPayCount, 'bill', 'bills')
        : snap.monthLabel;

    return heroSlide({
        title: VIEW_COPY.expense.title,
        description: VIEW_COPY.expense.description,
        dial: createDial({
            value: snap.monthOut,
            label: 'Month spending',
            caption: snap.monthLabel,
            ratio: clampRatio(snap.spendPaid, snap.monthOut)
        }),
        spark: yearSpark(events, currentDate, 'expense', `${currentDate.getFullYear()} spending`),
        bars: createBars({
            ariaLabel: `${snap.monthLabel} spending`,
            rows: [
                { label: 'Paid', value: snap.spendPaid },
                { label: 'Unpaid', value: snap.leftToPay },
                { label: 'Recurring', value: snap.spendRecurring }
            ]
        }),
        extrasTitle: 'More figures',
        extras: [
            chip({
                label: 'Paid',
                value: snap.spendPaid,
                tone: 'up',
                hint: 'Marked paid',
                signed: false
            }),
            chip({
                label: 'Unpaid bills',
                value: snap.leftToPay,
                tone: snap.leftToPay > 0 ? 'flat' : 'up',
                hint: unpaidHint,
                signed: false
            }),
            chip({
                label: 'Due next 7 days',
                value: snap.dueSoon,
                tone: snap.dueSoon > 0 ? 'flat' : 'up',
                hint: dueHint,
                signed: false
            }),
            chip({
                label: 'Recurring spend',
                value: snap.spendRecurring,
                tone: 'flat',
                hint: 'On the calendar',
                signed: false,
                track: true
            }),
            ...(snap.spendUsed !== snap.monthOut ? [chip({
                label: 'Counted spend',
                value: snap.spendUsed,
                tone: 'flat',
                hint: 'Paid bills only',
                signed: false,
                track: true
            })] : []),
            ...(snap.avgDailyBurn > 0 ? [chip({
                label: 'Daily burn',
                value: snap.avgDailyBurn,
                tone: 'flat',
                hint: 'Counted spend ÷ days elapsed',
                signed: false,
                track: true
            })] : [])
        ]
    });
}

function choiceButton(name, value, label, checked) {
    const wrap = document.createElement('label');
    wrap.className = `dash-plan-choice${checked ? ' is-on' : ''}`;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = checked;
    const text = document.createElement('span');
    text.textContent = label;
    wrap.append(input, text);
    return wrap;
}

function readPlanForm(form) {
    return sanitizePlan({
        weeklySavings: Number(form.querySelector('#dash-plan-weekly')?.value),
        weeklyIncome: Number(form.querySelector('#dash-plan-weekly-income')?.value),
        reserveSavings: !!form.querySelector('#dash-plan-reserve')?.checked,
        spendBasis: form.querySelector('input[name="dash-plan-spend"]:checked')?.value,
        incomeBasis: form.querySelector('input[name="dash-plan-income"]:checked')?.value,
        taxWithholdPct: Number(form.querySelector('#dash-plan-tax')?.value),
        savingsFixed: Number(form.querySelector('#dash-plan-fixed')?.value),
        savingsPct: Number(form.querySelector('#dash-plan-savepct')?.value),
        ratioNeeds: Number(form.querySelector('#dash-plan-needs')?.value),
        ratioWants: Number(form.querySelector('#dash-plan-wants')?.value),
        ratioSave: Number(form.querySelector('#dash-plan-save')?.value)
    });
}

function hint(id, text) {
    const node = document.createElement('p');
    node.className = 'dash-plan-hint';
    if (id) node.id = id;
    node.textContent = text;
    return node;
}

function moneyField(id, label, value, placeholder = '0.00') {
    const group = UI.createFieldGroup(id, label, value ? String(value) : '', placeholder, 'number');
    const input = group.querySelector('input');
    input.min = '0';
    input.inputMode = 'decimal';
    return group;
}

function planPanel(snap, plan) {
    const form = document.createElement('form');
    form.className = 'dash-plan';
    form.setAttribute('aria-label', 'Planner settings');
    form.addEventListener('submit', (event) => event.preventDefault());

    const weekly = moneyField('dash-plan-weekly', 'Weekly savings', plan.weeklySavings);
    weekly.querySelector('input').setAttribute('aria-describedby', 'dash-plan-weekly-hint');
    const weeklyIn = moneyField('dash-plan-weekly-income', 'Weekly income goal', plan.weeklyIncome);
    weeklyIn.querySelector('input').setAttribute('aria-describedby', 'dash-plan-weekly-income-hint');

    const reserve = document.createElement('label');
    reserve.className = 'dash-plan-check';
    const reserveBox = document.createElement('input');
    reserveBox.type = 'checkbox';
    reserveBox.id = 'dash-plan-reserve';
    reserveBox.checked = plan.reserveSavings;
    const reserveText = document.createElement('span');
    reserveText.textContent = 'Hold this month’s weekly share out of left-to-spend';
    reserve.append(reserveBox, reserveText);

    const tax = moneyField('dash-plan-tax', 'Tax withhold %', plan.taxWithholdPct, '0');
    tax.querySelector('input').max = '50';
    tax.querySelector('input').step = '0.1';
    const taxPresets = document.createElement('div');
    taxPresets.className = 'dash-plan-choices';
    taxPresets.append(
        choiceButton('dash-plan-tax-preset', '0', 'Off', plan.taxWithholdPct === 0),
        choiceButton('dash-plan-tax-preset', '15.3', '15.3 SE tax', plan.taxWithholdPct === 15.3),
        choiceButton('dash-plan-tax-preset', '25', '25 estimate', plan.taxWithholdPct === 25),
        choiceButton('dash-plan-tax-preset', '30', '30 estimate', plan.taxWithholdPct === 30)
    );
    taxPresets.addEventListener('change', (event) => {
        const picked = event.target?.value;
        const input = form.querySelector('#dash-plan-tax');
        if (input && picked != null) input.value = picked;
    });

    const fixed = moneyField('dash-plan-fixed', 'Monthly savings $', plan.savingsFixed);
    const savePct = moneyField('dash-plan-savepct', 'Savings % of after-tax', plan.savingsPct, '0');
    savePct.querySelector('input').max = '100';
    savePct.querySelector('input').step = '0.1';

    const spendField = document.createElement('fieldset');
    spendField.className = 'dash-plan-row';
    const spendLegend = document.createElement('legend');
    spendLegend.className = 'dash-plan-legend';
    spendLegend.textContent = 'Spending counted';
    const spendChoices = document.createElement('div');
    spendChoices.className = 'dash-plan-choices';
    spendChoices.append(
        choiceButton('dash-plan-spend', 'logged', 'All logged bills', plan.spendBasis !== 'paid'),
        choiceButton('dash-plan-spend', 'paid', 'Paid only', plan.spendBasis === 'paid')
    );
    spendField.append(spendLegend, spendChoices);

    const incomeField = document.createElement('fieldset');
    incomeField.className = 'dash-plan-row';
    const incomeLegend = document.createElement('legend');
    incomeLegend.className = 'dash-plan-legend';
    incomeLegend.textContent = 'Income counted';
    const incomeChoices = document.createElement('div');
    incomeChoices.className = 'dash-plan-choices';
    incomeChoices.append(
        choiceButton('dash-plan-income', 'deposited', 'Deposited only', plan.incomeBasis !== 'scheduled'),
        choiceButton('dash-plan-income', 'scheduled', 'All scheduled', plan.incomeBasis === 'scheduled')
    );
    incomeField.append(incomeLegend, incomeChoices);

    const ratioField = document.createElement('fieldset');
    ratioField.className = 'dash-plan-row';
    const ratioLegend = document.createElement('legend');
    ratioLegend.className = 'dash-plan-legend';
    ratioLegend.textContent = 'After-tax split (needs / wants / save)';
    const ratioRow = document.createElement('div');
    ratioRow.className = 'dash-plan-split';
    ratioRow.append(
        moneyField('dash-plan-needs', 'Needs %', plan.ratioNeeds, '50'),
        moneyField('dash-plan-wants', 'Wants %', plan.ratioWants, '30'),
        moneyField('dash-plan-save', 'Save %', plan.ratioSave, '20')
    );
    ratioField.append(ratioLegend, ratioRow);

    const caps = UI.createButton('Category monthly caps', () => openBudgetEditor());
    caps.classList.add('dash-plan-caps');

    form.append(
        weekly,
        hint('dash-plan-weekly-hint', plan.weeklySavings > 0
            ? `${formatMoney(snap.weeklyReserve)} held for ${snap.monthLabel} (${formatMoney(plan.weeklySavings)} × days in the month ÷ 7).`
            : 'Month share is weekly × days in this month ÷ 7.'),
        weeklyIn,
        hint('dash-plan-weekly-income-hint', plan.weeklyIncome > 0
            ? `A Sunday–Saturday row turns green when gross income beats ${formatMoney(plan.weeklyIncome)} × days in that row ÷ 7.`
            : 'Leave blank to use this month’s own income pace. A week turns green when its gross income beats that share.'),
        reserve,
        tax,
        taxPresets,
        hint('', '15.3 is IRS self-employment tax (12.4 Social Security + 2.9 Medicare). 25 and 30 are common quarterly-estimate placeholders from Pub 505 practice, not a tax filing.'),
        fixed,
        savePct,
        hint('', 'Fixed dollars and this percent stack with the weekly hold. They come out of after-tax income before left-to-spend.'),
        spendField,
        incomeField,
        ratioField,
        hint('', `50/30/20 is Warren and Tyagi, All Your Worth (2005), as taught by the CFPB. Needs ${formatMoney(snap.ratioNeedsSpent)} of ${formatMoney(snap.ratioNeedsCap)}, wants ${formatMoney(snap.ratioWantsSpent)} of ${formatMoney(snap.ratioWantsCap)}, save hold ${formatMoney(snap.savingsHold)} of ${formatMoney(snap.ratioSaveCap)}.`),
        caps
    );
    form.addEventListener('change', () => {
        patch({ plan: readPlanForm(form) });
    });
    return form;
}

function budgetSlide(snap, events, currentDate, plan) {
    const daysOpen = snap.daysLeft > 0;
    const value = daysOpen ? snap.dailySafe : snap.leftToSpend;
    const cap = daysOpen
        ? Math.max(snap.avgDailyBurn, Math.abs(snap.dailySafe), 1)
        : (snap.spendableIncome || snap.incomeUsed || snap.deposited);
    const weekRows = (snap.weekBuckets || []).map((week) => ({
        label: week.label,
        value: week.amount
    }));
    const extras = [
        chip({
            label: 'Left to spend',
            value: snap.leftToSpend,
            tone: toneFor(snap.leftToSpend),
            hint: snap.savingsHold > 0 ? `After ${formatMoney(snap.savingsHold)} held` : snap.monthLabel
        }),
        chip({
            label: 'Spendable',
            value: snap.spendableIncome,
            tone: snap.spendableIncome > 0 ? 'up' : 'flat',
            hint: 'After tax and savings hold'
        }),
        chip({
            label: 'Safe / week',
            value: snap.weeklySafe,
            tone: toneFor(snap.weeklySafe),
            hint: daysOpen ? `${Math.min(7, snap.daysLeft)}-day slice` : 'Month closed'
        }),
        chip({
            label: 'This week',
            value: snap.weekNet,
            tone: toneFor(snap.weekNet),
            hint: plan.weeklySavings > 0 ? `Target ${formatMoney(plan.weeklySavings)}` : 'Sun–Sat'
        }),
        textChip({
            label: 'Days of cash',
            value: snap.runwayDays == null ? '—' : String(snap.runwayDays),
            hint: snap.avgDailyBurn > 0 ? `${formatMoney(snap.avgDailyBurn)} daily burn` : 'No burn',
            tone: snap.runwayDays == null ? 'flat' : 'up',
            track: true
        }),
        chip({
            label: 'Needs',
            value: snap.ratioNeedsSpent,
            tone: snap.ratioNeedsSpent > snap.ratioNeedsCap ? 'down' : 'flat',
            hint: `of ${formatMoney(snap.ratioNeedsCap)}`,
            signed: false,
            track: true
        }),
        chip({
            label: 'Wants',
            value: snap.ratioWantsSpent,
            tone: snap.ratioWantsSpent > snap.ratioWantsCap ? 'down' : 'flat',
            hint: `of ${formatMoney(snap.ratioWantsCap)}`,
            signed: false,
            track: true
        }),
        chip({
            label: 'Save hold',
            value: snap.savingsHold,
            tone: 'flat',
            hint: `of ${formatMoney(snap.ratioSaveCap)} target`,
            signed: false,
            track: true
        })
    ];

    return [
        ...heroSlide({
            title: daysOpen ? 'Daily safe spend' : VIEW_COPY.budget.title,
            description: daysOpen
                ? 'Left to spend divided by the days still on this month, including today.'
                : VIEW_COPY.budget.description,
            dial: createDial({
                value,
                label: daysOpen ? 'Safe / day' : 'Left to spend',
                caption: daysOpen ? `${snap.daysLeft} days left` : snap.monthLabel,
                ratio: clampRatio(Math.max(0, value), cap)
            }),
            spark: yearSpark(events, currentDate, 'overview', `${currentDate.getFullYear()} month net`),
            bars: createBars({
                ariaLabel: `${snap.monthLabel} weekly pace`,
                rows: weekRows.length
                    ? weekRows
                    : [
                        { label: 'Spendable', value: snap.spendableIncome },
                        { label: 'Spent', value: snap.spendUsed },
                        { label: 'Hold', value: snap.savingsHold }
                    ]
            }),
            extrasTitle: 'Planner figures',
            extras
        }),
        planPanel(snap, plan)
    ];
}

function slideFor(view, snap, events, currentDate, plan) {
    if (view === 'income') return incomeSlide(snap, events, currentDate);
    if (view === 'expense') return expenseSlide(snap, events, currentDate);
    if (view === 'budget') return budgetSlide(snap, events, currentDate, plan);
    return overviewSlide(snap, events, currentDate);
}

function setDeckView(root, view) {
    if (!VIEWS.includes(view)) view = 'overview';
    persistView(view);
    const index = VIEWS.indexOf(view);
    root.dataset.view = view;
    const track = root.querySelector('.dash-deck-track');
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    root.querySelectorAll('[data-dash-view]').forEach((btn) => {
        const on = btn.dataset.dashView === view;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
    });
    root.querySelectorAll('.dash-slide').forEach((slide) => {
        const on = slide.dataset.view === view;
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
}

function shiftView(root, delta) {
    const index = VIEWS.indexOf(activeView);
    const next = VIEWS[(index + delta + VIEWS.length) % VIEWS.length];
    setDeckView(root, next);
}

function bindDeck(root) {
    if (root.dataset.deckBound === '1') return;
    root.dataset.deckBound = '1';

    root.addEventListener('click', (event) => {
        const tab = event.target.closest('[data-dash-view]');
        if (!tab || !root.contains(tab)) return;
        setDeckView(root, tab.dataset.dashView);
    });

    root.addEventListener('keydown', (event) => {
        if (!root.contains(document.activeElement)) return;
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            shiftView(root, 1);
            root.querySelector('[data-dash-view].is-active')?.focus();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            shiftView(root, -1);
            root.querySelector('[data-dash-view].is-active')?.focus();
        }
    });

    let startX = 0;
    let startY = 0;
    let dragging = false;
    root.addEventListener('pointerdown', (event) => {
        if (event.target.closest('[data-dash-view]')) return;
        if (event.target.closest('.dash-fold')) return;
        if (event.target.closest('.dash-plan')) return;
        if (event.target.closest('.oe-spark-hit')) return;
        if (event.button != null && event.button !== 0) return;
        startX = event.clientX;
        startY = event.clientY;
        dragging = true;
    });
    root.addEventListener('pointerup', (event) => {
        if (!dragging) return;
        dragging = false;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy)) return;
        shiftView(root, dx < 0 ? 1 : -1);
    });
    root.addEventListener('pointercancel', () => { dragging = false; });
}

export function renderDashStrip() {
    const root = document.getElementById('dash-chips');
    if (!root) return;

    const { events, currentDate, plan } = getState();
    const rules = sanitizePlan(plan);
    const snap = computeNetSnapshot(events, currentDate, new Date(), rules);

    const deck = document.createElement('section');
    deck.className = 'dash-deck';
    deck.setAttribute('aria-roledescription', 'carousel');
    deck.setAttribute('aria-label', 'Ledger snapshot views');

    const tabs = document.createElement('div');
    tabs.className = 'dash-deck-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Snapshot views');
    VIEWS.forEach((view) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dash-deck-tab';
        btn.dataset.dashView = view;
        btn.id = `dash-tab-${view}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-controls', `dash-slide-${view}`);
        btn.textContent = VIEW_COPY[view].tab;
        if (view === 'budget') btn.setAttribute('aria-label', 'Planner settings');
        tabs.appendChild(btn);
    });

    const viewport = document.createElement('div');
    viewport.className = 'dash-deck-viewport';

    const track = document.createElement('div');
    track.className = 'dash-deck-track';

    VIEWS.forEach((view) => {
        const slide = document.createElement('div');
        slide.className = 'dash-slide';
        slide.id = `dash-slide-${view}`;
        slide.dataset.view = view;
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-labelledby', `dash-tab-${view}`);
        slide.append(...slideFor(view, snap, events, currentDate, rules));
        track.appendChild(slide);
    });

    viewport.appendChild(track);
    deck.append(tabs, viewport);

    const firstPaint = !root.classList.contains('is-ready');
    root.replaceChildren(deck);
    root.classList.add('is-ready');
    root.classList.toggle('is-fresh', firstPaint);
    bindDeck(root);
    bindWidth();
    setDeckView(root, activeView);
}
