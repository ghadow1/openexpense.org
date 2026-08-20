import test from 'node:test';
import assert from 'node:assert/strict';
import {
    GOAL_HORIZONS,
    GOAL_STATES,
    assessGoals,
    atRiskGoals,
    finishDateAtMonthlyPace,
    goalDaysRemaining,
    goalMilestones,
    requiredPaceForAmount,
    sanitizeGoal,
    sanitizeGoals,
    targetDateForHorizon
} from '../src/core/goals.js';

const GOAL_A = '11111111111111111111111111111111';
const GOAL_B = '22222222222222222222222222222222';

test('goal sanitizer keeps bounded local metadata', () => {
    const goal = sanitizeGoal({
        id: GOAL_A,
        title: '  Emergency   fund  ',
        targetDate: '2026-12-31',
        targetAmount: 1000.129,
        createdAt: 123,
        horizon: 'yearly',
        note: '  Keep   six months  ',
        alreadySaved: 250.4,
        includeBankSavings: false,
        serverToken: 'drop-me'
    });
    assert.deepEqual(goal, {
        id: GOAL_A,
        title: 'Emergency fund',
        targetDate: '2026-12-31',
        targetAmount: 1000.13,
        createdAt: 123,
        horizon: 'yearly',
        note: 'Keep six months',
        alreadySaved: 250.4,
        includeBankSavings: false
    });
    assert.equal(sanitizeGoal({ title: '', targetDate: '2026-12-31' }), null);
    assert.equal(sanitizeGoal({ title: 'Bad date', targetDate: '2026-02-31' }), null);
});

test('goals keep first unique ids and support optional amounts', () => {
    const goals = sanitizeGoals([
        { id: GOAL_A, title: 'Trip', targetDate: '2027-06-01' },
        { id: GOAL_A, title: 'Duplicate', targetDate: '2027-07-01', targetAmount: 5 },
        { id: GOAL_B, title: 'Laptop', targetDate: '2027-08-01', targetAmount: -1 }
    ]);
    assert.equal(goals.length, 2);
    assert.equal(goals[0].targetAmount, undefined);
    assert.equal(goals[1].targetAmount, undefined);
    assert.equal(goals[0].horizon, undefined);
});

test('day math uses calendar dates without DST drift', () => {
    assert.equal(goalDaysRemaining('2026-09-18', new Date(2026, 7, 19)), 30);
    assert.equal(goalDaysRemaining('2026-08-19', new Date(2026, 7, 19)), 0);
    assert.equal(goalDaysRemaining('2026-08-18', new Date(2026, 7, 19)), 0);
});

test('length presets fill a week, this month-end, or next year', () => {
    const asOf = new Date(2026, 7, 20);
    assert.equal(targetDateForHorizon(GOAL_HORIZONS.WEEKLY, asOf), '2026-08-27');
    assert.equal(targetDateForHorizon(GOAL_HORIZONS.MONTHLY, asOf), '2026-08-31');
    assert.equal(targetDateForHorizon(GOAL_HORIZONS.YEARLY, asOf), '2027-08-20');
    assert.equal(targetDateForHorizon(GOAL_HORIZONS.MONTHLY, new Date(2026, 7, 30)), '2026-09-30');
});

test('required pace is remaining divided by time left, not a daily rate stretched to 30.44 days', () => {
    const pace = requiredPaceForAmount(2500, 11, new Date(2026, 7, 20));
    assert.equal(pace.daily, 227.27);
    assert.equal(pace.weekly, 1590.91);
    assert.equal(pace.monthly, 2500);
    assert.ok(pace.monthly < 6917);
    assert.equal(pace.yearly, 83011.36);
});

test('feasibility allocates savings and surplus once in priority order', () => {
    const assessed = assessGoals([
        { id: GOAL_A, title: 'First', targetDate: '2026-09-18', targetAmount: 500, createdAt: 1 },
        { id: GOAL_B, title: 'Second', targetDate: '2026-09-18', targetAmount: 500, createdAt: 2 }
    ], {
        currentSavings: 300,
        monthlySurplus: 400,
        asOf: new Date(2026, 7, 19)
    });

    assert.equal(assessed.goals[0].currentAllocation, 300);
    assert.equal(assessed.goals[0].requiredMonthly, 200);
    assert.equal(assessed.goals[0].monthlyAllocation, 200);
    assert.equal(assessed.goals[0].projectedAmount, 500);
    assert.equal(assessed.goals[0].state, GOAL_STATES.ACHIEVABLE);
    assert.equal(assessed.goals[1].currentAllocation, 0);
    assert.equal(assessed.goals[1].requiredMonthly, 500);
    assert.equal(assessed.goals[1].monthlyAllocation, 200);
    assert.equal(assessed.goals[1].projectedAmount, 200);
    assert.equal(assessed.goals[1].state, GOAL_STATES.BEHIND);
    assert.equal(assessed.totalAllocatedMonthly, 400);
    assert.equal(assessed.unallocatedMonthlySurplus, 0);
});

