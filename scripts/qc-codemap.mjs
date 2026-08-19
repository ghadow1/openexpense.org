/**
 * The editor contract must stay next to the frozen DOM hooks.
 * A missing CODEMAP is how the next pass re-invents class names.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('CODEMAP documents the frozen shell and class prefixes', async () => {
    const map = await readFile(join(ROOT, 'docs/CODEMAP.md'), 'utf8');
    assert.match(map, /#view-app/);
    assert.match(map, /#cal-col/);
    assert.match(map, /#sidebar/);
    assert.match(map, /data-shell/);
    assert.match(map, /data-frame/);
    assert.match(map, /data-tracker-filter/);
    assert.match(map, /data-plan-pane/);
    assert.match(map, /renderDashStrip/);

    const planner = await readFile(join(ROOT, 'src/features/dash-strip.js'), 'utf8');
    assert.match(planner, /data-plan-pane/);
    assert.match(planner, /Quality settings/);
    assert.match(planner, /Banking info/);
    assert.match(map, /THEMES\.dark/);

    const css = await readFile(join(ROOT, 'openexpense.css'), 'utf8');
    assert.match(css, /Class prefixes \(frozen/);
    assert.match(css, /docs\/CODEMAP\.md/);

    const store = await readFile(join(ROOT, 'src/core/store.js'), 'utf8');
    assert.match(store, /@typedef \{object\} AppState/);
});
