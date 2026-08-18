// Guards the built output that actually ships from the repo root.
//
// index.html loads app.js, which loads hashed chunks, which load further
// chunks. Nothing in the build fails if a stale chunk lingers, so this walks
// the real import graph and fails when a file on disk is unreachable.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHUNK = /^chunk-[A-Z0-9]+\.js$/;
const ENTRIES = ['app.js', 'engine.js'];

/** Follow chunk imports out from the entry points. */
async function reachable() {
    const seen = new Set(ENTRIES);
    const queue = [...ENTRIES];
    while (queue.length) {
        const source = await readFile(join(ROOT, queue.pop()), 'utf8');
        for (const [, name] of source.matchAll(/["'`.\/]*(chunk-[A-Z0-9]+\.js)/g)) {
            if (!seen.has(name)) {
                seen.add(name);
                queue.push(name);
            }
        }
    }
    return seen;
}

test('every chunk on disk is reachable from an entry point', async () => {
    const live = await reachable();
    const onDisk = (await readdir(ROOT)).filter((name) => CHUNK.test(name));

    const orphans = onDisk.filter((name) => !live.has(name));
    assert.deepEqual(orphans, [], `stale build output; run npm run build to clear it`);
});

test('every chunk the bundle imports exists on disk', async () => {
    const live = await reachable();
    const onDisk = new Set((await readdir(ROOT)).filter((name) => CHUNK.test(name)));

    const missing = [...live].filter((name) => CHUNK.test(name) && !onDisk.has(name));
    assert.deepEqual(missing, [], 'the bundle imports a chunk that was never written');
});

test('the entry points the page loads are present', async () => {
    const onDisk = new Set(await readdir(ROOT));
    for (const entry of ENTRIES) assert.ok(onDisk.has(entry), `${entry} is missing`);

    const html = await readFile(join(ROOT, 'index.html'), 'utf8');
    assert.match(html, /src="app\.js"/, 'index.html should load app.js');
});

test('overview splits so a phone can lift the calendar', async () => {
    const html = await readFile(join(ROOT, 'index.html'), 'utf8');
    assert.match(html, /id="overview-hero-root"/, 'Left to spend needs its own root');
    assert.match(html, /id="overview-more-root"/, 'Deposited / spending need a second root');
    const css = await readFile(join(ROOT, 'openexpense.css'), 'utf8');
    assert.match(
        css,
        /html\[data-frame="phone"\]\[data-shell="overview"\] \.ledger-stage/,
        'phone Overview must be able to reorder the calendar'
    );
    assert.match(css, /html\[data-frame="desktop"\] #view-app/, 'desktop must snap to the two-column board');
    assert.match(css, /html\[data-frame="tablet"\]/, 'tablet must have its own frame');
});

test('planner is isolated from the shared tracker stage', async () => {
    const css = await readFile(join(ROOT, 'openexpense.css'), 'utf8');
    assert.match(
        css,
        /html\[data-shell="planner"\] \.ledger-stage\s*\{[^}]*display:\s*none !important/s,
        'Planner must not render the tracker toolbar, calendar, and sidebar'
    );

    const source = await readFile(join(ROOT, 'src/features/dash-strip.js'), 'utf8');
    assert.match(source, /data-plan-preset/, 'Planner should expose strategy presets');
    assert.match(source, /data-plan-save/, 'Planner should expose an explicit save action');
});
