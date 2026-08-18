/**
 * OpenExpense — Overview and Planner panes
 *
 * Overview is the cash snapshot. Planner is daily safe spend plus the
 * withholding, savings-hold, and 50/30/20 form. Extra figures stay folded
 * on a narrow screen. A phone paints the stacked cards with the calendar
 * between Left to spend and Deposited. Tablet and desktop paint the compact
 * dial strip from this morning.
 */
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
import { readFrame } from '../ui/frame.js';

/** Wide enough to read a dial, a year line, and the split side by side. */
const WIDE_DASH = '(min-width: 1100px)';

function wideQuery() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia(WIDE_DASH);
}

function isWideDash() {
    return !!wideQuery()?.matches;
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

function clampRatio(part, whole) {
    if (!(whole > 0)) return part > 0 ? 1 : 0;
    return Math.max(0, Math.min(1, part / whole));
}

function countHint(count, one, many) {
    return `${count} ${count === 1 ? one : many}`;
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

function heroSlide({ title, description, dial, spark, bars, extrasTitle, extras, extrasOpen }) {
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

    const open = extrasOpen == null ? wide : !!extrasOpen;
    section.append(header, row, foldExtras(extrasTitle, extras, open));
    return [section];
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

function sectionKicker(text) {
    const node = document.createElement('p');
    node.className = 'ov-kicker dash-plan-kicker';
    node.textContent = text;
    return node;
}

function planPanel(snap, plan) {
    const form = document.createElement('form');
    form.className = 'dash-plan';
    form.setAttribute('aria-label', 'Planner settings');
    form.addEventListener('submit', (event) => event.preventDefault());

    const weekly = moneyField('dash-plan-weekly', 'Weekly savings ($)', plan.weeklySavings);
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
        choiceButton('dash-plan-tax-preset', '15.3', '15.3% SE tax', plan.taxWithholdPct === 15.3),
        choiceButton('dash-plan-tax-preset', '25', '25% estimate', plan.taxWithholdPct === 25),
        choiceButton('dash-plan-tax-preset', '30', '30% estimate', plan.taxWithholdPct === 30)
    );
    taxPresets.addEventListener('change', (event) => {
        const picked = event.target?.value;
        const input = form.querySelector('#dash-plan-tax');
        if (input && picked != null) input.value = picked;
    });

    const fixed = moneyField('dash-plan-fixed', 'Monthly savings ($)', plan.savingsFixed);
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

    const caps = UI.createButton('Manage category monthly caps', () => openBudgetEditor());
    caps.classList.add('dash-plan-caps');

    form.append(
        sectionKicker('Tax withholding'),
        tax,
        taxPresets,
        hint('', '15.3 is IRS self-employment tax (12.4 Social Security + 2.9 Medicare; Topic 554 / Pub 334). 25 and 30 are common quarterly-estimate placeholders from Pub 505 practice, not a tax filing.'),
        sectionKicker('Savings and hold reserves'),
        weekly,
        hint('dash-plan-weekly-hint', plan.weeklySavings > 0
            ? `${formatMoney(snap.weeklyReserve)} held for ${snap.monthLabel} (${formatMoney(plan.weeklySavings)} × days in the month ÷ 7).`
            : 'Month share is weekly × days in this month ÷ 7.'),
        weeklyIn,
        hint('dash-plan-weekly-income-hint', plan.weeklyIncome > 0
            ? `A Sunday–Saturday row turns green when gross income beats ${formatMoney(plan.weeklyIncome)} × days in that row ÷ 7.`
            : 'Leave blank to use this month’s own income pace. A week turns green when its gross income beats that share.'),
        fixed,
        savePct,
        hint('', 'Fixed dollars and this percent stack with the weekly hold. They come out of after-tax income before left-to-spend.'),
        reserve,
        spendField,
        incomeField,
        sectionKicker('After-tax split'),
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

    const settings = document.createElement('details');
    settings.className = 'dash-fold';
    settings.open = true;
    const settingsSum = document.createElement('summary');
    settingsSum.className = 'dash-fold-sum';
    settingsSum.textContent = 'Planner settings';
    settings.append(settingsSum, planPanel(snap, plan));

    return [
        ...heroSlide({
            title: daysOpen ? 'Daily safe spend' : 'Planner',
            description: daysOpen
                ? 'Left to spend divided by the days still on this month, including today.'
                : 'Withholding, savings hold, and the leftover ÷ days that remain.',
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
        settings
    ];
}

function settleBar(paid, total, paidLabel, openLabel) {
    const wrap = document.createElement('div');
    wrap.className = 'ov-settle';
    const ratio = total > 0 ? Math.max(0, Math.min(1, paid / total)) : 0;
    const track = document.createElement('div');
    track.className = 'ov-settle-track';
    const fill = document.createElement('span');
    fill.style.width = `${Math.round(ratio * 100)}%`;
    track.appendChild(fill);
    const meta = document.createElement('p');
    meta.className = 'ov-settle-meta';
    meta.textContent = `${paidLabel} ${formatMoney(paid)}  ·  ${openLabel} ${formatMoney(Math.max(0, total - paid))}`;
    wrap.append(track, meta);
    return wrap;
}

function overviewCard(kicker, title, hint, bar) {
    const card = document.createElement('article');
    card.className = 'oe-card ov-flow-card';
    const label = document.createElement('p');
    label.className = 'ov-kicker';
    label.textContent = kicker;
    const value = document.createElement('p');
    value.className = 'ov-flow-value';
    value.textContent = title;
    const sub = document.createElement('p');
    sub.className = 'ov-sub';
    sub.textContent = hint;
    card.append(label, value, sub, bar);
    return card;
}

function overviewCompact(snap, events, currentDate) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? `${countHint(snap.leftToPayCount, 'bill', 'bills')} · ${snap.monthLabel}`
        : snap.monthLabel;
    const depositedHint = snap.incomeDue > 0
        ? `${formatMoney(snap.incomeDue)} still to land`
        : `Landed in ${snap.monthLabel}`;
    const savingsHint = snap.drawsOnSavings
        ? `${formatMoney(snap.savingsAfterMonth)} left after ${snap.monthLabel}`
        : `Carried into ${snap.monthLabel}`;

    return heroSlide({
        title: 'Left to spend',
        description: 'Deposits minus this month’s spending.',
        dial: createDial({
            value: snap.leftToSpend,
            label: 'Left to spend',
            caption: snap.monthLabel,
            ratio: clampRatio(Math.max(0, snap.leftToSpend), snap.deposited)
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
        extrasOpen: false,
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
            savingsRateChip(snap)
        ]
    });
}

function renderOverview(snap, events, currentDate) {
    const heroRoot = document.getElementById('overview-hero-root');
    const moreRoot = document.getElementById('overview-more-root');
    if (!heroRoot || !moreRoot) return;

    if (readFrame() !== 'phone') {
        heroRoot.replaceChildren(...overviewCompact(snap, events, currentDate));
        heroRoot.classList.add('is-ready');
        moreRoot.replaceChildren();
        moreRoot.classList.add('is-ready');
        return;
    }

    const hero = document.createElement('section');
    hero.className = 'oe-card ov-hero';
    const kicker = document.createElement('p');
    kicker.className = 'ov-kicker';
    kicker.textContent = 'Left to spend';
    const row = document.createElement('div');
    row.className = 'ov-hero-row';
    const copy = document.createElement('div');
    const kpi = document.createElement('p');
    kpi.className = 'ov-kpi';
    kpi.textContent = formatMoney(snap.leftToSpend);
    const sub = document.createElement('p');
    sub.className = 'ov-sub';
    sub.textContent = snap.daysLeft > 0
        ? `${formatMoney(snap.dailySafe)} / day · ${snap.daysLeft} day${snap.daysLeft === 1 ? '' : 's'} remaining`
        : `${snap.monthLabel} is closed`;
    copy.append(kpi, sub);
    const spendRatio = snap.spendableIncome > 0
        ? clampRatio(snap.spendUsed, snap.spendableIncome)
        : clampRatio(snap.monthOut, snap.deposited || snap.monthOut || 1);
    row.append(copy, createDial({
        value: snap.leftToSpend,
        label: 'Left',
        caption: snap.monthLabel,
        ratio: 1 - spendRatio
    }));
    hero.append(kicker, row);

    const pair = document.createElement('div');
    pair.className = 'ov-pair';
    pair.append(
        overviewCard(
            'Deposited this month',
            formatMoney(snap.deposited),
            `${formatMoney(snap.monthIn)} scheduled · ${formatMoney(snap.incomeDue)} expected`,
            settleBar(snap.deposited, snap.monthIn, 'Deposited', 'Expected')
        ),
        overviewCard(
            'Logged spending',
            formatMoney(snap.monthOut),
            `${formatMoney(snap.spendPaid)} paid · ${formatMoney(snap.leftToPay)} pending`,
            settleBar(snap.spendPaid, snap.monthOut, 'Paid', 'Pending')
        )
    );

    const year = document.createElement('section');
    year.className = 'oe-card ov-year';
    const yearTitle = document.createElement('p');
    yearTitle.className = 'ov-kicker';
    yearTitle.textContent = `${currentDate.getFullYear()} cash flow trajectory`;
    const spend = computeMonthlySummary(events, currentDate, 'expense');
    const charts = document.createElement('div');
    charts.className = 'ov-year-charts';
    charts.append(
        yearSpark(events, currentDate, 'income', `${currentDate.getFullYear()} income`),
        yearSpark(events, currentDate, 'expense', `${currentDate.getFullYear()} spending`)
    );
    const foot = document.createElement('p');
    foot.className = 'ov-year-foot';
    foot.textContent = `Daily average ${formatMoney(spend.avgPerDay)}  ·  Average entry ${formatMoney(spend.avgPerEntry)}`;
    year.append(yearTitle, charts, foot);

    heroRoot.replaceChildren(hero);
    heroRoot.classList.add('is-ready');
    moreRoot.replaceChildren(pair, year);
    moreRoot.classList.add('is-ready');
}

function formulaCard(snap) {
    const card = document.createElement('section');
    card.className = 'oe-card ov-formula';
    const kicker = document.createElement('p');
    kicker.className = 'ov-kicker';
    kicker.textContent = 'Left-to-spend formula';
    const line = document.createElement('p');
    line.className = 'ov-formula-line';
    const taxBit = snap.taxWithheld > 0 ? `  −  ${formatMoney(snap.taxWithheld)} tax` : '';
    const holdBit = snap.savingsHold > 0 ? `  −  ${formatMoney(snap.savingsHold)} reserves` : '';
    line.textContent = `${formatMoney(snap.incomeUsed || snap.deposited)} deposits${taxBit}  −  ${formatMoney(snap.spendUsed)} bills${holdBit}  =  ${formatMoney(snap.leftToSpend)}`;
    card.append(kicker, line);
    return card;
}

function renderPlannerPane(snap, events, currentDate, plan) {
    const root = document.getElementById('planner-root');
    if (!root) return;
    const slide = document.createElement('div');
    slide.className = 'planner-stack';
    slide.append(formulaCard(snap), ...budgetSlide(snap, events, currentDate, plan));
    root.replaceChildren(slide);
}

function syncTrackerFilter() {
    const filter = getState().trackerFilter || 'all';
    document.querySelectorAll('[data-tracker-filter]').forEach((btn) => {
        const on = btn.dataset.trackerFilter === filter;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
}

export function renderDashStrip() {
    const { events, currentDate, plan } = getState();
    const rules = sanitizePlan(plan);
    const snap = computeNetSnapshot(events, currentDate, new Date(), rules);
    renderOverview(snap, events, currentDate);
    renderPlannerPane(snap, events, currentDate, rules);
    syncTrackerFilter();
}
