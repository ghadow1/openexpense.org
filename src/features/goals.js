/**
 * OpenExpense — planner savings goals
 *
 * Goal metadata stays inside the encrypted ledger. This module owns the modal,
 * ordered goal cards, priority drag behavior, and the explicit action that
 * copies the calculated monthly pace into the planner savings hold.
 */
import { getState, patch } from '../core/store.js';
import {
    GOAL_STATES,
    assessGoals,
    createGoalId,
    sanitizeGoal,
    sanitizeGoals
} from '../core/goals.js';
import { fixedHoldForTarget, sanitizePlan } from '../core/plan.js';
import { Utils } from '../core/utils.js';
import { activateDialogFocus, deactivateDialogFocus } from '../ui/dialog-focus.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { bindThresholdDrag, clearDropMarks, makeGhost, placeGhost } from '../ui/pointer-drag.js';
import { confirmDialog } from '../ui/confirm.js';
import { Toast } from '../ui/toast.js';

let goalBackdrop = null;
let goalKeyHandler = null;

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

function field(label, input) {
    const group = document.createElement('div');
    group.className = 'goal-field';
    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'field-label';
    fieldLabel.htmlFor = input.id;
    fieldLabel.textContent = label;
    group.append(fieldLabel, input);
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

export function openGoalDialog(existing = null) {
    closeGoalDialog();
    const goal = existing ? sanitizeGoal(existing) : null;
    const editing = !!goal;

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
    const targetDate = input('goal-target-date', 'date', goal?.targetDate || '');
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

    const amountLabel = document.createElement('span');
    amountLabel.textContent = 'Target amount';
    const optional = document.createElement('span');
    optional.className = 'dash-plan-optional';
    optional.textContent = 'Optional';
    amountLabel.append(' ', optional);
    const amountGroup = field('', targetAmount);
    amountGroup.querySelector('label').replaceChildren(amountLabel);

    const note = document.createElement('p');
    note.className = 'goal-form-note';
    note.id = 'goal-form-note';
    note.textContent = 'Goals use your current bank savings and monthly surplus in priority order. Drag cards later to change that order.';
    targetAmount.setAttribute('aria-describedby', 'goal-form-note');
    const error = document.createElement('p');
    error.className = 'confirm-field-error';
    error.id = 'goal-form-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;

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
        field('Target date', targetDate),
        amountGroup,
        note,
        error,
        actions
    );
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        error.hidden = true;
        [title, targetDate, targetAmount].forEach((element) => {
            element.removeAttribute('aria-invalid');
            if (element.getAttribute('aria-describedby') === error.id) {
                element.removeAttribute('aria-describedby');
            }
        });
        targetAmount.setAttribute('aria-describedby', note.id);
        const amountText = targetAmount.value.trim();
        const candidate = sanitizeGoal({
            id: goal?.id || createGoalId(),
            title: title.value,
            targetDate: targetDate.value,
            targetAmount: amountText ? Number(amountText) : null,
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
    if (goal.state === GOAL_STATES.ACHIEVABLE) return 'Achievable';
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
    meta.textContent = `${dateLabel(goal.targetDate)} · ${goal.daysRemaining} day${goal.daysRemaining === 1 ? '' : 's'} left`;
    const figures = document.createElement('span');
    figures.className = 'goal-figures';
    if (goal.state === GOAL_STATES.NO_AMOUNT) {
        figures.textContent = 'Add an amount to calculate a required savings pace.';
    } else if (goal.state === GOAL_STATES.ACHIEVABLE) {
        figures.textContent = `${Utils.formatMoney(goal.monthlyAllocation)} / month allocated · target ${Utils.formatMoney(goal.targetAmount)}`;
    } else {
        figures.textContent = `${Utils.formatMoney(goal.requiredMonthly)} / month needed · ${Utils.formatMoney(goal.shortfall)} projected short`;
    }
    body.append(top, meta, figures);

    if (goal.targetAmount) {
        const track = document.createElement('span');
        track.className = 'goal-progress';
        const fill = document.createElement('span');
        fill.style.width = `${Math.round(goal.progress * 100)}%`;
        track.appendChild(fill);
        body.appendChild(track);
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

export function renderGoalsPanel({ snap, goals, plan }) {
    const monthlySurplus = Math.max(0, Number(snap.leftToSpend) + Number(snap.savingsHold));
    const assessment = snap.goalAssessment || assessGoals(goals, {
        currentSavings: plan.currentSavings,
        monthlySurplus,
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
        ? 'Priority runs top to bottom. Current savings and monthly surplus are allocated once.'
        : 'Add a target, deadline, and optional amount to test it against your plan.';
    copy.append(heading, detail);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'planner-goal-inline-add';
    add.textContent = 'Add goal';
    add.addEventListener('click', () => openGoalDialog());
    header.append(copy, add);
    section.appendChild(header);

    if (!assessment.goals.length) {
        const empty = document.createElement('button');
        empty.type = 'button';
        empty.className = 'planner-goal-empty';
        empty.innerHTML = '<i class="ti ti-target-arrow" aria-hidden="true"></i><span><strong>Set your first goal</strong><small>Plan an emergency fund, purchase, trip, or other target.</small></span>';
        empty.addEventListener('click', () => openGoalDialog());
        section.appendChild(empty);
        return section;
    }

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
        const goalDaily = assessment.totalRequiredMonthly / (365.25 / 12);
        const recommendedDaily = Math.max(0, (monthlySurplus - assessment.totalRequiredMonthly) / days);
        const recommendedWeekly = recommendedDaily * Math.min(7, days);
        if (assessment.goals.some((goal) => goal.state === GOAL_STATES.UNACHIEVABLE)) {
            advice.classList.add('has-risk');
        }
        const text = document.createElement('p');
        text.innerHTML = `<strong>${Utils.formatMoney(assessment.totalRequiredMonthly)} / month required</strong><span>${Utils.formatMoney(goalDaily)} / day toward goals · recommended spending cap ${Utils.formatMoney(recommendedDaily)} / day or ${Utils.formatMoney(recommendedWeekly)} / week.</span>`;
        const allocate = document.createElement('button');
        allocate.type = 'button';
        allocate.className = 'btn-secondary';
        allocate.disabled = !(assessment.totalRequiredMonthly > 0);
        allocate.textContent = assessment.totalRequiredMonthly > 0
            ? `Hold ${Utils.formatMoney(assessment.totalRequiredMonthly)} monthly`
            : 'No monthly hold needed';
        allocate.addEventListener('click', async () => {
            const fixedHold = fixedHoldForTarget(
                assessment.totalRequiredMonthly,
                snap.reserveOn ? snap.weeklyReserve : 0,
                snap.pctHold
            );
            const result = await confirmDialog({
                title: 'Use this goal hold?',
                message: `Set fixed monthly savings to ${Utils.formatMoney(fixedHold)} so all active holds cover at least ${Utils.formatMoney(assessment.totalRequiredMonthly)}? This updates the planner waterfall; it does not move bank funds.`,
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
    }
    return section;
}
