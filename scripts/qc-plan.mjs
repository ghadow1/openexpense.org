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
    horizonIncomeItems,
    takeIncomeThrough,
    fixedHoldForTarget,
    growthPotentialPct,
    incomeUsed,
    monthDayIncome,
    monthDaySpend,
    monthReserve,
    monthWeekBuckets,
    trackCalendarWeeks,
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
    assert.equal(planIsDefault({ currentSavings: 10000 }), false);
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
        currentSavings: 10000.129,
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
    assert.equal(clean.currentSavings, 10000.13);
    assert.equal(clean.ratioNeeds, 50);
    assert.equal(clean.goalIncome, 'horizon');
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
    assert.match(describePlan({}), /goals count upcoming pay/);
    assert.match(describePlan({ spendBasis: 'paid', incomeBasis: 'scheduled' }), /scheduled income minus paid bills/);
    assert.match(describePlan({ taxWithholdPct: 15.3 }), /15\.3% withheld/);
    assert.match(describePlan({ goalIncome: 'surplus' }), /goals use leftover only/);
    assert.equal(planIsDefault({ goalIncome: 'surplus' }), false);
});

test('percentOf and leftover stay on whole cents', () => {
    assert.equal(percentOf(2000, 15.3), 306);
    assert.equal(percentOf(2000, 20), 400);
    assert.equal(percentOf(0, 15.3), 0);
    assert.equal(percentOf(1999.99, 10), 200);
    assert.equal(percentOf(0.35, 90), 0.32, 'percentage multiplication rounds from integer cents');
});

test('remaining days include today on the viewed month', () => {
    const august = new Date(2026, 7, 1);
    assert.equal(remainingDays(august, new Date(2026, 7, 17)), 15);
    assert.equal(remainingDays(august, new Date(2026, 7, 31)), 1);
    assert.equal(remainingDays(august, new Date(2026, 8, 1)), 0);
    assert.equal(remainingDays(august, new Date(2026, 6, 31)), 31);
});

test('growth potential is leftover over current bank, and empty bank is omitted', () => {
    assert.equal(growthPotentialPct(888, 10000), 8.9);
    assert.equal(growthPotentialPct(600, 10000), 6);
    assert.equal(growthPotentialPct(-300, 5000), -6);
    assert.equal(growthPotentialPct(100, 0), null);
    assert.equal(growthPotentialPct(100, -20), null);
});

test('daily safe spend is leftover divided by remaining days', () => {
    assert.equal(dailySafeSpend(600, 15), 40);
    assert.equal(dailySafeSpend(294, 15), 19.6);
    assert.equal(dailySafeSpend(100, 0), 0);
    assert.equal(dailySafeSpend(-150, 15), -10);
    assert.equal(dailySafeSpend(-0.01, 2), -0.01, 'negative half cents round away from zero');
});

test('runway is cash divided by daily burn to one decimal', () => {
    assert.equal(runwayDays(3000, 82.35), 36.4);
    assert.equal(runwayDays(1000, 0), null);
    assert.equal(runwayDays(-100, 10), 0);
});

test('fixed goal hold subtracts active weekly and percentage holds', () => {
    assert.equal(fixedHoldForTarget(500, 200, 100), 200);
    assert.equal(fixedHoldForTarget(250, 200, 100), 0);
    assert.equal(fixedHoldForTarget(500.01, 200, 100), 200.01);
});

test('future scheduled spend does not become an observed burn rate', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 900,
        spendItems: [{ amount: 900, date: '2026-09-12', paid: false }],
        daysInMonth: 30,
        daysElapsed: 30,
        currentDate: new Date(2026, 8, 1),
        asOf: new Date(2026, 7, 19)
    });
    assert.equal(out.burnSpend, 0);
    assert.equal(out.burnDays, 0);
    assert.equal(out.avgDailyBurn, 0);
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

test('week bucket targets share the calendar Sunday–Saturday boundaries', () => {
    const daily = Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        amount: i === 4 ? 500 : i === 11 ? 900 : 0
    }));
    const weeks = monthWeekBuckets(daily, 31, 2000, 6);
    assert.equal(weeks.length, 6);
    assert.deepEqual(
        weeks.map(({ start, end }) => ({ start, end })),
        [
            { start: 1, end: 1 },
            { start: 2, end: 8 },
            { start: 9, end: 15 },
            { start: 16, end: 22 },
            { start: 23, end: 29 },
            { start: 30, end: 31 }
        ]
    );
    assert.equal(weeks[1].amount, 500);
    assert.equal(weeks[2].amount, 900);
    assert.equal(weeks[1].target, 451.61);
    const targetCents = weeks.reduce((sum, week) => sum + Utils.toCents(week.target), 0);
    assert.equal(targetCents, Utils.toCents(2000));
    const spentCents = weeks.reduce((sum, week) => sum + Utils.toCents(week.amount), 0);
    assert.equal(spentCents, Utils.toCents(1400));
});

test('negative spendable income produces zero weekly targets', () => {
    const buckets = monthWeekBuckets([], 31, -100);
    assert.ok(buckets.every((week) => week.target === 0));

    const calendarRows = calendarRowWeeks(new Array(31).fill(0), 31, 6, -100);
    assert.ok(calendarRows.every((week) => week.target === 0));
    assert.equal(
        calendarRows.reduce((sum, week) => sum + Utils.toCents(week.target), 0),
        0
    );
});

