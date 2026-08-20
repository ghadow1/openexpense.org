/**
 * OpenExpense — planner savings goals
 *
 * Goal metadata stays inside the encrypted ledger. This module owns the modal,
 * ordered goal cards, priority drag behavior, horizon presets, pace toggles,
 * and the explicit action that copies this month's required hold into the
 * planner savings hold.
 */
import { getState, patch } from '../core/store.js';
import {
    GOAL_HORIZONS,
    GOAL_PACE_VIEWS,
    GOAL_STATES,
    assessGoals,
    createGoalId,
    finishDateAtMonthlyPace,
    goalPaceAmount,
    goalPaceLabel,
    requiredPaceForAmount,
    sanitizeGoal,
    sanitizeGoals,
    targetDateForHorizon
} from '../core/goals.js';
import { fixedHoldForTarget, horizonIncomeItems, sanitizePlan } from '../core/plan.js';
import { Utils } from '../core/utils.js';
import { activateDialogFocus, deactivateDialogFocus } from '../ui/dialog-focus.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { bindThresholdDrag, clearDropMarks, makeGhost, placeGhost } from '../ui/pointer-drag.js';
import { confirmDialog } from '../ui/confirm.js';
import { Toast } from '../ui/toast.js';

let goalBackdrop = null;
let goalKeyHandler = null;
let lastPanelArgs = null;

const goalView = {
    pace: GOAL_PACE_VIEWS.MONTH,
    projections: true
};

const HORIZON_OPTIONS = [
    { id: GOAL_HORIZONS.WEEKLY, label: 'Week', hint: '7 days' },
    { id: GOAL_HORIZONS.MONTHLY, label: 'Month', hint: 'This month-end' },
    { id: GOAL_HORIZONS.YEARLY, label: 'Year', hint: 'Same date next year' },
    { id: GOAL_HORIZONS.CUSTOM, label: 'Custom', hint: 'Pick a date' }
];

const PACE_OPTIONS = [
    { id: GOAL_PACE_VIEWS.DAY, label: 'Day' },
    { id: GOAL_PACE_VIEWS.WEEK, label: 'Week' },
    { id: GOAL_PACE_VIEWS.MONTH, label: 'Month' },
    { id: GOAL_PACE_VIEWS.YEAR, label: 'Year' }
];

