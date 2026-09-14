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

test('OCR performance notes keep source tags discoverable', async () => {
    const [map, docs, config, receipt, parser] = await Promise.all([
        readFile(join(ROOT, 'docs/CODEMAP.md'), 'utf8'),
        readFile(join(ROOT, 'docs/OCR-PERFORMANCE.md'), 'utf8'),
        readFile(join(ROOT, 'src/config.js'), 'utf8'),
        readFile(join(ROOT, 'src/features/receipt.js'), 'utf8'),
        readFile(join(ROOT, 'src/features/receipt-parse.js'), 'utf8')
    ]);

    for (const tag of ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@ocr-ui', '@platform', '@perf']) {
        assert.match(map, new RegExp(tag));
        assert.match(docs, new RegExp(tag));
        assert.match(config, new RegExp(tag));
    }
    assert.match(receipt, /Tags: @ocr-ui @ocr-engine @ocr-pdf @ocr-pipeline @platform @perf/);
    assert.match(parser, /Tags: @ocr-parse @perf/);
});
