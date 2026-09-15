/**
 * Quality check: OCR platform limits, same-origin assets, and source tags.
 * Run: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OCR_CONFIG, OCR_TAGS } from '../src/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');

test('OCR config keeps receipt resources local and bounded', () => {
    assert.equal(OCR_CONFIG.pdfWorker, '/vendor/pdfjs/pdf.worker.min.mjs');
    for (const asset of Object.values(OCR_CONFIG.assets)) {
        assert.match(asset, /^\/vendor\//);
        assert.doesNotMatch(asset, /^https?:\/\//i);
    }

    assert.equal(OCR_CONFIG.limits.maxFileBytes, 15 * 1024 * 1024);
    assert.equal(OCR_CONFIG.limits.maxPdfPages, 20);
    assert.ok(OCR_CONFIG.raster.maxPhotoSideMobile < OCR_CONFIG.raster.maxPhotoSideDesktop);
    assert.ok(OCR_CONFIG.raster.enhancePixelsMobile < OCR_CONFIG.raster.enhancePixelsDesktop);
    assert.equal(OCR_CONFIG.runtime.wasmThreads, 1);
    assert.deepEqual(OCR_CONFIG.runtime.executionProviders, ['wasm']);
});

test('OCR code and docs expose the readable tag legend', async () => {
    const [config, receipt, parser, docs, docsIndex, packageJson] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/README.md'),
        read('package.json')
    ]);

    for (const tag of Object.values(OCR_TAGS)) {
        assert.match(config, new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(docs, new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(receipt, /OCR_CONFIG/);
    assert.match(receipt, /scanProfile/);
    assert.match(receipt, /createImageBitmap/);
    assert.match(receipt, /maxPhotoSideMobile/);
    assert.match(receipt, /maxPhotoSideDesktop/);
    assert.match(parser, /Public API: normalizeOcrText, normalizeLines, textQuality, parseReceipt/);
    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(packageJson, /qc-ocr-performance\.mjs/);
});
