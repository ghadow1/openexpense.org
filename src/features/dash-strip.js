/**
 * OpenExpense — Overview and Planner panes
 *
 * Overview is Left to spend. Planner is daily safe spend plus the
 * withholding, savings-hold, and 50/30/20 form. Overview keeps Left
 * to spend (or the desktop compact strip) and the calendar. Tracker
 * keeps Expenses, Income, and Monthly spending — no calendar.
 */
import { getState, patch } from '../core/store.js';
import {
    computeMonthlySummary,
    computeNetSnapshot,
    formatMoney,
    formatChipMoney,
    yearSeriesPoints
} from '../core/summary.js';
import { PLAN_DEFAULTS, planIsDefault, sanitizePlan } from '../core/plan.js';
import { createBars, createDial, createSpark } from '../ui/dial-chart.js';
import { UI } from '../ui/components.js';
import { Toast } from '../ui/toast.js';
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

    if (readFrame() !== 'phone') {
        const open = extrasOpen == null ? wide : !!extrasOpen;
        section.append(header, row, foldExtras(extrasTitle, extras, open));
    } else {
        section.append(header, row);
    }
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

function pageHead({ kicker, title, description, monthLabel }) {
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
    header.append(copy, month);
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

function planPanel(snap, plan) {
    const form = document.createElement('form');
    form.className = 'dash-plan planner-form';
    form.setAttribute('aria-label', 'Planner settings');

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
    const ratioGroups = [
        moneyField('dash-plan-needs', 'Needs %', plan.ratioNeeds, '50'),
        moneyField('dash-plan-wants', 'Wants %', plan.ratioWants, '30'),
        moneyField('dash-plan-save', 'Save %', plan.ratioSave, '20')
    ];
    ratioGroups.forEach((group) => {
        const input = group.querySelector('input');
        input.max = '100';
        input.step = '1';
    });
    ratioRow.append(...ratioGroups);
    ratioField.append(ratioLegend, ratioRow);

    const caps = UI.createButton('Manage category monthly caps', () => openBudgetEditor());
    caps.classList.add('dash-plan-caps');

    const presets = document.createElement('div');
    presets.className = 'planner-presets';
    PLAN_PRESETS.forEach((preset) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'planner-preset';
        button.dataset.planPreset = preset.id;
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

    const formGrid = document.createElement('div');
    formGrid.className = 'planner-form-grid';
    formGrid.append(
        planSection(
            'arrows-exchange',
            'What counts',
            'Choose whether your plan uses every scheduled item or only settled cash.',
            incomeField,
            spendField
        ),
        planSection(
            'receipt-tax',
            'Tax withholding',
            'Set aside an estimate before calculating what is safe to spend.',
            tax,
            taxPresets,
            hint('', 'Common estimates only. Your actual tax depends on your filing and location.')
        ),
        planSection(
            'pig-money',
            'Savings reserves',
            'Stack a weekly amount, a monthly amount, or a percentage of after-tax income.',
            weekly,
            hint('dash-plan-weekly-hint', plan.weeklySavings > 0
                ? `${formatMoney(snap.weeklyReserve)} held for ${snap.monthLabel} (${formatMoney(plan.weeklySavings)} × days in the month ÷ 7).`
                : 'Month share is weekly × days in this month ÷ 7.'),
            fixed,
            savePct,
            reserve
        ),
        planSection(
            'calendar-stats',
            'Weekly pace',
            'Give calendar weeks an income target so you can see when you are ahead.',
            weeklyIn,
            hint('dash-plan-weekly-income-hint', plan.weeklyIncome > 0
                ? `A Sunday–Saturday row is ahead when gross income beats ${formatMoney(plan.weeklyIncome)} × days in that row ÷ 7.`
                : 'Leave blank to use this month’s own income pace.')
        ),
        planSection(
            'chart-pie',
            'Spending targets',
            'Split after-tax income across needs, wants, and saving. The total must equal 100%.',
            ratioField,
            hint('', `Current month: needs ${formatMoney(snap.ratioNeedsSpent)} of ${formatMoney(snap.ratioNeedsCap)}, wants ${formatMoney(snap.ratioWantsSpent)} of ${formatMoney(snap.ratioWantsCap)}.`),
            caps
        )
    );

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
    const cancel = UI.createButton('Cancel changes', () => {
        setPlanForm(form, plan);
        form.dispatchEvent(new Event('input', { bubbles: true }));
    });
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

    form.append(
        sectionKicker('Quick start'),
        presets,
        formGrid,
        actions
    );

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
        statusIcon.className = `ti ti-${dirty ? 'edit' : 'circle-check'}`;
        statusText.textContent = dirty ? 'Unsaved changes' : 'Plan is up to date';
        PLAN_PRESETS.forEach((preset) => {
            form.querySelector(`[data-plan-preset="${preset.id}"]`)
                ?.classList.toggle('is-active', plansMatch(draft, preset.plan));
        });
    };

    form.addEventListener('input', syncForm);
    form.addEventListener('change', syncForm);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (save.disabled) return;
        patch({ plan: readPlanForm(form) });
        Toast.show(planIsDefault(plan) ? 'Planner saved.' : 'Planner updated.', 'success');
    });
    syncForm();
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
        planPanel(snap, plan)
    ];
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

    if (readFrame() === 'desktop') {
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

    heroRoot.replaceChildren(pageHead({
        kicker: 'This month',
        title: 'What’s left',
        description: 'Deposits minus this month’s spending.',
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
    slide.append(pageHead({
        kicker: 'Monthly plan',
        title: 'Build a plan for your money',
        description: 'Choose what counts, reserve tax and savings, then set targets you can update any time.',
        monthLabel: snap.monthLabel
    }), ...budgetSlide(snap, events, currentDate, plan), formulaCard(snap));
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

/**
 * Paint Overview, the Tracker page head, Planner, and the filter active state.
 * The filename `dash-strip` is historical; this is not a fifth tab.
 */
export function renderDashStrip() {
    const { events, currentDate, plan } = getState();
    const rules = sanitizePlan(plan);
    const snap = computeNetSnapshot(events, currentDate, new Date(), rules);
    renderOverview(snap, events, currentDate);
    renderTrackerHead(snap);
    renderPlannerPane(snap, events, currentDate, rules);
    syncTrackerFilter();
}
