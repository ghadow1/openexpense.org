import test from 'node:test';
import assert from 'node:assert/strict';
import {
    GOAL_STATES,
    assessGoals,
    goalDaysRemaining,
    goalMilestones,
    sanitizeGoal,
    sanitizeGoals
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
        serverToken: 'drop-me'
    });
    assert.deepEqual(goal, {
        id: GOAL_A,
        title: 'Emergency fund',
        targetDate: '2026-12-31',
        targetAmount: 1000.13,
        createdAt: 123
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
});

test('day math uses calendar dates without DST drift', () => {
    assert.equal(goalDaysRemaining('2026-09-18', new Date(2026, 7, 19)), 30);
    assert.equal(goalDaysRemaining('2026-08-19', new Date(2026, 7, 19)), 0);
    assert.equal(goalDaysRemaining('2026-08-18', new Date(2026, 7, 19)), 0);
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
    assert.equal(assessed.goals[0].monthlyAllocation, 202.92);
    assert.equal(assessed.goals[0].state, GOAL_STATES.ACHIEVABLE);
    assert.equal(assessed.goals[1].currentAllocation, 0);
    assert.equal(assessed.goals[1].monthlyAllocation, 197.08);
    assert.equal(assessed.goals[1].state, GOAL_STATES.UNACHIEVABLE);
    assert.equal(assessed.totalAllocatedMonthly, 400);
    assert.equal(assessed.unallocatedMonthlySurplus, 0);
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
    assert.equal(result.goals[1].state, GOAL_STATES.ACHIEVABLE);
});

test('milestones retain only target months in the selected year', () => {
    const milestones = goalMilestones([
        { id: GOAL_A, title: 'December', targetDate: '2026-12-01', createdAt: 1 },
        { id: GOAL_B, title: 'Next year', targetDate: '2027-01-01', createdAt: 2 }
    ], 2026);
    assert.deepEqual(milestones, [{ index: 11, label: 'December', date: '2026-12-01' }]);
});
