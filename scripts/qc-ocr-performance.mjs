/**
 * OCR performance and code-tag quality controls.
 *
 * The receipt scanner is expensive compared with the rest of the app. These
 * checks keep OCR/PDF budgets centralized and keep contributor tags searchable.
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

test('OCR runtime and resource budgets stay centralized', async () => {
    const [config, receipt, utils] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/core/utils.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    for (const section of ['assets', 'limits', 'canvas', 'runtime', 'scoring']) {
        assert.match(config, new RegExp(`\\b${section}: \\{`));
    }

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js';/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS = \{/);
    assert.doesNotMatch(receipt, /\/vendor\/ocr-models\/PP-OCRv6_tiny_det\.ort/);
    assert.doesNotMatch(receipt, /numThreads = 1/);
    assert.match(receipt, /Utils\.ocrWasmThreadCount\(OCR_RUNTIME\)/);
    assert.match(utils, /ocrWasmThreadCount\(config = \{\}\)/);
    assert.match(utils, /window\.crossOriginIsolated/);
});

test('human-readable OCR tags are documented and searchable', async () => {
    const [docs, config, receipt, utils] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/core/utils.js')
    ]);
    const source = `${config}\n${receipt}\n${utils}`;

    for (const tag of TAGS) {
        assert.match(docs, new RegExp(tag.replace('@', '@')));
        assert.match(source, new RegExp(tag.replace('@', '@')));
    }
});

test('documentation links expose OCR performance guidance', async () => {
    const [readme, docsIndex, sourceIndex] = await Promise.all([
        read('README.md'),
        read('docs/README.md'),
        read('src/README.md')
    ]);

    assert.match(readme, /docs\/OCR-PERFORMANCE\.md/);
    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /@ocr-\*/);
});