test('at-risk goals are priced targets the current surplus cannot finish', () => {
    const assessed = assessGoals([
        { id: GOAL_A, title: 'Covered', targetDate: '2026-09-18', targetAmount: 100, createdAt: 1 },
        { id: GOAL_B, title: 'Short', targetDate: '2026-09-18', targetAmount: 500, createdAt: 2 },
        { id: '33333333333333333333333333333333', title: 'Note', targetDate: '2026-09-18', createdAt: 3 }
    ], {
        currentSavings: 100,
        monthlySurplus: 0,
        asOf: new Date(2026, 7, 19)
    });
    const risky = atRiskGoals(assessed);
    assert.equal(risky.length, 1);
    assert.equal(risky[0].title, 'Short');
});

test('amount-free goals stay neutral and do not consume allocation', () => {
    const result = assessGoals([
        { id: GOAL_A, title: 'Decide later', targetDate: '2026-12-01', createdAt: 1 },
        { id: GOAL_B, title: 'Funded', targetDate: '2026-08-19', targetAmount: 100, createdAt: 2 }
    ], {
        currentSavings: 100,
        monthlySurplus: 0,
        asOf: new Date(2026, 7, 19)
    });
    assert.equal(result.goals[0].state, GOAL_STATES.NO_AMOUNT);
    assert.equal(result.goals[1].state, GOAL_STATES.COMPLETE);
    assert.equal(result.unallocatedCurrentSavings, 0);
});

test('displayed and aggregate required monthly hold use the same cent ceiling', () => {
    const result = assessGoals([
        { id: GOAL_A, title: 'Small target', targetDate: '2026-08-25', targetAmount: 1, createdAt: 1 }
    ], {
        currentSavings: 0,
        monthlySurplus: 0,
        asOf: new Date(2026, 7, 19)
    });
    assert.equal(result.goals[0].requiredMonthly, 1);
    assert.equal(result.goals[0].requiredThisMonth, 1);
    assert.equal(result.totalRequiredMonthly, 1);
});

test('already-saved cash is earmarked before the shared bank amount', () => {
    const result = assessGoals([
        {
            id: GOAL_A,
            title: 'Trip',
            targetDate: '2026-08-31',
            targetAmount: 400,
            alreadySaved: 150,
            createdAt: 1
        }
    ], {
        currentSavings: 100,
        monthlySurplus: 0,
        asOf: new Date(2026, 7, 20)
    });
    assert.equal(result.goals[0].currentAllocation, 250);
    assert.equal(result.goals[0].requiredDaily, 13.64);
    assert.equal(result.goals[0].requiredMonthly, 150);
    assert.equal(result.unallocatedCurrentSavings, 0);
});

test('goals can skip the shared bank pool', () => {
    const result = assessGoals([
        {
            id: GOAL_A,
            title: 'Envelope only',
            targetDate: '2026-08-31',
            targetAmount: 200,
            includeBankSavings: false,
            createdAt: 1
        }
    ], {
        currentSavings: 200,
        monthlySurplus: 0,
        asOf: new Date(2026, 7, 20)
    });
    assert.equal(result.goals[0].currentAllocation, 0);
    assert.equal(result.unallocatedCurrentSavings, 200);
    assert.equal(result.goals[0].state, GOAL_STATES.UNACHIEVABLE);
});

test('a short-horizon goal holds the remaining amount this month', () => {
    const result = assessGoals([
        { id: GOAL_A, title: '2500 Savings', targetDate: '2026-08-31', targetAmount: 2500, createdAt: 1 }
    ], {
        currentSavings: 0,
        monthlySurplus: 0,
        asOf: new Date(2026, 7, 20)
    });
    assert.equal(result.goals[0].daysRemaining, 11);
    assert.equal(result.goals[0].requiredDaily, 227.27);
    assert.equal(result.goals[0].requiredMonthly, 2500);
    assert.equal(result.totalRequiredMonthly, 2500);
    assert.equal(result.goals[0].shortfall, 2500);
    assert.equal(result.goals[0].state, GOAL_STATES.UNACHIEVABLE);
});

test('pace lab projects a finish date from a monthly contribution', () => {
    const finish = finishDateAtMonthlyPace(1200, 400, new Date(2026, 7, 20));
    assert.equal(finish.date, '2026-11-21');
    assert.equal(finish.months, 3);
});

test('milestones retain only target months in the selected year', () => {
    const milestones = goalMilestones([
        { id: GOAL_A, title: 'December', targetDate: '2026-12-01', createdAt: 1 },
        { id: GOAL_B, title: 'Next year', targetDate: '2027-01-01', createdAt: 2 }
    ], 2026);
    assert.deepEqual(milestones, [{ index: 11, label: 'December', date: '2026-12-01' }]);
});
