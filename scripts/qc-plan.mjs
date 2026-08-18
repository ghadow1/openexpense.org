/**
 * Planner waterfall, ratios, runway, and weekly pace.
 * Numbers are whole cents; leftover identities are asserted, not estimated.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../src/core/utils.js';
import {
    PLAN_DEFAULTS,
    RATIO_NEEDS,
    RATIO_WANTS,
    calendarRowWeeks,
    classifyRatioSpend,
    computePlanner,
    dailySafeSpend,
    describePlan,
    incomeUsed,
    monthDaySpend,
    monthReserve,
    monthWeekBuckets,
    overBudgetRows,
    percentOf,
    planIsDefault,
    ratioBucket,
    remainingDays,
    runwayDays,
    sanitizePlan,
    spendUsed,
    unpaidRecurring,
    weekBounds,
    windowTotals
} from '../src/core/plan.js';

test('sanitizePlan restores the original cash-line defaults', () => {
    assert.deepEqual(sanitizePlan(undefined), PLAN_DEFAULTS);
    assert.deepEqual(sanitizePlan([]), PLAN_DEFAULTS);
    assert.deepEqual(sanitizePlan('x'), PLAN_DEFAULTS);
    assert.equal(planIsDefault({}), true);
    assert.equal(planIsDefault({ weeklySavings: 25 }), false);
    assert.equal(planIsDefault({ taxWithholdPct: 15.3 }), false);
    assert.equal(planIsDefault({ ratioNeeds: 40, ratioWants: 40, ratioSave: 20 }), false);
});

test('sanitizePlan keeps only known rule values', () => {
    const clean = sanitizePlan({
        weeklySavings: 40.125,
        reserveSavings: false,
        spendBasis: 'paid',
        incomeBasis: 'scheduled',
        taxWithholdPct: 15.3,
        savingsPct: 20,
        savingsFixed: 200,
        extra: true,
        __proto__: { weeklySavings: 9 }
    });
    assert.equal(clean.weeklySavings, 40.13);
    assert.equal(clean.reserveSavings, false);
    assert.equal(clean.spendBasis, 'paid');
    assert.equal(clean.incomeBasis, 'scheduled');
    assert.equal(clean.taxWithholdPct, 15.3);
    assert.equal(clean.savingsPct, 20);
    assert.equal(clean.savingsFixed, 200);
    assert.equal(clean.ratioNeeds, 50);
    assert.equal(clean.extra, undefined);
});

test('ratios that do not add to 100 are scaled, remainder on save', () => {
    const clean = sanitizePlan({ ratioNeeds: 2, ratioWants: 1, ratioSave: 1 });
    assert.equal(clean.ratioNeeds + clean.ratioWants + clean.ratioSave, 100);
    assert.equal(clean.ratioNeeds, 50);
    assert.equal(clean.ratioWants, 25);
    assert.equal(clean.ratioSave, 25);
});

test('August reserve is weekly times 31 / 7', () => {
    assert.equal(monthReserve(70, new Date(2026, 7, 18)), 310);
    assert.equal(monthReserve(0, new Date(2026, 7, 18)), 0);
    assert.equal(monthReserve(50, new Date(2026, 1, 1)), 200);
});

test('weekBounds is Sunday through Saturday', () => {
    const week = weekBounds(new Date(2026, 7, 18));
    assert.equal(week.start, '2026-08-16');
    assert.equal(week.end, '2026-08-22');
});

test('spend and income bases pick paid or the full register', () => {
    const spend = { paid: 10, pending: 5, total: 15 };
    const income = { paid: 40, pending: 20, total: 60 };
    assert.equal(spendUsed(spend, {}), 15);
    assert.equal(spendUsed(spend, { spendBasis: 'paid' }), 10);
    assert.equal(incomeUsed(income, {}), 40);
    assert.equal(incomeUsed(income, { incomeBasis: 'scheduled' }), 60);
});

test('windowTotals applies the same bases inside a date range', () => {
    const events = {
        '2026-08-16': [{ title: 'Pay', price: 400, kind: 'income', paid: true }],
        '2026-08-18': [{ title: 'Food', price: 80, paid: false }],
        '2026-08-23': [{ title: 'Later', price: 10, paid: true }]
    };
    const logged = windowTotals(events, '2026-08-16', '2026-08-22', {});
    assert.equal(logged.spendUsed, 80);
    assert.equal(logged.incomeUsed, 400);
    assert.equal(logged.net, 320);

    const paid = windowTotals(events, '2026-08-16', '2026-08-22', { spendBasis: 'paid' });
    assert.equal(paid.spendUsed, 0);
    assert.equal(paid.net, 400);
});

test('describePlan names the active rules', () => {
    assert.match(describePlan({}), /deposited income minus all logged bills/);
    assert.match(describePlan({ spendBasis: 'paid', incomeBasis: 'scheduled' }), /scheduled income minus paid bills/);
    assert.match(describePlan({ taxWithholdPct: 15.3 }), /15\.3% withheld/);
});

test('percentOf and leftover stay on whole cents', () => {
    assert.equal(percentOf(2000, 15.3), 306);
    assert.equal(percentOf(2000, 20), 400);
    assert.equal(percentOf(0, 15.3), 0);
    assert.equal(percentOf(1999.99, 10), 200);
});

test('remaining days include today on the viewed month', () => {
    const august = new Date(2026, 7, 1);
    assert.equal(remainingDays(august, new Date(2026, 7, 17)), 15);
    assert.equal(remainingDays(august, new Date(2026, 7, 31)), 1);
    assert.equal(remainingDays(august, new Date(2026, 8, 1)), 0);
    assert.equal(remainingDays(august, new Date(2026, 6, 31)), 31);
});

test('daily safe spend is leftover divided by remaining days', () => {
    assert.equal(dailySafeSpend(600, 15), 40);
    assert.equal(dailySafeSpend(294, 15), 19.6);
    assert.equal(dailySafeSpend(100, 0), 0);
    assert.equal(dailySafeSpend(-150, 15), -10);
});

test('runway is cash divided by daily burn to one decimal', () => {
    assert.equal(runwayDays(3000, 82.35), 36.4);
    assert.equal(runwayDays(1000, 0), null);
});

test('ratio buckets follow the documented needs and wants lists', () => {
    for (const label of RATIO_NEEDS) assert.equal(ratioBucket(label), 'needs', label);
    for (const label of RATIO_WANTS) assert.equal(ratioBucket(label), 'wants', label);
    assert.equal(ratioBucket('Other'), 'other');
    assert.equal(ratioBucket(''), 'other');
});

test('classifyRatioSpend and unpaid recurring read the month register', () => {
    const items = [
        { amount: 900, category: 'Housing', paid: false, recurring: true },
        { amount: 500, category: 'Groceries', paid: true, recurring: false },
        { amount: 40, category: 'Dining', paid: true, recurring: false },
        { amount: 12, category: 'Subscriptions', paid: false, recurring: true }
    ];
    const all = classifyRatioSpend(items, {});
    assert.equal(all.needs, 1400);
    assert.equal(all.wants, 52);
    assert.equal(all.other, 0);

    const paid = classifyRatioSpend(items, { spendBasis: 'paid' });
    assert.equal(paid.needs, 500);
    assert.equal(paid.wants, 40);

    const due = unpaidRecurring(items, {});
    assert.equal(due.total, 912);
    assert.equal(due.count, 2);
    assert.equal(unpaidRecurring(items, { spendBasis: 'paid' }).count, 0);
});

test('week bucket targets sum to spendable income', () => {
    const daily = Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        amount: i === 4 ? 500 : i === 11 ? 900 : 0
    }));
    const weeks = monthWeekBuckets(daily, 31, 2000);
    assert.equal(weeks.length, 5);
    assert.equal(weeks[0].amount, 500);
    assert.equal(weeks[1].amount, 900);
    assert.equal(weeks[0].target, 451.61);
    const targetCents = weeks.reduce((sum, week) => sum + Utils.toCents(week.target), 0);
    assert.equal(targetCents, Utils.toCents(2000));
    const spentCents = weeks.reduce((sum, week) => sum + Utils.toCents(week.amount), 0);
    assert.equal(spentCents, Utils.toCents(1400));
});

test('Sunday–Saturday calendar rows mark weeks that spend past their share', () => {
    const august = new Date(2026, 7, 1);
    assert.equal(august.getDay(), 6, 'August 2026 starts on Saturday');

    const daily = new Array(31).fill(0);
    daily[4] = 500;
    daily[11] = 900;
    const rows = calendarRowWeeks(daily, 31, 6, 2000);
    assert.equal(rows.length, 6);
    assert.equal(rows[0].start, 1);
    assert.equal(rows[0].end, 1);
    assert.equal(rows[1].start, 2);
    assert.equal(rows[1].end, 8);
    assert.equal(rows[1].amount, 500);
    assert.equal(rows[1].target, 451.61);
    assert.equal(rows[1].over, true);
    assert.equal(rows[2].amount, 900);
    assert.equal(rows[2].over, true);
    assert.equal(rows[0].over, false);
    assert.equal(rows[3].over, false);
    const targetCents = rows.reduce((sum, week) => sum + Utils.toCents(week.target), 0);
    assert.equal(targetCents, Utils.toCents(2000));
});

test('over-budget rows follow counted spend and planner spendable', () => {
    const events = {
        '2026-08-05': [{ title: 'Groceries', price: 500, paid: true }],
        '2026-08-12': [{ title: 'Rent', price: 900, paid: false }]
    };
    const date = new Date(2026, 7, 1);
    const daily = monthDaySpend(events, date, {});
    assert.equal(daily[4], 500);
    assert.equal(daily[11], 900);

    const logged = overBudgetRows(events, date, {}, 2000);
    assert.deepEqual(logged.filter((week) => week.over).map((week) => week.row), [1, 2]);

    const paidOnly = overBudgetRows(events, date, { spendBasis: 'paid' }, 2000);
    assert.deepEqual(paidOnly.filter((week) => week.over).map((week) => week.row), [1]);
    assert.equal(paidOnly[2].amount, 0);
    assert.equal(paidOnly[2].over, false);
});

test('the default planner waterfall matches deposited minus logged bills', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 1400,
        daysInMonth: 31,
        daysElapsed: 17,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 17),
        plan: {}
    });
    assert.equal(out.taxWithheld, 0);
    assert.equal(out.savingsHold, 0);
    assert.equal(out.spendableIncome, 2000);
    assert.equal(out.leftToSpend, 600);
    assert.equal(out.daysLeft, 15);
    assert.equal(out.dailySafe, 40);
    assert.equal(out.weeklySafe, 280);
    assert.equal(out.avgDailyBurn, 82.35);
});

test('SE tax 15.3% of $2000 is $306 and comes out of leftover', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 1400,
        daysInMonth: 31,
        daysElapsed: 17,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 17),
        plan: { taxWithholdPct: 15.3 }
    });
    assert.equal(out.taxWithheld, 306);
    assert.equal(out.afterTax, 1694);
    assert.equal(out.leftToSpend, 294);
    assert.equal(out.leftToSpend, out.afterTax - 1400);
});

test('a 20% after-tax savings hold is $400 on $2000 with no tax', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 1400,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 17),
        daysInMonth: 31,
        daysElapsed: 17,
        plan: { savingsPct: 20 }
    });
    assert.equal(out.savingsHold, 400);
    assert.equal(out.leftToSpend, 200);
    assert.equal(out.ratioSaveCap, 400);
});

test('weekly, fixed, and percent holds stack once on after-tax income', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 500,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 17),
        daysInMonth: 31,
        daysElapsed: 17,
        plan: {
            taxWithholdPct: 10,
            weeklySavings: 70,
            reserveSavings: true,
            savingsFixed: 100,
            savingsPct: 10
        }
    });
    assert.equal(out.taxWithheld, 200);
    assert.equal(out.afterTax, 1800);
    assert.equal(out.weeklyReserve, 310);
    assert.equal(out.pctHold, 180);
    assert.equal(out.savingsHold, 590);
    assert.equal(out.spendableIncome, 1210);
    assert.equal(out.leftToSpend, 710);
    assert.equal(
        out.leftToSpend,
        2000 - out.taxWithheld - out.savingsHold - 500
    );
});

test('turning the weekly reserve off leaves fixed and percent holds in place', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 1400,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 17),
        daysInMonth: 31,
        daysElapsed: 17,
        plan: { weeklySavings: 70, reserveSavings: false, savingsFixed: 50 }
    });
    assert.equal(out.weeklyReserve, 310);
    assert.equal(out.reserveOn, false);
    assert.equal(out.savingsHold, 50);
    assert.equal(out.leftToSpend, 550);
});
