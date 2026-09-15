/**
 * OCR performance docs must stay connected to the code tags and config values.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const TAGS = [
    '@ocr-deps',
    '@ocr-engine',
    '@ocr-pdf',
    '@ocr-pipeline',
    '@ocr-parse',
    '@platform',
    '@perf'
];

test('OCR_CONFIG keeps receipt OCR assets, budgets, and tags readable', async () => {
    const config = await read('src/config.js');
    assert.match(config, /export const OCR_CONFIG = \{/);
    assert.match(config, /pdfWorker: '\/vendor\/pdfjs\/pdf\.worker\.min\.mjs'/);
    assert.match(config, /platformProfiles: \{/);
    assert.match(config, /mobile: \{/);
    assert.match(config, /desktop: \{/);
    assert.match(config, /maxWasmThreads/);
    assert.match(config, /lowConfidenceBelow/);
    assert.match(config, /previewJpegQuality/);
    assert.match(config, /grayscaleRangeFloor/);
    for (const tag of TAGS) {
        assert.match(config, new RegExp(`'${tag}':`));
    }
});

test('receipt OCR uses centralized config and capability checks', async () => {
    const [receipt, parser] = await Promise.all([
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js')
    ]);

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.match(receipt, /Receipt\.wasmThreadCount\(\)/);
    assert.match(receipt, /crossOriginIsolated/);
    assert.match(receipt, /navigator\.hardwareConcurrency/);
    assert.match(receipt, /navigator\.deviceMemory/);
    assert.match(receipt, /createImageBitmap/);
    assert.match(receipt, /extractedChars/);
    assert.match(receipt, /OCR_CONFIG\.scoring/);
    assert.match(receipt, /OCR_CONFIG\.limits\.previewJpegQuality/);
    assert.match(receipt, /OCR_CONFIG\.scoring\.contrastBoost/);
    assert.match(parser, /OCR_CONFIG\.confidence\.lowConfidenceBelow/);
});

test('OCR performance guide is linked from contributor docs', async () => {
    const [guide, docs, readme, sourceMap, dependencies, architecture, pkg] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/README.md'),
        read('README.md'),
        read('src/README.md'),
        read('docs/DEPENDENCIES.md'),
        read('docs/ARCHITECTURE.md'),
        read('package.json')
    ]);

    for (const tag of TAGS) {
        assert.match(guide, new RegExp(`\\\`${tag}\\\``));
    }
    assert.match(guide, /Mobile \/ coarse pointer \/ low-memory devices/);
    assert.match(guide, /Cross-origin-isolated hosts/);
    assert.match(guide, /createImageBitmap/);
    assert.match(guide, /text-based PDF invoice/);
    assert.match(docs, /OCR-PERFORMANCE\.md/);
    assert.match(readme, /docs\/OCR-PERFORMANCE\.md/);
    assert.match(sourceMap, /@ocr-\*/);
    assert.match(dependencies, /OCR-PERFORMANCE\.md/);
    assert.match(architecture, /OCR_CONFIG/);
    assert.match(pkg, /qc-ocr-performance\.mjs/);
});
