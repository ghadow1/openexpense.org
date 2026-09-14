import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');
const REQUIRED_TAGS = ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@platform', '@perf'];

test('receipt OCR performance settings live in one documented config', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS = \{/);

    for (const key of [
        'pdfWorker',
        'assets',
        'wasmThreads',
        'maxFileBytes',
        'imageMaxSide',
        'imageMinOcrSide',
        'enhancementMaxPixels',
        'acceptScore'
    ]) {
        assert.match(config, new RegExp(`\\b${key}\\b`));
    }

    assert.match(receipt, /OCR_LIMITS\.maxFileBytes/);
    assert.match(receipt, /OCR_LIMITS\.imageMaxSide/);
    assert.match(receipt, /OCR_LIMITS\.enhancementMaxPixels/);
    assert.match(receipt, /OCR_QUALITY\.acceptScore/);
});

test('receipt OCR tags are present in code and explained in docs', async () => {
    const [config, receipt, docs, docsIndex, sourceIndex] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/README.md'),
        read('src/README.md')
    ]);

    for (const tag of REQUIRED_TAGS) {
        assert.match(`${config}\n${receipt}`, new RegExp(tag));
        assert.ok(docs.includes(`\`${tag}\``), `${tag} should be explained in docs/OCR-PERFORMANCE.md`);
    }

    assert.match(docs, /OCR_CONFIG/);
    assert.match(docs, /createImageBitmap/);
    assert.match(docs, /same-origin/);
    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /OCR_CONFIG/);
    assert.match(sourceIndex, /@ocr-\*/);
});
