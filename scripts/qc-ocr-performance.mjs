/**
 * OCR source tags and runtime budgets are documentation-backed contracts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OCR_CONFIG } from '../src/config.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('OCR performance docs list every human-readable source tag', async () => {
    const docs = await read('docs/OCR-PERFORMANCE.md');
    for (const tag of [
        '@ocr-deps',
        '@ocr-engine',
        '@ocr-pdf',
        '@ocr-pipeline',
        '@ocr-parse',
        '@platform',
        '@perf'
    ]) {
        assert.match(docs, new RegExp(tag.replace('@', '@')));
    }
});

test('OCR runtime budgets stay centralized in config', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG/);
    assert.match(config, /@ocr-deps/);
    assert.equal(OCR_CONFIG.limits.maxFileBytes, 15 * 1024 * 1024);
    assert.equal(OCR_CONFIG.limits.maxPdfPages, 20);
    assert.equal(OCR_CONFIG.image.minOcrSide, 1200);
    assert.equal(OCR_CONFIG.image.maxOcrSide, 2600);
    assert.equal(OCR_CONFIG.image.enhancementMaxPixels, 1_800_000);
    assert.equal(OCR_CONFIG.wasmThreads, 1);

    assert.match(receipt, /const RECEIPT_LIMITS = OCR_CONFIG\.limits/);
    assert.match(receipt, /const RECEIPT_IMAGE = OCR_CONFIG\.image/);
    assert.match(receipt, /const RECEIPT_SCORING = OCR_CONFIG\.scoring/);
    assert.doesNotMatch(receipt, /maxFileBytes:\s*15\s*\*\s*1024\s*\*\s*1024/);
    assert.doesNotMatch(receipt, /const maxSide = 2600/);
    assert.doesNotMatch(receipt, /const maxPx = 1_800_000/);
});

test('OCR code keeps mobile and desktop capability tags near behavior', async () => {
    const [receipt, picker, utils, parser, docsIndex, sourceIndex, readme] = await Promise.all([
        read('src/features/receipt.js'),
        read('src/features/receipt-picker.js'),
        read('src/core/utils.js'),
        read('src/features/receipt-parse.js'),
        read('docs/README.md'),
        read('src/README.md'),
        read('README.md')
    ]);

    assert.match(receipt, /@ocr-engine/);
    assert.match(receipt, /@ocr-pdf/);
    assert.match(receipt, /@ocr-pipeline/);
    assert.match(receipt, /createImageBitmap/);
    assert.match(receipt, /OCR_CONFIG\.wasmThreads/);
    assert.match(picker, /@platform/);
    assert.match(picker, /capture', 'environment'/);
    assert.match(utils, /@platform/);
    assert.match(parser, /@ocr-parse/);
    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /OCR_CONFIG/);
    assert.match(readme, /OCR-PERFORMANCE\.md/);
});
