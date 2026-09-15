/**
 * OCR performance docs and code tags are a maintenance contract.
 * This test keeps receipt resource budgets, platform gates, and docs aligned.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const REQUIRED_TAGS = [
    '@ocr-deps',
    '@ocr-engine',
    '@ocr-pdf',
    '@ocr-pipeline',
    '@ocr-parse',
    '@platform',
    '@perf'
];

test('OCR_CONFIG centralizes receipt resource budgets and human-readable tags', async () => {
    const config = await read('src/config.js');

    assert.match(config, /export const OCR_CONFIG = \{/);
    for (const tag of REQUIRED_TAGS) {
        assert.match(config, new RegExp(tag.replace('@', '@')));
    }

    assert.match(config, /pdfWorker: '\/vendor\/pdfjs\/pdf\.worker\.min\.mjs'/);
    assert.match(config, /wasm: '\/vendor\/ort\/'/);
    assert.match(config, /maxFileBytes: 15 \* 1024 \* 1024/);
    assert.match(config, /maxPdfPages: 20/);
    assert.match(config, /maxInputSide: 2600/);
    assert.match(config, /maxEnhancementPixels: 1_800_000/);
    assert.match(config, /mobileThreads: 1/);
    assert.match(config, /desktopThreads: 2/);
});

test('receipt scanner consumes OCR_CONFIG instead of shadow constants', async () => {
    const receipt = await read('src/features/receipt.js');

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.match(receipt, /ocrWasmThreadCount/);
    assert.match(receipt, /crossOriginIsolated/);
    assert.match(receipt, /OCR_CONFIG\.runtime\.desktopThreads/);
    assert.match(receipt, /OCR_CONFIG\.limits\.maxPdfPages/);
    assert.match(receipt, /OCR_CONFIG\.image\.maxInputSide/);
    assert.match(receipt, /OCR_CONFIG\.scoring\.acceptScore/);
});

test('OCR docs, parser, and platform helpers carry the documented tags', async () => {
    const [docs, parser, receipt, utils, docsIndex, sourceIndex] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/features/receipt-parse.js'),
        read('src/features/receipt.js'),
        read('src/core/utils.js'),
        read('docs/README.md'),
        read('src/README.md')
    ]);

    for (const tag of REQUIRED_TAGS) {
        assert.match(docs, new RegExp(tag.replace('@', '@')));
    }
    assert.match(parser, /@ocr-parse/);
    assert.match(receipt, /@ocr-engine/);
    assert.match(receipt, /@ocr-pipeline/);
    assert.match(utils, /@platform/);
    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /OCR_CONFIG/);
});

test('package test script runs the OCR performance guard', async () => {
    const pkg = await read('package.json');
    assert.match(pkg, /scripts\/qc-ocr-performance\.mjs/);
});
