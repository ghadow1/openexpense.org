/**
 * Phone, tablet, and desktop are snapped frames. A gap or overlap here
 * is how an iPad inherits a squeezed desktop or a stretched phone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRAMES, FRAME_QUERIES, readFrame } from '../src/ui/frame.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the three frames are named and queried', () => {
    assert.deepEqual(FRAMES, ['phone', 'tablet', 'desktop']);
    assert.equal(FRAME_QUERIES.phone, '(max-width: 720px)');
    assert.equal(FRAME_QUERIES.tablet, '(min-width: 721px) and (max-width: 1099px)');
    assert.equal(FRAME_QUERIES.desktop, '(min-width: 1100px)');
});

test('node has no viewport so the frame falls back to desktop', () => {
    assert.equal(readFrame(), 'desktop');
});

test('the page stamps a frame before paint', async () => {
    const html = await readFile(join(ROOT, 'index.html'), 'utf8');
    assert.match(html, /dataset\.frame/, 'index.html should set data-frame before CSS layout');
    assert.match(html, /w <= 720 \? 'phone'/, 'phone snap is 720px');
    assert.match(html, /w <= 1099 \? 'tablet'/, 'tablet snap is 1099px');
});

test('overview still splits so a phone can lift the snapshot cards', async () => {
    const html = await readFile(join(ROOT, 'index.html'), 'utf8');
    assert.match(html, /id="overview-hero-root"/);
    assert.match(html, /id="overview-more-root"/);
    assert.match(html, /id="tracker-head-root"/);
});

test('only desktop overview paints the compact strip beside the calendar', async () => {
    const src = await readFile(join(ROOT, 'src/features/dash-strip.js'), 'utf8');
    assert.match(src, /function savingsRateChip/, 'compact extras need the income-left chip');
    assert.match(src, /function overviewCompact/, 'desktop paints the morning strip');
    assert.match(src, /readFrame\(\) === 'desktop'/, 'phone and tablet keep the snapshot cards');
    assert.match(src, /function renderTrackerHead/, 'Tracker gets its own mobile page head');
});
