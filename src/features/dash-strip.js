/**
 * OpenExpense — Overview and Planner panes
 *
 * Overview is Potential Savings (or a growth-potential meter when the
 * user entered current bank savings). Planner is daily safe spend plus
 * Quality settings and Banking info. Overview keeps the snapshot and
 * the calendar. Tracker keeps Expenses, Income, and Monthly spending —
 * no calendar.
 */
import { getState, patch } from '../core/store.js';
import {
    computeMonthlySummary,
    computeNetSnapshot,
    formatDelta,
    formatMoney,
    formatChipMoney,
    yearSeriesPoints
} from '../core/summary.js';
import {
    PLAN_DEFAULTS,
    growthPotentialPct,
    monthReserve,
    planIsDefault,
    sanitizePlan
} from '../core/plan.js';
import { createBars, createDial, createSpark } from '../ui/dial-chart.js';
import { goalMilestones } from '../core/goals.js';
import { UI } from '../ui/components.js';
import { Toast } from '../ui/toast.js';
import { closeModal } from './modal.js';
import { openBudgetEditor } from './sidebar.js';
import { readFrame } from '../ui/frame.js';
import { createGoalTrigger, renderGoalsPanel } from './goals.js';

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

function hasBankSavings(snap) {
    return Number(snap.currentSavings) > 0 && snap.growthPct != null;
}

function leftoverTitle(snap) {
    return hasBankSavings(snap) ? 'Growth potential' : 'Potential Savings';
}

