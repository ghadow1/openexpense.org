/**
 * The render pipeline repaints selectively. A surface missing a key it reads
 * does not error, it just quietly stops updating, so these assert the wiring
 * rather than any drawing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RENDER_DEPS, shouldRender } from '../src/app/render.js';

test('a saved budget repaints the sidebar', () => {
    // This is the regression: budgets were stored but the sidebar kept saying
    // "no caps set yet" because it never repainted on a budgets-only patch.
    assert.equal(shouldRender('sidebar', ['budgets']), true);
});

test('a saved plan repaints the dash, sidebar, and calendar weeks', () => {
    assert.equal(shouldRender('dash', ['plan']), true);
    assert.equal(shouldRender('sidebar', ['plan']), true);
    assert.equal(shouldRender('calendar', ['plan']), true);
});

test('a goal change repaints the planner and overview milestone chart', () => {
    assert.equal(shouldRender('dash', ['goals']), true);
});

test('the tracker filter repaints the calendar, sidebar, and dash', () => {
    assert.equal(shouldRender('calendar', ['trackerFilter']), true);
    assert.equal(shouldRender('sidebar', ['trackerFilter']), true);
    assert.equal(shouldRender('dash', ['trackerFilter']), true);
});

test('every surface redraws on a full render', () => {
    for (const surface of Object.keys(RENDER_DEPS)) {
        assert.equal(shouldRender(surface, null), true, `${surface} ignored a full render`);
        assert.equal(shouldRender(surface, []), true, `${surface} ignored an empty patch`);
    }
});

test('an unrelated key repaints nothing', () => {
    for (const surface of Object.keys(RENDER_DEPS)) {
        assert.equal(shouldRender(surface, ['somethingElse']), false, `${surface} repainted needlessly`);
    }
});

test('ledger content reaches every surface that shows it', () => {
    for (const surface of ['calendar', 'dash', 'sidebar', 'fileStatus']) {
        assert.equal(shouldRender(surface, ['events']), true, `${surface} missed an events change`);
    }
});

test('a theme swap reaches everything that paints colour', () => {
    for (const surface of ['theme', 'headerToggles', 'calendar', 'dash', 'sidebar']) {
        assert.equal(shouldRender(surface, ['isDark']), true, `${surface} missed a theme change`);
    }
});

test('changing month repaints the calendar, dash, and sidebar', () => {
    assert.equal(shouldRender('calendar', ['currentDate']), true);
    assert.equal(shouldRender('dash', ['currentDate']), true);
    assert.equal(shouldRender('sidebar', ['currentDate']), true);
    assert.equal(shouldRender('privacyStatus', ['currentDate']), false);
});

test('every declared dependency is a real, non-empty list', () => {
    for (const [surface, keys] of Object.entries(RENDER_DEPS)) {
        assert.ok(Array.isArray(keys) && keys.length, `${surface} declares no dependencies`);
        assert.equal(new Set(keys).size, keys.length, `${surface} repeats a dependency`);
    }
});

test('every dependency names a key the store actually holds', async () => {
    // A typo here would silently stop a surface from ever updating.
    const { getState } = await import('../src/core/store.js');
    const stateKeys = new Set(Object.keys(getState()));

    for (const [surface, keys] of Object.entries(RENDER_DEPS)) {
        for (const key of keys) {
            assert.ok(stateKeys.has(key), `${surface} depends on "${key}", which is not in the store`);
        }
    }
});
