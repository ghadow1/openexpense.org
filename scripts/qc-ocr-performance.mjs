import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');

test('OCR config centralizes same-origin assets and performance budgets', async () => {
    const [config, receipt, parser] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    for (const value of [
        'pdfWorker',
        'PP-OCRv6_tiny_det.ort',
        'PP-OCRv6_tiny_rec.ort',
        'ppocrv6_tiny_dict.txt',
        'maxFileBytes',
        'imageMaxSide',
        'enhanceMaxPixels',
        'pdfPreviewMaxSide',
        'wasmThreads',
        'lowConfidenceThreshold'
    ]) {
        assert.match(config, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS = \{/);
    assert.match(receipt, /OCR_LIMITS\.maxFileBytes/);
    assert.match(receipt, /OCR_LIMITS\.imageMaxSide/);
    assert.match(receipt, /OCR_SCORING\.firstPassMinScore/);
    assert.match(parser, /OCR_CONFIG\.scoring\.lowConfidenceThreshold/);
});

test('OCR platform choices are explicit and conservative', async () => {
    const [receipt, utils] = await Promise.all([
        read('src/features/receipt.js'),
        read('src/core/utils.js')
    ]);

    assert.match(utils, /devicePerformanceTier/);
    assert.match(utils, /supportsThreadedWasm/);
    assert.match(utils, /crossOriginIsolated === true/);
    assert.match(utils, /preferredWorkerCount/);
    assert.match(receipt, /Utils\.supportsThreadedWasm\(\)/);
    assert.match(receipt, /Utils\.preferredWorkerCount\(OCR_RUNTIME\.wasmThreads\)/);
    assert.match(receipt, /ort\.env\.wasm\.numThreads = runtime\.numThreads/);
});

test('human-readable OCR tags are documented and present near source owners', async () => {
    const [doc, config, receipt, parser, picker, utils, srcIndex] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('src/features/receipt-picker.js'),
        read('src/core/utils.js'),
        read('src/README.md')
    ]);

    for (const tag of [
        '@ocr-deps',
        '@ocr-engine',
        '@ocr-pdf',
        '@ocr-pipeline',
        '@ocr-parse',
        '@platform',
        '@perf'
    ]) {
        assert.match(doc, new RegExp(tag));
    }

    assert.match(config, /@ocr-deps/);
    assert.match(receipt, /@ocr-engine/);
    assert.match(receipt, /@ocr-pdf/);
    assert.match(parser, /@ocr-parse/);
    assert.match(picker, /@ocr-pipeline/);
    assert.match(utils, /@platform/);
    assert.match(srcIndex, /OCR-PERFORMANCE\.md/);
});