function todayKey() {
    const now = new Date();
    return Utils.dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateLabel(key) {
    const [year, month, day] = String(key).split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    if (Number.isNaN(date.getTime())) return key;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function remainingCopy(goal) {
    const days = Number(goal.daysRemaining) || 0;
    if (days <= 0) return goal.state === GOAL_STATES.COMPLETE ? 'Due today' : 'Past due';
    if (days === 1) return '1 day left';
    if (days < 14) return `${days} days left`;
    const weeks = goal.weeksRemaining;
    if (weeks < 8) {
        const count = weeks >= 10 ? Math.round(weeks) : Math.round(weeks * 10) / 10;
        return `${count} week${count === 1 ? '' : 's'} left`;
    }
    const months = goal.monthsRemaining;
    if (months < 18) {
        const count = months >= 10 ? Math.round(months) : Math.round(months * 10) / 10;
        return `${count} month${count === 1 ? '' : 's'} left`;
    }
    const years = Math.round((goal.yearsRemaining || 0) * 10) / 10;
    return `${years} year${years === 1 ? '' : 's'} left`;
}

function horizonCopy(horizon) {
    if (horizon === GOAL_HORIZONS.WEEKLY) return 'Weekly';
    if (horizon === GOAL_HORIZONS.MONTHLY) return 'Monthly';
    if (horizon === GOAL_HORIZONS.YEARLY) return 'Yearly';
    return 'Custom';
}

function closeGoalDialog() {
    if (!goalBackdrop) return;
    const dialog = goalBackdrop.querySelector('[role="dialog"]');
    deactivateDialogFocus(dialog);
    goalBackdrop.remove();
    goalBackdrop = null;
    if (goalKeyHandler) {
        document.removeEventListener('keydown', goalKeyHandler, true);
        goalKeyHandler = null;
    }
    if (!document.querySelector('.backdrop.open')) document.body.classList.remove('modal-open');
    unlockBodyScroll();
}

function field(label, input, hint) {
    const group = document.createElement('div');
    group.className = 'goal-field';
    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'field-label';
    fieldLabel.htmlFor = input.id;
    fieldLabel.textContent = label;
    group.append(fieldLabel, input);
    if (hint) {
        const note = document.createElement('p');
        note.className = 'goal-field-hint';
        note.id = `${input.id}-hint`;
        note.textContent = hint;
        input.setAttribute('aria-describedby', note.id);
        group.appendChild(note);
    }
    return group;
}

function input(id, type, value = '') {
    const element = document.createElement('input');
    element.id = id;
    element.className = 'text-input';
    element.type = type;
    element.value = value;
    return element;
}

function refreshGoalsPanel() {
    const host = document.querySelector('.planner-goals');
    if (!host || !lastPanelArgs) return;
    const { goals, plan } = getState();
    host.replaceWith(renderGoalsPanel({
        ...lastPanelArgs,
        goals,
        plan: sanitizePlan(plan)
    }));
}

function setGoalView(partial) {
    Object.assign(goalView, partial);
    refreshGoalsPanel();
}

function segmentGroup({ name, legend, options, value, onChange, variant = '' }) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = variant ? `goal-seg ${variant}` : 'goal-seg';
    const caption = document.createElement('legend');
    caption.className = 'goal-seg-legend';
    caption.textContent = legend;
    const row = document.createElement('div');
    row.className = 'goal-seg-row';
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', legend);
    options.forEach((option) => {
        const label = document.createElement('label');
        label.className = `goal-seg-option${option.id === value ? ' is-on' : ''}`;
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = name;
        radio.value = option.id;
        radio.checked = option.id === value;
        radio.addEventListener('change', () => {
            if (!radio.checked) return;
            onChange(option.id);
        });
        const copy = document.createElement('span');
        copy.className = 'goal-seg-copy';
        const title = document.createElement('strong');
        title.textContent = option.label;
        copy.appendChild(title);
        if (option.hint) {
            const hint = document.createElement('small');
            hint.textContent = option.hint;
            copy.appendChild(hint);
        }
        label.append(radio, copy);
        row.appendChild(label);
    });
    fieldset.append(caption, row);
    return fieldset;
}

function switchRow({ id, checked, label, hint, onChange, variant = '' }) {
    const wrap = document.createElement('label');
    wrap.className = variant ? `goal-switch ${variant}` : 'goal-switch';
    wrap.htmlFor = id;
    const box = document.createElement('input');
    box.id = id;
    box.type = 'checkbox';
    box.checked = checked;
    box.addEventListener('change', () => onChange(box.checked));
    const copy = document.createElement('span');
    copy.innerHTML = `<strong>${Utils.escapeHtml(label)}</strong>${hint ? `<small>${Utils.escapeHtml(hint)}</small>` : ''}`;
    wrap.append(box, copy);
    return wrap;
}

export function openGoalDialog(existing = null) {
    closeGoalDialog();
    const goal = existing ? sanitizeGoal(existing) : null;
    const editing = !!goal;
    let horizon = goal?.horizon || (editing ? GOAL_HORIZONS.CUSTOM : GOAL_HORIZONS.MONTHLY);

    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop open goal-backdrop';
    backdrop.id = 'goal-dialog';
    const dialog = document.createElement('div');
    dialog.className = 'modal-shell goal-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'goal-dialog-title');

    const header = document.createElement('header');
    header.className = 'goal-dialog-head';
    const heading = document.createElement('h2');
    heading.id = 'goal-dialog-title';
    heading.className = 'modal-title';
    heading.textContent = editing ? 'Edit savings goal' : 'Add savings goal';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'close-modal';
    close.setAttribute('aria-label', 'Close goal editor');
    close.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';
    close.addEventListener('click', closeGoalDialog);
    header.append(heading, close);

    const form = document.createElement('form');
    form.className = 'goal-form';
    form.noValidate = true;
    const title = input('goal-title', 'text', goal?.title || '');
    title.required = true;
    title.maxLength = 80;
    title.autocomplete = 'off';
    title.placeholder = 'Emergency fund, new laptop…';
    const targetDate = input(
        'goal-target-date',
        'date',
        goal?.targetDate || targetDateForHorizon(horizon)
    );
    targetDate.required = true;
    targetDate.min = todayKey();
    const targetAmount = input(
        'goal-target-amount',
        'number',
        goal?.targetAmount ? String(goal.targetAmount) : ''
    );
    targetAmount.min = '0.01';
    targetAmount.max = '1000000000';
    targetAmount.step = '0.01';
    targetAmount.inputMode = 'decimal';
    targetAmount.placeholder = 'Optional';
    const alreadySaved = input(
        'goal-already-saved',
        'number',
        goal?.alreadySaved ? String(goal.alreadySaved) : ''
    );
    alreadySaved.min = '0';
    alreadySaved.max = '1000000000';
    alreadySaved.step = '0.01';
    alreadySaved.inputMode = 'decimal';
    alreadySaved.placeholder = '0.00';
    const note = document.createElement('textarea');
    note.id = 'goal-note';
    note.className = 'text-input text-input--area';
    note.maxLength = 200;
    note.rows = 2;
    note.placeholder = 'Why this matters, or where the money lives…';
    note.value = goal?.note || '';

    const amountLabel = document.createElement('span');
    amountLabel.textContent = 'Target amount';
    const optional = document.createElement('span');
    optional.className = 'dash-plan-optional';
    optional.textContent = 'Optional';
    amountLabel.append(' ', optional);
    const amountGroup = field('', targetAmount);
    amountGroup.querySelector('label').replaceChildren(amountLabel);

    const preview = document.createElement('p');
    preview.className = 'goal-form-preview';
    preview.id = 'goal-form-preview';
    preview.setAttribute('aria-live', 'polite');

    const help = document.createElement('p');
    help.className = 'goal-form-note';
    help.id = 'goal-form-note';
    help.textContent = 'Week, month, and year set a deadline. The required pace is the amount still needed divided by time left — not a daily rate stretched across a full month.';
    targetAmount.setAttribute('aria-describedby', 'goal-form-note');
    const error = document.createElement('p');
    error.className = 'confirm-field-error';
    error.id = 'goal-form-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;

    let includeBank = goal?.includeBankSavings !== false;
    const bankToggle = switchRow({
        id: 'goal-include-bank',
        checked: includeBank,
        label: 'Use current bank savings first',
        hint: 'Shared savings are earmarked in priority order. Turn this off to fund the goal only from new surplus.',
        onChange: (checked) => {
            includeBank = checked;
            updatePreview();
        }
    });

    const dateField = field('Target date', targetDate, 'Week, month, and year fill this date. Change it to switch to a custom deadline.');
    const applyHorizonDate = (nextHorizon, { fillDate = true } = {}) => {
        horizon = nextHorizon;
        if (fillDate && nextHorizon !== GOAL_HORIZONS.CUSTOM) {
            targetDate.value = targetDateForHorizon(nextHorizon);
        }
        form.querySelectorAll('input[name="goal-horizon"]').forEach((radio) => {
            radio.checked = radio.value === horizon;
            radio.closest('.goal-seg-option')?.classList.toggle('is-on', radio.checked);
        });
        updatePreview();
    };

    const length = segmentGroup({
        name: 'goal-horizon',
        legend: 'Goal length',
        options: HORIZON_OPTIONS,
        value: horizon,
        onChange: applyHorizonDate,
        variant: 'goal-seg--tiles'
    });

    const updatePreview = () => {
        const amountText = targetAmount.value.trim();
        const amount = amountText ? Number(amountText) : 0;
        const savedText = alreadySaved.value.trim();
        const saved = savedText ? Number(savedText) : 0;
        if (!(amount > 0) || !targetDate.value) {
            preview.textContent = 'Add an amount and a date to see the required day, week, month, and year pace.';
            return;
        }
        const remaining = Math.max(0, amount - (Number.isFinite(saved) && saved > 0 ? saved : 0));
        const days = Math.max(
            0,
            Math.round(
                (Date.parse(`${targetDate.value}T00:00:00`) - Date.parse(`${todayKey()}T00:00:00`)) / 86400000
            )
        );
        const pace = requiredPaceForAmount(remaining, days);
        preview.textContent = remaining <= 0
            ? 'Already funded. No additional hold is required.'
            : `${Utils.formatMoney(pace.daily)} / day · ${Utils.formatMoney(pace.weekly)} / week · ${Utils.formatMoney(pace.monthly)} this month · ${Utils.formatMoney(pace.yearly)} / year.`;
    };
    [targetAmount, alreadySaved].forEach((element) => {
        element.addEventListener('input', updatePreview);
    });
    targetDate.addEventListener('input', () => {
        if (horizon !== GOAL_HORIZONS.CUSTOM) applyHorizonDate(GOAL_HORIZONS.CUSTOM, { fillDate: false });
        else updatePreview();
    });
    updatePreview();

    const actions = document.createElement('div');
    actions.className = 'modal-actions goal-dialog-actions';
    if (editing) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn-ghost goal-delete';
        remove.textContent = 'Delete';
        remove.addEventListener('click', async () => {
            const choice = await confirmDialog({
                title: 'Delete this goal?',
                message: `Remove “${goal.title}” from the planner?`,
                confirmText: 'Delete',
                danger: true
            });
            if (!choice.confirmed) return;
            closeGoalDialog();
            patch({ goals: sanitizeGoals(getState().goals).filter((item) => item.id !== goal.id) });
            Toast.show('Goal deleted.', 'success');
        });
        actions.appendChild(remove);
    }
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn-ghost';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', closeGoalDialog);
    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'btn-primary';
    save.textContent = editing ? 'Save goal' : 'Add goal';
    actions.append(cancel, save);

    form.append(
        field('Goal title', title),
        length,
        dateField,
        amountGroup,
        field('Already set aside', alreadySaved, 'Money already reserved for this goal. It is not taken from the shared bank amount.'),
        field('Note', note),
        bankToggle,
        preview,
        help,
        error,
        actions
    );
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        error.hidden = true;
        [title, targetDate, targetAmount, alreadySaved].forEach((element) => {
            element.removeAttribute('aria-invalid');
            if (element.getAttribute('aria-describedby') === error.id) {
                element.removeAttribute('aria-describedby');
            }
        });
        targetAmount.setAttribute('aria-describedby', help.id);
        const amountText = targetAmount.value.trim();
        const savedText = alreadySaved.value.trim();
        const candidate = sanitizeGoal({
            id: goal?.id || createGoalId(),
            title: title.value,
            targetDate: targetDate.value,
            targetAmount: amountText ? Number(amountText) : null,
            alreadySaved: savedText ? Number(savedText) : null,
            note: note.value,
            horizon,
            includeBankSavings: includeBank,
            createdAt: goal?.createdAt || Date.now()
        });
        let problem = '';
        let invalid = null;
        if (!title.value.trim()) {
            problem = 'Enter a goal title.';
            invalid = title;
        } else if (!targetDate.value) {
            problem = 'Choose a target date.';
            invalid = targetDate;
        } else if (targetDate.value < todayKey()) {
            problem = 'Choose today or a future date.';
            invalid = targetDate;
        } else if (amountText && (!(Number(amountText) > 0) || Number(amountText) > 1e9)) {
            problem = 'Enter a target amount between $0.01 and $1 billion, or leave it blank.';
            invalid = targetAmount;
        } else if (savedText && (!(Number(savedText) >= 0) || Number(savedText) > 1e9)) {
            problem = 'Already set aside must be between $0 and $1 billion, or blank.';
            invalid = alreadySaved;
        } else if (!candidate) {
            problem = 'Check the goal details and try again.';
            invalid = title;
        }
        if (problem) {
            error.textContent = problem;
            error.hidden = false;
            invalid?.setAttribute('aria-invalid', 'true');
            const describedBy = [invalid?.getAttribute('aria-describedby'), error.id]
                .filter(Boolean)
                .join(' ');
            invalid?.setAttribute('aria-describedby', describedBy);
            invalid?.focus();
            return;
        }

        const goals = sanitizeGoals(getState().goals);
        const index = goals.findIndex((item) => item.id === candidate.id);
        if (index >= 0) goals[index] = candidate;
        else goals.push(candidate);
        closeGoalDialog();
        patch({ goals });
        Toast.show(editing ? 'Goal updated.' : 'Goal added.', 'success');
    });

    dialog.append(header, form);
    backdrop.appendChild(dialog);
    backdrop.addEventListener('mousedown', (event) => {
        if (event.target === backdrop) closeGoalDialog();
    });
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');
    lockBodyScroll();
    goalBackdrop = backdrop;
    goalKeyHandler = (event) => {
        if (event.key !== 'Escape') return;
        const openLayers = [...document.querySelectorAll('.backdrop.open')];
        if (openLayers.at(-1) !== goalBackdrop) return;
        event.preventDefault();
        event.stopPropagation();
        closeGoalDialog();
    };
    document.addEventListener('keydown', goalKeyHandler, true);
    activateDialogFocus(dialog, title);
}