function leftoverDial(snap, { shortLabel = false } = {}) {
    if (hasBankSavings(snap)) {
        const tone = snap.growthPct > 0 ? 'up' : snap.growthPct < 0 ? 'down' : '';
        return createDial({
            value: snap.growthPct,
            label: shortLabel ? 'Growth' : 'Growth potential',
            caption: snap.monthLabel,
            display: formatDelta(snap.growthPct),
            ratio: clampRatio(Math.abs(snap.growthPct), 100),
            className: ['is-growth', tone && `is-growth-${tone}`].filter(Boolean).join(' ')
        });
    }
    return createDial({
        value: snap.leftToSpend,
        label: shortLabel ? 'Savings' : 'Potential Savings',
        caption: snap.monthLabel,
        ratio: clampRatio(Math.max(0, snap.leftToSpend), snap.deposited)
    });
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

function yearSpark(events, currentDate, kind, ariaLabel, goals = []) {
    const year = currentDate.getFullYear();
    const totals = yearTotalsFor(events, currentDate, kind);
    return createSpark({
        // Anchored on the month on screen so the dial figure is also a point
        // on the line; otherwise the headline and the chart disagree.
        points: yearSeriesPoints(totals, year, { anchorIndex: currentDate.getMonth() }),
        ariaLabel,
        milestones: goalMilestones(goals, year),
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

    if (readFrame() !== 'phone') {
        const open = extrasOpen == null ? wide : !!extrasOpen;
        section.append(header, row, foldExtras(extrasTitle, extras, open));
    } else {
        section.append(header, row);
    }
    return [section];
}

function choiceButton(name, value, label, checked, detail) {
    const wrap = document.createElement('label');
    wrap.className = `dash-plan-choice${checked ? ' is-on' : ''}${detail ? ' has-detail' : ''}`;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = checked;
    const copy = document.createElement('span');
    copy.className = 'dash-plan-choice-copy';
    const title = document.createElement('strong');
    title.textContent = label;
    copy.appendChild(title);
    if (detail) {
        const note = document.createElement('small');
        note.textContent = detail;
        copy.appendChild(note);
    }
    wrap.append(input, copy);
    return wrap;
}

function choiceField(legendText, ...choices) {
    const field = document.createElement('fieldset');
    field.className = 'dash-plan-row';
    const legend = document.createElement('legend');
    legend.className = 'dash-plan-legend';
    legend.textContent = legendText;
    const row = document.createElement('div');
    row.className = 'dash-plan-choices';
    row.append(...choices);
    field.append(legend, row);
    return field;
}

function fieldRow(...children) {
    const row = document.createElement('div');
    row.className = 'planner-field-row';
    row.append(...children);
    return row;
}

const QUALITY_KEYS = Object.freeze([
    'spendBasis', 'incomeBasis', 'taxWithholdPct', 'weeklyIncome',
    'ratioNeeds', 'ratioWants', 'ratioSave'
]);
const BANKING_KEYS = Object.freeze([
    'weeklySavings', 'savingsFixed', 'savingsPct', 'currentSavings', 'reserveSavings'
]);

const PLAN_PANES = Object.freeze([
    {
        id: 'quality',
        icon: 'adjustments',
        title: 'Quality settings',
        description: 'What counts, tax, weekly pace, and spending targets.'
    },
    {
        id: 'banking',
        icon: 'building-bank',
        title: 'Banking info',
        description: 'Current bank amount and savings you hold back.'
    }
]);

/** Survives a re-render so Save keeps you on Banking info. */
let plannerSettingsPane = 'quality';

function paneIsDirty(draft, saved, keys) {
    return keys.some((key) => draft[key] !== saved[key]);
}

function applyPlannerPane(form, pane) {
    plannerSettingsPane = pane === 'banking' ? 'banking' : 'quality';
    form.dataset.planPane = plannerSettingsPane;
    form.querySelectorAll('[role="tab"][data-plan-pane]').forEach((tab) => {
        const on = tab.dataset.planPane === plannerSettingsPane;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
    });
    form.querySelectorAll('[role="tabpanel"][data-plan-pane]').forEach((panel) => {
        const on = panel.dataset.planPane === plannerSettingsPane;
        panel.hidden = !on;
    });
}

const PLAN_PRESETS = Object.freeze([
    {
        id: 'simple',
        icon: 'sparkles',
        title: 'Simple',
        description: 'Deposits minus every logged bill.',
        plan: PLAN_DEFAULTS
    },
    {
        id: 'balanced',
        icon: 'scale',
        title: 'Balanced',
        description: 'Hold 20% and track a 50 / 30 / 20 split.',
        plan: { ...PLAN_DEFAULTS, savingsPct: 20 }
    },
    {
        id: 'contractor',
        icon: 'briefcase',
        title: 'Contractor',
        description: 'Hold 25% for tax and 10% for savings.',
        plan: { ...PLAN_DEFAULTS, taxWithholdPct: 25, savingsPct: 10 }
    },
    {
        id: 'save-more',
        icon: 'pig-money',
        title: 'Save more',
        description: 'Hold 30% with a 50 / 20 / 30 target.',
        plan: {
            ...PLAN_DEFAULTS,
            savingsPct: 30,
            ratioNeeds: 50,
            ratioWants: 20,
            ratioSave: 30
        }
    }
]);

function readPlanForm(form) {
    return sanitizePlan({
        weeklySavings: Number(form.querySelector('#dash-plan-weekly')?.value),
        weeklyIncome: Number(form.querySelector('#dash-plan-weekly-income')?.value),
        reserveSavings: !!form.querySelector('#dash-plan-reserve')?.checked,
        spendBasis: form.querySelector('input[name="dash-plan-spend"]:checked')?.value,
        incomeBasis: form.querySelector('input[name="dash-plan-income"]:checked')?.value,
        taxWithholdPct: Number(form.querySelector('#dash-plan-tax')?.value),
        savingsFixed: Number(form.querySelector('#dash-plan-fixed')?.value),
        currentSavings: Number(form.querySelector('#dash-plan-current')?.value),
        savingsPct: Number(form.querySelector('#dash-plan-savepct')?.value),
        ratioNeeds: Number(form.querySelector('#dash-plan-needs')?.value),
        ratioWants: Number(form.querySelector('#dash-plan-wants')?.value),
        ratioSave: Number(form.querySelector('#dash-plan-save')?.value)
    });
}

function plansMatch(left, right) {
    return JSON.stringify(sanitizePlan(left)) === JSON.stringify(sanitizePlan(right));
}

function setPlanForm(form, plan) {
    const next = sanitizePlan(plan);
    const values = {
        'dash-plan-weekly': next.weeklySavings,
        'dash-plan-weekly-income': next.weeklyIncome,
        'dash-plan-tax': next.taxWithholdPct,
        'dash-plan-fixed': next.savingsFixed,
        'dash-plan-current': next.currentSavings,
        'dash-plan-savepct': next.savingsPct,
        'dash-plan-needs': next.ratioNeeds,
        'dash-plan-wants': next.ratioWants,
        'dash-plan-save': next.ratioSave
    };
    Object.entries(values).forEach(([id, value]) => {
        const input = form.querySelector(`#${id}`);
        if (input) input.value = value || '';
    });
    const reserve = form.querySelector('#dash-plan-reserve');
    if (reserve) reserve.checked = next.reserveSavings;
    const spend = form.querySelector(`input[name="dash-plan-spend"][value="${next.spendBasis}"]`);
    const income = form.querySelector(`input[name="dash-plan-income"][value="${next.incomeBasis}"]`);
    if (spend) spend.checked = true;
    if (income) income.checked = true;
}

function hint(id, text) {
    const node = document.createElement('p');
    node.className = 'dash-plan-hint';
    if (id) node.id = id;
    node.textContent = text;
    return node;
}

function moneyField(id, label, value, extras = '0.00') {
    const opts = typeof extras === 'string' ? { placeholder: extras } : (extras || {});
    const group = UI.createFieldGroup(id, label, value ? String(value) : '', opts.placeholder || '0.00', 'number');
    const input = group.querySelector('input');
    input.min = opts.min ?? '0';
    input.inputMode = 'decimal';
    if (opts.max != null) input.max = String(opts.max);
    if (opts.step != null) input.step = String(opts.step);
    if (opts.describedBy) input.setAttribute('aria-describedby', opts.describedBy);
    if (opts.optional) {
        const tag = document.createElement('span');
        tag.className = 'dash-plan-optional';
        tag.textContent = 'Optional';
        group.querySelector('label')?.appendChild(tag);
    }
    return group;
}

function sectionKicker(text) {
    const node = document.createElement('p');
    node.className = 'ov-kicker dash-plan-kicker';
    node.textContent = text;
    return node;
}

function pageHead({ kicker, title, description, monthLabel, action = null }) {
    const header = document.createElement('header');
    header.className = 'planner-page-head';
    const copy = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = title;
    const lede = document.createElement('p');
    lede.textContent = description;
    copy.append(sectionKicker(kicker), heading, lede);
    const month = document.createElement('span');
    month.className = 'planner-month';
    month.innerHTML = `<i class="ti ti-calendar" aria-hidden="true"></i>${monthLabel}`;
    const controls = document.createElement('div');
    controls.className = 'planner-page-controls';
    controls.appendChild(month);
    if (action) controls.appendChild(action);
    header.append(copy, controls);
    return header;
}

function planSection(icon, title, description, ...children) {
    const section = document.createElement('section');
    section.className = 'planner-form-section';
    const head = document.createElement('header');
    head.className = 'planner-form-section-head';
    const mark = document.createElement('i');
    mark.className = `ti ti-${icon}`;
    mark.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = title;
    const detail = document.createElement('p');
    detail.textContent = description;
    copy.append(heading, detail);
    head.append(mark, copy);
    section.append(head, ...children);
    return section;
}

function planPanel(snap, plan, currentDate) {
    const form = document.createElement('form');
    form.className = 'dash-plan planner-form';
    form.setAttribute('aria-label', 'Planner settings');

    const weekly = moneyField('dash-plan-weekly', 'Weekly savings', plan.weeklySavings, {
        placeholder: '0.00',
        describedBy: 'dash-plan-weekly-hint'
    });
    const weeklyIn = moneyField('dash-plan-weekly-income', 'Weekly income goal', plan.weeklyIncome, {
        placeholder: '0.00',
        describedBy: 'dash-plan-weekly-income-hint',
        optional: true
    });

    const reserve = document.createElement('label');
    reserve.className = 'dash-plan-check';
    const reserveBox = document.createElement('input');
    reserveBox.type = 'checkbox';
    reserveBox.id = 'dash-plan-reserve';
    reserveBox.checked = plan.reserveSavings;
    const reserveText = document.createElement('span');
    reserveText.innerHTML = '<strong>Hold the weekly share out of leftover</strong><small>Turns the week target into this month’s reserve so Potential Savings does not spend it.</small>';
    reserve.append(reserveBox, reserveText);

    const tax = moneyField('dash-plan-tax', 'Custom withhold %', plan.taxWithholdPct, {
        placeholder: '0',
        max: 50,
        step: 0.1,
        describedBy: 'dash-plan-tax-hint'
    });
    const taxPresets = document.createElement('div');
    taxPresets.className = 'dash-plan-choices';
    taxPresets.append(
        choiceButton('dash-plan-tax-preset', '0', 'Off', plan.taxWithholdPct === 0, 'No withhold'),
        choiceButton('dash-plan-tax-preset', '15.3', '15.3% SE tax', plan.taxWithholdPct === 15.3, 'Self-employment'),
        choiceButton('dash-plan-tax-preset', '25', '25% estimate', plan.taxWithholdPct === 25, 'Quarterly placeholder'),
        choiceButton('dash-plan-tax-preset', '30', '30% estimate', plan.taxWithholdPct === 30, 'Quarterly placeholder')
    );
    taxPresets.addEventListener('change', (event) => {
        const picked = event.target?.value;
        const input = form.querySelector('#dash-plan-tax');
        if (input && picked != null) {
            input.value = picked;
            form.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    const fixed = moneyField('dash-plan-fixed', 'Monthly savings', plan.savingsFixed, {
        placeholder: '0.00',
        describedBy: 'dash-plan-weekly-hint'
    });
    const current = moneyField('dash-plan-current', 'Current bank savings', plan.currentSavings, {
        placeholder: '0.00',
        describedBy: 'dash-plan-current-hint',
        optional: true
    });
    const savePct = moneyField('dash-plan-savepct', 'Savings % of after-tax', plan.savingsPct, {
        placeholder: '0',
        max: 100,
        step: 0.1
    });

    const clearBank = UI.createButton('Clear bank amount', () => {
        const input = form.querySelector('#dash-plan-current');
        if (input) input.value = '';
        form.dispatchEvent(new Event('input', { bubbles: true }));
    }, { icon: 'eraser' });
    clearBank.classList.add('dash-plan-inline-btn');
    clearBank.dataset.planClearBank = '';

    const spendField = choiceField(
        'Spending counted',
        choiceButton('dash-plan-spend', 'logged', 'All logged bills', plan.spendBasis !== 'paid', 'Paid and still owed'),
        choiceButton('dash-plan-spend', 'paid', 'Paid only', plan.spendBasis === 'paid', 'Settled bills')
    );
    const incomeField = choiceField(
        'Income counted',
        choiceButton('dash-plan-income', 'deposited', 'Deposited only', plan.incomeBasis !== 'scheduled', 'Cash that has landed'),
        choiceButton('dash-plan-income', 'scheduled', 'All scheduled', plan.incomeBasis === 'scheduled', 'Include pay still due')
    );

    const ratioField = document.createElement('fieldset');
    ratioField.className = 'dash-plan-row';
    const ratioLegend = document.createElement('legend');
    ratioLegend.className = 'dash-plan-legend';
    ratioLegend.textContent = 'After-tax split';
    const ratioRow = document.createElement('div');
    ratioRow.className = 'dash-plan-split';
    const ratioGroups = [
        moneyField('dash-plan-needs', 'Needs %', plan.ratioNeeds, { placeholder: '50', max: 100, step: 1 }),
        moneyField('dash-plan-wants', 'Wants %', plan.ratioWants, { placeholder: '30', max: 100, step: 1 }),
        moneyField('dash-plan-save', 'Save %', plan.ratioSave, { placeholder: '20', max: 100, step: 1 })
    ];
    ratioRow.append(...ratioGroups);
    ratioField.append(ratioLegend, ratioRow);

    const ratioPreset = UI.createButton('Use 50 / 30 / 20', () => {
        const needs = form.querySelector('#dash-plan-needs');
        const wants = form.querySelector('#dash-plan-wants');
        const save = form.querySelector('#dash-plan-save');
        if (needs) needs.value = '50';
        if (wants) wants.value = '30';
        if (save) save.value = '20';
        form.dispatchEvent(new Event('input', { bubbles: true }));
    }, { icon: 'scale' });
    ratioPreset.classList.add('dash-plan-inline-btn');

    const caps = UI.createButton('Manage category caps', () => openBudgetEditor(), { icon: 'adjustments' });
    caps.classList.add('dash-plan-caps');

    const presets = document.createElement('div');
    presets.className = 'planner-presets';
    PLAN_PRESETS.forEach((preset) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'planner-preset';
        button.dataset.planPreset = preset.id;
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `
            <i class="ti ti-${preset.icon}" aria-hidden="true"></i>
            <span><strong>${preset.title}</strong><small>${preset.description}</small></span>
            <i class="ti ti-chevron-right planner-preset-arrow" aria-hidden="true"></i>
        `;
        button.addEventListener('click', () => {
            setPlanForm(form, preset.plan);
            form.dispatchEvent(new Event('input', { bubbles: true }));
        });
        presets.appendChild(button);
    });

    const ratioStatus = document.createElement('p');
    ratioStatus.className = 'planner-ratio-status';
    ratioStatus.setAttribute('role', 'status');
    ratioField.append(ratioStatus);

    const weeklyHint = hint('dash-plan-weekly-hint', '');
    const weeklyIncomeHint = hint('dash-plan-weekly-income-hint', '');
    const currentHint = hint('dash-plan-current-hint', '');

    const qualityPane = document.createElement('div');
    qualityPane.className = 'planner-settings-pane';
    qualityPane.id = 'planner-pane-quality';
    qualityPane.dataset.planPane = 'quality';
    qualityPane.setAttribute('role', 'tabpanel');
    qualityPane.setAttribute('aria-labelledby', 'planner-tab-quality');
    qualityPane.append(
        sectionKicker('Quick start'),
        presets,
        document.createElement('div')
    );
    const qualityGrid = qualityPane.lastChild;
    qualityGrid.className = 'planner-form-grid';
    qualityGrid.append(
        planSection(
            'arrows-exchange',
            'What counts',
            'Pick settled cash or the full calendar. This is the first step in leftover.',
            incomeField,
            spendField,
            hint('', 'Defaults keep deposited income minus every logged bill.')
        ),
        planSection(
            'receipt-tax',
            'Tax withholding',
            'Set aside an estimate before leftover. This is not a filing.',
            taxPresets,
            tax,
            hint('dash-plan-tax-hint', '15.3 is IRS self-employment tax. 25 and 30 are common quarterly placeholders.')
        ),
        planSection(
            'calendar-stats',
            'Weekly pace',
            'Give Sunday–Saturday rows an income target so you can see when you are ahead.',
            weeklyIn,
            weeklyIncomeHint
        ),
        planSection(
            'chart-pie',
            'Spending targets',
            'Score after-tax income across needs, wants, and saving. The three boxes must add to 100%. They do not withhold a second time.',
            ratioField,
            hint('', `This month: needs ${formatMoney(snap.ratioNeedsSpent)} of ${formatMoney(snap.ratioNeedsCap)}, wants ${formatMoney(snap.ratioWantsSpent)} of ${formatMoney(snap.ratioWantsCap)}.`),
            fieldRow(ratioPreset, caps)
        )
    );

    const bankingPane = document.createElement('div');
    bankingPane.className = 'planner-settings-pane';
    bankingPane.id = 'planner-pane-banking';
    bankingPane.dataset.planPane = 'banking';
    bankingPane.setAttribute('role', 'tabpanel');
    bankingPane.setAttribute('aria-labelledby', 'planner-tab-banking');
    const bankingGrid = document.createElement('div');
    bankingGrid.className = 'planner-form-grid';
    bankingGrid.append(
        planSection(
            'building-bank',
            'Current bank',
            'Optional. The amount already in the bank. Overview then shows growth potential instead of leftover dollars. It never changes leftover.',
            current,
            currentHint,
            clearBank
        ),
        planSection(
            'pig-money',
            'Savings you hold back',
            'Stack a weekly amount, a monthly amount, or a percent of after-tax income. These come out of leftover once.',
            fieldRow(weekly, fixed),
            savePct,
            weeklyHint,
            reserve
        )
    );
    bankingPane.append(bankingGrid);

    const tabs = document.createElement('div');
    tabs.className = 'planner-settings-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Planner setting groups');
    PLAN_PANES.forEach((pane) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'planner-settings-tab';
        tab.id = `planner-tab-${pane.id}`;
        tab.dataset.planPane = pane.id;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', `planner-pane-${pane.id}`);
        tab.innerHTML = `
            <span class="planner-settings-tab-icon"><i class="ti ti-${pane.icon}" aria-hidden="true"></i></span>
            <span class="planner-settings-tab-copy">
                <strong>${pane.title}</strong>
                <small>${pane.description}</small>
            </span>
            <span class="planner-settings-tab-dot" aria-hidden="true"></span>
        `;
        tab.addEventListener('click', () => {
            applyPlannerPane(form, pane.id);
            tab.focus();
        });
        tabs.appendChild(tab);
    });
    tabs.addEventListener('keydown', (event) => {
        const order = PLAN_PANES.map((pane) => pane.id);
        const current = order.indexOf(plannerSettingsPane);
        let next = current;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            next = event.key === 'ArrowRight'
                ? (current + 1) % order.length
                : (current - 1 + order.length) % order.length;
        } else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = order.length - 1;
        else return;
        event.preventDefault();
        applyPlannerPane(form, order[next]);
        form.querySelector(`[role="tab"][data-plan-pane="${order[next]}"]`)?.focus();
    });

    const status = document.createElement('div');
    status.className = 'planner-save-status';
    status.setAttribute('role', 'status');
    const statusIcon = document.createElement('i');
    statusIcon.className = 'ti ti-circle-check';
    statusIcon.setAttribute('aria-hidden', 'true');
    const statusText = document.createElement('span');
    status.append(statusIcon, statusText);

    const reset = UI.createButton('Reset defaults', () => {
        setPlanForm(form, PLAN_DEFAULTS);
        form.dispatchEvent(new Event('input', { bubbles: true }));
    }, { icon: 'restore' });
    reset.setAttribute('aria-label', 'Reset every planner field to the Simple defaults');
    const cancel = UI.createButton('Discard changes', () => {
        setPlanForm(form, plan);
        form.dispatchEvent(new Event('input', { bubbles: true }));
    }, { icon: 'x' });
    cancel.setAttribute('aria-label', 'Discard unsaved planner changes');
    const save = UI.createButton(planIsDefault(plan) ? 'Save plan' : 'Update plan', null, {
        accent: true,
        icon: 'device-floppy'
    });
    save.type = 'submit';
    save.dataset.planSave = '';

    const actions = document.createElement('footer');
    actions.className = 'planner-form-actions';
    const secondary = document.createElement('div');
    secondary.className = 'planner-form-actions-secondary';
    secondary.append(reset, cancel);
    actions.append(status, secondary, save);

    form.append(tabs, qualityPane, bankingPane, actions);
    applyPlannerPane(form, plannerSettingsPane);

    const syncForm = () => {
        const taxValue = Number(form.querySelector('#dash-plan-tax')?.value) || 0;
        form.querySelectorAll('input[name="dash-plan-tax-preset"]').forEach((input) => {
            input.checked = Number(input.value) === taxValue;
        });
        form.querySelectorAll('.dash-plan-choice').forEach((choice) => {
            choice.classList.toggle('is-on', !!choice.querySelector('input')?.checked);
        });
        const ratioTotal = ['dash-plan-needs', 'dash-plan-wants', 'dash-plan-save']
            .reduce((sum, id) => sum + (Number(form.querySelector(`#${id}`)?.value) || 0), 0);
        const validRatio = Math.abs(ratioTotal - 100) < 0.001;
        ratioStatus.textContent = `${ratioTotal}% allocated${validRatio ? '' : ' — adjust to 100%'}`;
        ratioStatus.classList.toggle('is-error', !validRatio);

        const draft = readPlanForm(form);
        const dirty = !plansMatch(draft, plan);
        form.classList.toggle('is-dirty', dirty);
        save.disabled = !dirty || !validRatio;
        cancel.disabled = !dirty;
        reset.disabled = planIsDefault(draft);
        clearBank.disabled = !(draft.currentSavings > 0);
        statusIcon.className = `ti ti-${dirty ? 'edit' : 'circle-check'}`;
        statusText.textContent = dirty
            ? (validRatio ? 'Unsaved changes' : 'Unsaved — split must equal 100%')
            : 'Plan is up to date';

        const reserveAmt = monthReserve(draft.weeklySavings, currentDate);
        weeklyHint.textContent = draft.weeklySavings > 0
            ? `${formatMoney(reserveAmt)} held for ${snap.monthLabel} (${formatMoney(draft.weeklySavings)} × days in the month ÷ 7).`
            : 'Month share is weekly × days in this month ÷ 7. Leave blank if you only use a monthly dollar or a percent.';
        weeklyIncomeHint.textContent = draft.weeklyIncome > 0
            ? `A Sunday–Saturday row is ahead when gross income beats ${formatMoney(draft.weeklyIncome)} × days in that row ÷ 7.`
            : 'Leave blank to use this month’s own income pace.';
        if (draft.currentSavings > 0) {
            const growth = growthPotentialPct(snap.leftToSpend, draft.currentSavings);
            currentHint.textContent = `Overview will show ${formatDelta(growth)} growth on ${formatMoney(draft.currentSavings)}. Leftover stays ${formatMoney(snap.leftToSpend)}.`;
        } else {
            currentHint.textContent = 'Leave blank to keep the leftover dollar ring on Overview.';
        }

        form.querySelector('[role="tab"][data-plan-pane="quality"]')
            ?.classList.toggle('is-dirty', paneIsDirty(draft, plan, QUALITY_KEYS));
        form.querySelector('[role="tab"][data-plan-pane="banking"]')
            ?.classList.toggle('is-dirty', paneIsDirty(draft, plan, BANKING_KEYS));

        PLAN_PRESETS.forEach((preset) => {
            const button = form.querySelector(`[data-plan-preset="${preset.id}"]`);
            const on = plansMatch(draft, preset.plan);
            button?.classList.toggle('is-active', on);
            button?.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    };

    form.addEventListener('input', syncForm);
    form.addEventListener('change', syncForm);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (save.disabled) return;
        const next = readPlanForm(form);
        patch({ plan: next });
        Toast.show(planIsDefault(next) ? 'Planner saved.' : 'Planner updated.', 'success');
    });
    syncForm();
    return form;
}

function budgetSlide(snap, events, currentDate, plan, goals = []) {
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
            label: 'Potential Savings',
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
            title: daysOpen ? 'Daily safe spend' : 'Planner',
            description: daysOpen
                ? 'Potential savings divided by the days still on this month, including today.'
                : 'Withholding, savings hold, and leftover ÷ days that remain.',
            dial: createDial({
                value,
                label: daysOpen ? 'Safe / day' : 'Potential Savings',
                caption: daysOpen ? `${snap.daysLeft} days left` : snap.monthLabel,
                ratio: clampRatio(Math.max(0, value), cap)
            }),
            spark: yearSpark(events, currentDate, 'overview', `${currentDate.getFullYear()} month net`, goals),
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
        planPanel(snap, plan, currentDate)
    ];
}

function overviewCompact(snap, events, currentDate, goals) {
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
        title: leftoverTitle(snap),
        description: hasBankSavings(snap)
            ? 'This month’s leftover against the savings you entered.'
            : 'Deposits minus this month’s spending.',
        dial: leftoverDial(snap),
        spark: yearSpark(events, currentDate, 'overview', `${currentDate.getFullYear()} month net`, goals),
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

function renderOverview(snap, events, currentDate, goals) {
    const heroRoot = document.getElementById('overview-hero-root');
    const moreRoot = document.getElementById('overview-more-root');
    if (!heroRoot || !moreRoot) return;

    if (readFrame() === 'desktop') {
        heroRoot.replaceChildren(...overviewCompact(snap, events, currentDate, goals));
        heroRoot.classList.add('is-ready');
        moreRoot.replaceChildren();
        moreRoot.classList.add('is-ready');
        return;
    }

    const growth = hasBankSavings(snap);
    const hero = document.createElement('section');
    hero.className = 'oe-card ov-hero';
    const kicker = document.createElement('p');
    kicker.className = 'ov-kicker';
    kicker.textContent = leftoverTitle(snap);
    const row = document.createElement('div');
    row.className = 'ov-hero-row';
    const copy = document.createElement('div');
    const kpi = document.createElement('p');
    kpi.className = 'ov-kpi';
    if (growth) {
        const tone = snap.growthPct > 0 ? 'up' : snap.growthPct < 0 ? 'down' : '';
        if (tone) kpi.classList.add(`is-growth-${tone}`);
        kpi.textContent = formatDelta(snap.growthPct);
    } else {
        kpi.textContent = formatMoney(snap.leftToSpend);
    }
    const sub = document.createElement('p');
    sub.className = 'ov-sub';
    if (growth) {
        sub.textContent = `${formatMoney(snap.leftToSpend)} leftover · ${formatMoney(snap.currentSavings)} in the bank`;
    } else {
        sub.textContent = snap.daysLeft > 0
            ? `${formatMoney(snap.dailySafe)} / day · ${snap.daysLeft} day${snap.daysLeft === 1 ? '' : 's'} remaining`
            : `${snap.monthLabel} is closed`;
    }
    copy.append(kpi, sub);
    row.append(copy, leftoverDial(snap, { shortLabel: true }));
    hero.append(kicker, row);

    heroRoot.replaceChildren(pageHead({
        kicker: 'This month',
        title: leftoverTitle(snap),
        description: growth
            ? 'This month’s leftover against the savings you entered.'
            : 'Deposits minus this month’s spending.',
        monthLabel: snap.monthLabel
    }), hero);
    heroRoot.classList.add('is-ready');
    moreRoot.replaceChildren();
    moreRoot.classList.add('is-ready');
}

function renderTrackerHead(snap) {
    const root = document.getElementById('tracker-head-root');
    if (!root) return;
    if (readFrame() === 'desktop') {
        root.replaceChildren();
        return;
    }
    root.replaceChildren(pageHead({
        kicker: 'This month',
        title: 'Month tracker',
        description: 'Expenses, income, and monthly spending.',
        monthLabel: snap.monthLabel
    }));
}

function formulaCard(snap) {
    const card = document.createElement('section');
    card.className = 'oe-card ov-formula';
    const kicker = document.createElement('p');
    kicker.className = 'ov-kicker';
    kicker.textContent = 'Potential-savings formula';
    const line = document.createElement('p');
    line.className = 'ov-formula-line';
    const taxBit = snap.taxWithheld > 0 ? `  −  ${formatMoney(snap.taxWithheld)} tax` : '';
    const holdBit = snap.savingsHold > 0 ? `  −  ${formatMoney(snap.savingsHold)} reserves` : '';
    line.textContent = `${formatMoney(snap.incomeUsed || snap.deposited)} deposits${taxBit}  −  ${formatMoney(snap.spendUsed)} bills${holdBit}  =  ${formatMoney(snap.leftToSpend)}`;
    if (snap.currentSavings > 0 && snap.growthPct != null) {
        const growth = document.createElement('p');
        growth.className = 'ov-formula-line';
        growth.textContent = `${formatMoney(snap.leftToSpend)} leftover  ÷  ${formatMoney(snap.currentSavings)} current savings  =  ${formatDelta(snap.growthPct)} growth`;
        card.append(kicker, line, growth);
        return card;
    }
    card.append(kicker, line);
    return card;
}

function renderPlannerPane(snap, events, currentDate, plan, goals) {
    const root = document.getElementById('planner-root');
    if (!root) return;
    const slide = document.createElement('div');
    slide.className = 'planner-stack';
    const [hero, settings] = budgetSlide(snap, events, currentDate, plan, goals);
    slide.append(pageHead({
        kicker: 'Monthly plan',
        title: 'Build a plan for your money',
        description: 'Quality settings choose what counts and how leftover is scored. Banking info is the cash you already have and the amounts you hold back.',
        monthLabel: snap.monthLabel,
        action: createGoalTrigger()
    }), hero, renderGoalsPanel({ snap, goals, plan }), settings, formulaCard(snap));
    root.replaceChildren(slide);
}

function syncTrackerFilter() {
    const filter = getState().trackerFilter || 'all';
    document.querySelectorAll('[data-tracker-filter]').forEach((btn) => {
        const on = btn.dataset.trackerFilter === filter;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

/**
 * Paint Overview, the Tracker page head, Planner, and the filter active state.
 * The filename `dash-strip` is historical; this is not a fifth tab.
 */
export function renderDashStrip() {
    const { events, currentDate, plan, goals } = getState();
    const rules = sanitizePlan(plan);
    const snap = computeNetSnapshot(events, currentDate, new Date(), rules, goals);
    renderOverview(snap, events, currentDate, goals);
    renderTrackerHead(snap);
    renderPlannerPane(snap, events, currentDate, rules, goals);
    syncTrackerFilter();
}
