/**
 * OCR performance and documentation quality controls.
 *
 * These checks pin the human-readable source tags and the cross-platform OCR
 * contract that keeps receipt reading local, lazy, bounded, and review-first.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');

test('OCR tuning lives in shared config with readable tags', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    for (const token of [
        '@ocr-deps',
        '@platform',
        '@perf',
        "pdfWorker: '/vendor/pdfjs/pdf.worker.min.mjs'",
        "wasm: '/vendor/ort/'",
        "detection: '/vendor/ocr-models/PP-OCRv6_tiny_det.ort'",
        'wasmThreads: 1',
        'decodeMaxSide: 2600',
        'ocrMinSide: 1200',
        'ocrMaxSide: 2600',
        'enhancementMaxPixels: 1_800_000',
        'earlyAcceptScore: 28',
        'enhancedAcceptScore: 22'
    ]) {
        assert.match(config, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS = \{/);
    assert.match(receipt, /OCR_CONFIG\.limits\.maxFileBytes/);
    assert.match(receipt, /OCR_CONFIG\.runtime\.wasmThreads/);
    assert.match(receipt, /OCR_CONFIG\.image\.ocrMaxSide/);
    assert.match(receipt, /OCR_CONFIG\.scoring\.earlyAcceptScore/);
});

test('OCR source tags document dependency, platform, pipeline, PDF, and parsing boundaries', async () => {
    const [receipt, parser, picker, utils, docs] = await Promise.all([
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('src/features/receipt-picker.js'),
        read('src/core/utils.js'),
        read('docs/OCR-PERFORMANCE.md')
    ]);

    for (const token of ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@platform', '@perf']) {
        assert.match(receipt + docs, new RegExp(token));
    }
    assert.match(parser, /@ocr-parse/);
    assert.match(picker, /@platform/);
    assert.match(utils, /@platform/);
    assert.match(docs, /\| `@ocr-parse` \|/);
    assert.match(docs, /These tags are for readers and reviewers/);
});

test('receipt scanning keeps mobile and desktop paths lazy, local, and bounded', async () => {
    const [html, picker, receipt, docs, deps] = await Promise.all([
        read('index.html'),
        read('src/features/receipt-picker.js'),
        read('src/features/receipt.js'),
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/DEPENDENCIES.md')
    ]);

    assert.match(html, /id="receipt-scan-input" accept="image\/\*,\.heic,\.heif,\.webp,\.pdf,application\/pdf"/);
    assert.match(picker, /Utils\.prefersCamera\(\)/);
    assert.match(picker, /input\.setAttribute\('capture', 'environment'\)/);
    assert.match(receipt, /typeof createImageBitmap === 'function'/);
    assert.match(receipt, /imageOrientation: 'from-image'/);
    assert.match(receipt, /new Image\(\)/);
    assert.match(receipt, /await import\('onnxruntime-web'\)/);
    assert.match(receipt, /await import\('ppu-paddle-ocr\/web'\)/);
    assert.match(receipt, /await import\('pdfjs-dist\/build\/pdf\.mjs'\)/);
    assert.match(receipt, /OCR_CONFIG\.limits\.maxPdfPages/);
    assert.match(receipt, /OCR_CONFIG\.limits\.maxExtractedLines/);
    assert.match(docs, /Text-based PDFs are parsed before OCR/);
    assert.match(deps, /application origin|same-origin/);
});