export function createGoalTrigger() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'planner-goal-add';
    button.setAttribute('aria-label', 'Add savings goal');
    button.title = 'Add savings goal';
    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 5v14M5 12h14"></path>
        </svg>`;
    button.addEventListener('click', () => openGoalDialog());
    return button;
}

function stateCopy(goal) {
    if (goal.state === GOAL_STATES.NO_AMOUNT) return 'No price set';
    if (goal.state === GOAL_STATES.COMPLETE) return 'Complete';
    if (goal.state === GOAL_STATES.AHEAD) return 'Ahead';
    if (goal.state === GOAL_STATES.ACHIEVABLE) return 'On track';
    if (goal.state === GOAL_STATES.BEHIND) return 'Behind';
    return 'Unachievable';
}

function moveGoal(goalId, targetId) {
    if (!goalId || !targetId || goalId === targetId) return;
    const goals = sanitizeGoals(getState().goals);
    const from = goals.findIndex((goal) => goal.id === goalId);
    const to = goals.findIndex((goal) => goal.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = goals.splice(from, 1);
    goals.splice(to, 0, moved);
    patch({ goals });
}

function moveGoalBy(goalId, delta) {
    const goals = sanitizeGoals(getState().goals);
    const from = goals.findIndex((goal) => goal.id === goalId);
    const to = Math.max(0, Math.min(goals.length - 1, from + delta));
    if (from < 0 || from === to) return;
    const [moved] = goals.splice(from, 1);
    goals.splice(to, 0, moved);
    patch({ goals });
    requestAnimationFrame(() => (
        document.querySelector(`[data-goal-id="${goalId}"] .goal-drag-handle`)?.focus()
    ));
}

function goalCard(goal, index, count) {
    const card = document.createElement('article');
    card.className = `planner-goal-card is-${goal.state}`;
    card.dataset.goalId = goal.id;
    card.setAttribute('role', 'listitem');

    const handle = document.createElement('span');
    handle.className = 'goal-drag-handle';
    handle.tabIndex = 0;
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', `Reorder ${goal.title}. Use up and down arrow keys.`);
    handle.innerHTML = '<i class="ti ti-grip-vertical" aria-hidden="true"></i>';
    handle.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        moveGoalBy(goal.id, event.key === 'ArrowUp' ? -1 : 1);
    });
    if (index === 0) handle.dataset.first = '';
    if (index === count - 1) handle.dataset.last = '';

    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'goal-card-body';
    body.addEventListener('click', () => openGoalDialog(goal));
    const top = document.createElement('span');
    top.className = 'goal-card-top';
    const title = document.createElement('strong');
    title.textContent = goal.title;
    const state = document.createElement('span');
    state.className = 'goal-state';
    state.textContent = stateCopy(goal);
    top.append(title, state);

    const meta = document.createElement('span');
    meta.className = 'goal-meta';
    meta.textContent = `${horizonCopy(goal.horizon)} · ${dateLabel(goal.targetDate)} · ${remainingCopy(goal)}`;

    const figures = document.createElement('span');
    figures.className = 'goal-figures';
    if (goal.state === GOAL_STATES.NO_AMOUNT) {
        figures.textContent = 'Add an amount to calculate a required savings pace.';
    } else {
        const funded = `${Utils.formatMoney(goal.currentAllocation)} of ${Utils.formatMoney(goal.targetAmount)}`;
        const percent = `${Math.round(goal.progress * 100)}%`;
        const unit = goalPaceLabel(goalView.pace);
        const amount = Utils.formatMoney(goalPaceAmount(goal, goalView.pace));
        const pace = unit.startsWith('this ')
            ? `${amount} ${unit} to stay on pace`
            : `${amount} / ${unit} to stay on pace`;
        figures.textContent = `${funded} (${percent}) · ${pace}`;
    }
    body.append(top, meta, figures);

    if (goal.targetAmount) {
        const track = document.createElement('span');
        track.className = 'goal-progress';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(Math.round(goal.progress * 100)));
        track.setAttribute('aria-label', `${goal.title} ${Math.round(goal.progress * 100)} percent funded`);
        const fill = document.createElement('span');
        fill.style.width = `${Math.round(goal.progress * 100)}%`;
        track.appendChild(fill);
        body.appendChild(track);
    }

    if (goalView.projections && goal.targetAmount) {
        const projection = document.createElement('span');
        projection.className = 'goal-projection';
        if (goal.state === GOAL_STATES.COMPLETE) {
            projection.textContent = 'Funded. Nothing more needs to be held for this goal.';
        } else if (goal.incomingAllocation > 0 && goal.shortfall <= 0) {
            projection.textContent = `Upcoming pay of ${Utils.formatMoney(goal.incomingAllocation)} before ${dateLabel(goal.targetDate)} covers this goal.`;
        } else if (goal.projectedDate && goal.shortfall <= 0) {
            projection.textContent = `On pace to finish ${dateLabel(goal.projectedDate)} · ${Utils.formatMoney(goal.projectedAmount)} projected.`;
        } else if (goal.incomingAllocation > 0) {
            projection.textContent = `${Utils.formatMoney(goal.shortfall)} short after ${Utils.formatMoney(goal.incomingAllocation)} incoming · projected ${Utils.formatMoney(goal.projectedAmount)} by ${dateLabel(goal.targetDate)}.`;
        } else if (goal.projectedDate) {
            projection.textContent = `${Utils.formatMoney(goal.shortfall)} short at the current surplus · projected ${Utils.formatMoney(goal.projectedAmount)} by ${dateLabel(goal.targetDate)}.`;
        } else {
            projection.textContent = `${Utils.formatMoney(goal.shortfall)} short if no surplus is held. Add leftover or a monthly hold to build a finish date.`;
        }
        body.appendChild(projection);
    }

    if (goal.note) {
        const note = document.createElement('span');
        note.className = 'goal-note';
        note.textContent = goal.note;
        body.appendChild(note);
    }
    card.append(handle, body);

    let ghost = null;
    let targetId = null;
    bindThresholdDrag(card, {
        onDragStart: (event) => {
            ghost = makeGhost(goal.title);
            card.classList.add('is-dragging');
            placeGhost(ghost, event.clientX, event.clientY);
        },
        onDragMove: (event) => {
            placeGhost(ghost, event.clientX, event.clientY);
            const target = document.elementFromPoint(event.clientX, event.clientY)
                ?.closest?.('.planner-goal-card[data-goal-id]');
            clearDropMarks(card.parentElement, '.planner-goal-card.is-drop-target');
            targetId = target?.dataset.goalId || null;
            if (target && target !== card) target.classList.add('is-drop-target');
        },
        onDragEnd: () => {
            ghost?.remove();
            clearDropMarks(card.parentElement, '.planner-goal-card');
            if (targetId) moveGoal(goal.id, targetId);
        }
    });
    return card;
}

function toolsBar() {
    const bar = document.createElement('div');
    bar.className = 'planner-goal-tools';
    const pace = segmentGroup({
        name: 'goal-pace-view',
        legend: 'Show required pace as',
        options: PACE_OPTIONS,
        value: goalView.pace,
        onChange: (value) => setGoalView({ pace: value }),
        variant: 'goal-seg--equal'
    });
    const projections = switchRow({
        id: 'goal-show-projections',
        checked: goalView.projections,
        label: 'Show projections',
        hint: 'Finish date and shortfall at the current surplus.',
        onChange: (checked) => setGoalView({ projections: checked }),
        variant: 'goal-switch--bar'
    });
    bar.append(pace, projections);
    return bar;
}

function paceLab(assessment) {
    const priced = assessment.goals.filter((goal) => goal.targetAmount && goal.state !== GOAL_STATES.COMPLETE);
    const remaining = priced.reduce((sum, goal) => (
        sum + Math.max(0, Utils.toCents(goal.targetAmount) - Utils.toCents(goal.currentAllocation))
    ), 0);
    const lab = document.createElement('div');
    lab.className = 'planner-goal-lab';
    const heading = document.createElement('h4');
    heading.textContent = 'Pace lab';
    const detail = document.createElement('p');
    detail.className = 'goal-field-hint';
    detail.textContent = 'See when leftover would finish every open goal if that monthly amount continued. This does not change the ledger.';
    const amount = input(
        'goal-pace-lab',
        'number',
        assessment.totalRequiredMonthly > 0 ? String(assessment.totalRequiredMonthly) : ''
    );
    amount.min = '0';
    amount.step = '0.01';
    amount.inputMode = 'decimal';
    amount.placeholder = 'Monthly amount';
    const result = document.createElement('p');
    result.className = 'goal-lab-result';
    result.setAttribute('aria-live', 'polite');
    const update = () => {
        const monthly = Number(amount.value);
        if (!(monthly > 0) || remaining <= 0) {
            result.textContent = remaining <= 0
                ? 'No open priced goals to project.'
                : 'Enter a monthly amount to project a finish date.';
            return;
        }
        const finish = finishDateAtMonthlyPace(Utils.fromCents(remaining), monthly);
        result.textContent = finish.date
            ? `${Utils.formatMoney(Utils.fromCents(remaining))} left finishes around ${dateLabel(finish.date)} at ${Utils.formatMoney(monthly)} / month.`
            : 'Enter a monthly amount to project a finish date.';
    };
    amount.addEventListener('input', update);
    update();
    lab.append(heading, detail, field('If you hold this much each month', amount), result);
    return lab;
}

export function renderGoalsPanel({ snap, goals, plan }) {
    lastPanelArgs = { snap, goals, plan };
    const monthlySurplus = Math.max(0, Number(snap.leftToSpend) + Number(snap.savingsHold));
    const { events, currentDate } = getState();
    const assessment = snap.goalAssessment || assessGoals(goals, {
        currentSavings: plan.currentSavings,
        monthlySurplus,
        upcomingIncome: horizonIncomeItems(events, new Date(), currentDate, plan),
        asOf: new Date()
    });
    const section = document.createElement('section');
    section.className = 'oe-card planner-goals';
    const header = document.createElement('header');
    header.className = 'planner-goals-head';
    const copy = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = 'Savings goals';
    const detail = document.createElement('p');
    detail.textContent = assessment.goals.length
        ? 'Priority runs top to bottom. Bank savings, leftover, and upcoming pay before each deadline are allocated once. Quality settings choose leftover-only if you want the stricter test.'
        : 'Pick a week, month, year, or custom date. Upcoming checks count toward the goal even when leftover uses deposited cash only.';
    copy.append(heading, detail);
    header.appendChild(copy);
    section.appendChild(header);

    if (!assessment.goals.length) {
        const empty = document.createElement('button');
        empty.type = 'button';
        empty.className = 'planner-goal-empty';
        empty.innerHTML = '<i class="ti ti-target-arrow" aria-hidden="true"></i><span><strong>Set your first goal</strong><small>Plan an emergency fund, purchase, trip, or other target for a week, month, year, or custom date.</small></span>';
        empty.addEventListener('click', () => openGoalDialog());
        section.appendChild(empty);
        return section;
    }

    section.appendChild(toolsBar());

    const list = document.createElement('div');
    list.className = 'planner-goal-list';
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', 'Savings goals in allocation priority');
    list.append(...assessment.goals.map((goal, index) => goalCard(goal, index, assessment.goals.length)));
    section.appendChild(list);

    const priced = assessment.goals.filter((goal) => goal.targetAmount);
    if (priced.length) {
        const advice = document.createElement('div');
        advice.className = 'planner-goal-advice';
        const days = Math.max(1, Number(snap.daysLeft) || 30);
        const goalDaily = assessment.totalRequiredDaily;
        const recommendedDaily = Math.max(0, (monthlySurplus - assessment.totalRequiredMonthly) / days);
        const recommendedWeekly = recommendedDaily * Math.min(7, days);
        if (assessment.goals.some((goal) => (
            goal.state === GOAL_STATES.UNACHIEVABLE || goal.state === GOAL_STATES.BEHIND
        ))) {
            advice.classList.add('has-risk');
        }
        const text = document.createElement('p');
        const unit = goalPaceLabel(goalView.pace);
        const requiredForView = goalView.pace === GOAL_PACE_VIEWS.DAY
            ? assessment.totalRequiredDaily
            : goalView.pace === GOAL_PACE_VIEWS.WEEK
                ? assessment.totalRequiredWeekly
                : goalView.pace === GOAL_PACE_VIEWS.YEAR
                    ? assessment.totalRequiredYearly
                    : assessment.totalRequiredMonthly;
        const requiredBit = unit.startsWith('this ')
            ? `${Utils.formatMoney(requiredForView)} ${unit}`
            : `${Utils.formatMoney(requiredForView)} / ${unit}`;
        text.innerHTML = `<strong>${Utils.formatMoney(assessment.totalRequiredMonthly)} this month to stay on pace</strong><span>${requiredBit} across open goals · ${Utils.formatMoney(goalDaily)} / day toward goals · recommended spending cap ${Utils.formatMoney(recommendedDaily)} / day or ${Utils.formatMoney(recommendedWeekly)} / week after the hold.</span>`;
        const allocate = document.createElement('button');
        allocate.type = 'button';
        allocate.className = 'btn-secondary';
        allocate.disabled = !(assessment.totalRequiredMonthly > 0);
        allocate.textContent = assessment.totalRequiredMonthly > 0
            ? `Hold ${Utils.formatMoney(assessment.totalRequiredMonthly)} this month`
            : 'No monthly hold needed';
        allocate.addEventListener('click', async () => {
            const fixedHold = fixedHoldForTarget(
                assessment.totalRequiredMonthly,
                snap.reserveOn ? snap.weeklyReserve : 0,
                snap.pctHold
            );
            const result = await confirmDialog({
                title: 'Use this goal hold?',
                message: `Set fixed monthly savings to ${Utils.formatMoney(fixedHold)} so all active holds cover at least ${Utils.formatMoney(assessment.totalRequiredMonthly)} this month? This updates the planner waterfall; it does not move bank funds.`,
                confirmText: 'Use goal hold'
            });
            if (!result.confirmed) return;
            patch({
                plan: sanitizePlan({
                    ...getState().plan,
                    savingsFixed: fixedHold
                })
            });
            Toast.show('Monthly goal hold applied.', 'success');
        });
        advice.append(text, allocate);
        section.appendChild(advice);
        section.appendChild(paceLab(assessment));
    }
    return section;
}