test('planner week bars respect paid-only spend basis', () => {
    const out = computePlanner({
        incomeUsed: 1000,
        spendUsed: 100,
        spendItems: [
            { amount: 100, date: '2026-08-05', paid: true, category: 'Groceries' },
            { amount: 900, date: '2026-08-06', paid: false, category: 'Housing' }
        ],
        dailyTotals: [],
        daysInMonth: 31,
        daysElapsed: 19,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 19),
        plan: { spendBasis: 'paid' }
    });
    assert.equal(out.weekBuckets.reduce((sum, week) => sum + week.amount, 0), 100);
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

test('a week with gross income over its goal is marked ahead', () => {
    const dailySpend = new Array(31).fill(0);
    const dailyIncome = new Array(31).fill(0);
    dailyIncome[6] = 961;
    const rows = calendarRowWeeks(dailySpend, 31, 6, 2000, {
        dailyIncome,
        monthIncome: 1922
    });
    // Aug 1 is Saturday (row 0). Aug 7 paycheck sits in row 1 (Aug 2–8).
    assert.equal(rows[1].income, 961);
    assert.equal(rows[1].incomeGoal, 434);
    assert.equal(rows[1].overIncome, true);
    assert.equal(rows[0].overIncome, false);
    const goalCents = rows.reduce((sum, week) => sum + Utils.toCents(week.incomeGoal), 0);
    assert.equal(goalCents, Utils.toCents(1922));
});

test('an explicit weekly income goal beats the month’s own pace', () => {
    const dailySpend = new Array(31).fill(0);
    const dailyIncome = new Array(31).fill(0);
    dailyIncome[6] = 400;
    const rows = calendarRowWeeks(dailySpend, 31, 6, 0, {
        dailyIncome,
        weeklyIncome: 350
    });
    // Month pool is 350 × 31 / 7; a 7-day row is 350.
    assert.equal(rows[1].incomeGoal, 350);
    assert.equal(rows[1].overIncome, true);
});

test('a week counts how many days blow the daily safe amount', () => {
    // August 2026 starts Saturday, so row 1 is Sun 2 through Sat 8.
    const daily = new Array(31).fill(0);
    daily[1] = 50;
    daily[2] = 50;
    daily[3] = 10;
    const two = calendarRowWeeks(daily, 31, 6, 2000, { dailySafe: 40 });
    assert.equal(two[1].overDailyCount, 2);

    daily[4] = 41;
    const three = calendarRowWeeks(daily, 31, 6, 2000, { dailySafe: 40 });
    assert.equal(three[1].overDailyCount, 3);
    assert.equal(three[0].overDailyCount, 0);

    const empty = new Array(31).fill(0);
    const underwater = calendarRowWeeks(empty, 31, 6, 2000, { dailySafe: -40 });
    assert.equal(underwater[1].overDailyCount, 0);
    empty[1] = 1;
    const spent = calendarRowWeeks(empty, 31, 6, 2000, { dailySafe: -40 });
    assert.equal(spent[1].overDailyCount, 1);
});

test('trackCalendarWeeks reads gross paychecks and counted bills together', () => {
    const events = {
        '2026-08-05': [{ title: 'Groceries', price: 500, paid: true }],
        '2026-08-07': [{ title: 'Paycheck', price: 961, kind: 'income', paid: true }]
    };
    const date = new Date(2026, 7, 1);
    assert.equal(monthDayIncome(events, date)[6], 961);
    const weeks = trackCalendarWeeks(events, date, {}, 2000);
    assert.equal(weeks[1].overSpend, true);
    assert.equal(weeks[1].overIncome, true);
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

    const logged = trackCalendarWeeks(events, date, {}, 2000);
    assert.deepEqual(logged.filter((week) => week.over).map((week) => week.row), [1, 2]);

    const paidOnly = trackCalendarWeeks(events, date, { spendBasis: 'paid' }, 2000);
    assert.deepEqual(paidOnly.filter((week) => week.over).map((week) => week.row), [1]);
    assert.equal(paidOnly[2].amount, 0);
    assert.equal(paidOnly[2].over, false);
});

test('current savings does not enter the leftover waterfall', () => {
    const out = computePlanner({
        incomeUsed: 2000,
        spendUsed: 1400,
        daysInMonth: 31,
        daysElapsed: 17,
        currentDate: new Date(2026, 7, 1),
        asOf: new Date(2026, 7, 17),
        plan: { currentSavings: 10000 }
    });
    assert.equal(out.leftToSpend, 600);
    assert.equal(out.savingsHold, 0);
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

test('horizon income counts unpaid checks leftover has not already included', () => {
    const events = {
        '2026-08-10': [{ title: 'Landed', kind: 'income', price: 200, paid: true }],
        '2026-08-25': [{ title: 'Check A', kind: 'income', price: 400, paid: false }],
        '2026-08-28': [{ title: 'Check B', kind: 'income', price: 561, paid: false }],
        '2026-08-26': [{ title: 'Coffee', price: 6 }]
    };
    const asOf = new Date(2026, 7, 20);
    const month = new Date(2026, 7, 1);
    const items = horizonIncomeItems(events, asOf, month, { incomeBasis: 'deposited' });
    assert.equal(items.reduce((sum, item) => sum + item.cents, 0), 96100);
    const scheduled = horizonIncomeItems(events, asOf, month, { incomeBasis: 'scheduled' });
    assert.equal(scheduled.length, 0);
    const leftoverOnly = horizonIncomeItems(events, asOf, month, { goalIncome: 'surplus' });
    assert.equal(leftoverOnly.length, 0);
    const taken = takeIncomeThrough(items.map((item) => ({ ...item })), '2026-08-31', 25000);
    assert.equal(taken, 25000);
});
