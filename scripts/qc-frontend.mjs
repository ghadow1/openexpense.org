import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('static buttons declare their non-submit behavior', async () => {
    const html = await read('index.html');
    const buttons = html.match(/<button\b[^>]*>/g) || [];
    const missingType = buttons.filter((button) => !/\btype="button"/.test(button));
    assert.deepEqual(missingType, []);
});

test('documentation chapters implement one coherent tab pattern', async () => {
    const html = await read('index.html');
    for (const name of ['manual', 'guide', 'schema', 'updates']) {
        const tab = html.match(new RegExp(`<button[^>]*id="dt-${name}"[^>]*>`, 's'))?.[0] || '';
        const pane = html.match(new RegExp(`<section[^>]*id="pane-${name}"[^>]*>`, 's'))?.[0] || '';
        assert.match(tab, /\brole="tab"/);
        assert.match(tab, new RegExp(`\\baria-controls="pane-${name}"`));
        assert.match(pane, /\brole="tabpanel"/);
        assert.match(pane, new RegExp(`\\baria-labelledby="dt-${name}"`));
    }

    const views = await read('src/app/views.js');
    assert.match(views, /candidate\.setAttribute\('aria-selected'/);
    assert.match(views, /candidate\.hidden = !on/);
    assert.match(views, /event\.key === 'ArrowRight'/);
    assert.match(views, /event\.key === 'Home'/);
});

test('modal surfaces have focus containment and accessible names', async () => {
    const [html, focus, search, receipt, confirm] = await Promise.all([
        read('index.html'),
        read('src/ui/dialog-focus.js'),
        read('src/features/search-panel.js'),
        read('src/features/receipt.js'),
        read('src/ui/confirm.js')
    ]);

    assert.match(html, /id="welcome-modal"[\s\S]*?role="dialog" aria-modal="true"/);
    assert.match(html, /id="mbox"[^>]*role="dialog" aria-modal="true"/);
    assert.match(focus, /event\.key !== 'Tab'/);
    assert.match(focus, /returnFocus\.focus/);
    for (const source of [search, receipt, confirm]) {
        assert.match(source, /activateDialogFocus/);
        assert.match(source, /deactivateDialogFocus/);
    }
});

test('visual state and accessibility state stay synchronized', async () => {
    const [html, views, dashboard, sidebar] = await Promise.all([
        read('index.html'),
        read('src/app/views.js'),
        read('src/features/dash-strip.js'),
        read('src/features/sidebar.js')
    ]);

    assert.doesNotMatch(html, /role="tablist" aria-label="Transaction filter"/);
    assert.match(html, /role="group" aria-label="Transaction filter"/);
    assert.match(dashboard, /setAttribute\('aria-pressed'/);
    assert.match(views, /appView\.hidden = privacy/);
    assert.match(views, /docsView\.hidden = !privacy/);
    assert.match(views, /skipLink\.href = privacy/);
    assert.match(sidebar, /expenseFace\.inert = !expenseActive/);
    assert.match(sidebar, /incomeFace\.setAttribute\('aria-hidden'/);
});

test('generated controls expose names and compatible roles', async () => {
    const [calendar, charts, toasts, focus, goals] = await Promise.all([
        read('src/features/calendar.js'),
        read('src/ui/dial-chart.js'),
        read('src/ui/toast.js'),
        read('src/ui/dialog-focus.js'),
        read('src/features/goals.js')
    ]);

    assert.match(calendar, /UI\.createButton\('Previous month'/);
    assert.match(calendar, /UI\.createButton\('Next month'/);
    assert.match(calendar, /monthTitle\.setAttribute\('aria-live', 'polite'\)/);
    assert.match(charts, /typeof onSelect === 'function' \? 'group' : 'img'/);
    assert.match(charts, /aria-current', 'date'/);
    assert.match(charts, /event\.key === 'ArrowRight'/);
    assert.match(charts, /class: 'oe-spark-area'/);
    assert.match(charts, /row\.target/);
    assert.match(toasts, /type === 'error' \? 'alert' : 'status'/);
    assert.match(toasts, /aria-hidden="true"/);
    assert.match(focus, /element\.inert = true/);
    assert.match(focus, /restoreIsolation/);
    assert.match(goals, /className = 'planner-goal-add'/);
    assert.match(goals, /aria-label', 'Add savings goal'/);
    assert.match(goals, /aria-modal', 'true'/);
    assert.match(goals, /activateDialogFocus/);
    assert.match(goals, /goal-drag-handle/);
});
