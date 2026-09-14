/**
 * OCR performance/documentation quality controls.
 *
 * The receipt pipeline is deliberately local, lazy, and bounded. These checks
 * keep its search tags, config, and docs connected as contributors tune it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const TAGS = ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@platform', '@perf'];

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('OCR tuning is centralized and consumed by the receipt feature', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    for (const key of [
        'maxFileBytes',
        'maxPdfPages',
        'maxExtractedLines',
        'maxExtractedChars',
        'minSide',
        'maxSide',
        'previewMaxSide',
        'pdfPreviewMaxScale',
        'enhancementMaxPixels',
        'wasmThreads',
        'executionProviders',
        'firstPassScore',
        'enhancedScore'
    ]) {
        assert.match(config, new RegExp(`\\b${key}\\b`), `OCR_CONFIG should document ${key}`);
    }

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js';/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS =/);
    assert.doesNotMatch(receipt, /PDF_WORKER:/);
    assert.doesNotMatch(receipt, /OCR_ASSETS:/);
    assert.match(receipt, /OCR_CONFIG\.assets\.pdfWorker/);
    assert.match(receipt, /OCR_CONFIG\.runtime\.wasmThreads/);
    assert.match(receipt, /OCR_CONFIG\.canvas\.enhancementMaxPixels/);
    assert.match(receipt, /OCR_CONFIG\.quality\.firstPassScore/);
});

test('human-readable OCR and platform tags are documented and present in source', async () => {
    const [docs, config, receipt, parser, picker, utils] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('src/features/receipt-picker.js'),
        read('src/core/utils.js')
    ]);
    const source = [config, receipt, parser, picker, utils].join('\n');

    for (const tag of TAGS) {
        const pattern = new RegExp(escapeRegex(tag));
        assert.match(docs, pattern, `${tag} should be explained in docs/OCR-PERFORMANCE.md`);
        assert.match(source, pattern, `${tag} should exist in the tagged source files`);
    }
});

test('OCR docs are reachable from contributor maps', async () => {
    const [readme, docsReadme, architecture, sourceReadme, dependencies] = await Promise.all([
        read('README.md'),
        read('docs/README.md'),
        read('docs/ARCHITECTURE.md'),
        read('src/README.md'),
        read('docs/DEPENDENCIES.md')
    ]);

    for (const source of [readme, docsReadme, architecture, dependencies]) {
        assert.match(source, /OCR-PERFORMANCE\.md/);
    }
    assert.match(sourceReadme, /OCR_CONFIG/);
    assert.match(sourceReadme, /@ocr-\*/);
});

test('cross-platform OCR performance decisions stay visible', async () => {
    const [config, receipt, picker, utils, docs] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-picker.js'),
        read('src/core/utils.js'),
        read('docs/OCR-PERFORMANCE.md')
    ]);

    assert.match(config, /wasmThreads:\s*1/);
    assert.match(config, /executionProviders:\s*\['wasm'\]/);
    assert.match(config, /\/vendor\/ocr-models\/PP-OCRv6_tiny_det\.ort/);
    assert.match(config, /maxFileBytes:\s*15 \* 1024 \* 1024/);
    assert.match(receipt, /createImageBitmap\(file, \{ imageOrientation: 'from-image' \}\)/);
    assert.match(receipt, /Text-based PDFs bypass image OCR/);
    assert.match(picker, /Utils\.prefersCamera\(\)/);
    assert.match(utils, /isIOS/);
    assert.match(utils, /isAndroid/);
    assert.match(utils, /canUseSavePicker/);
    assert.match(utils, /canShareFiles/);
    assert.match(docs, /Single-threaded WASM/);
    assert.match(docs, /OCR output is advisory/);
});
