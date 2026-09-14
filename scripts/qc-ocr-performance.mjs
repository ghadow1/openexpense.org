import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OCR_CONFIG } from '../src/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('OCR_CONFIG owns scan limits, assets, runtime hints, and readable tags', async () => {
    const config = await read('src/config.js');
    assert.match(config, /export const OCR_CONFIG = \{/);
    assert.equal(OCR_CONFIG.assets.pdfWorker, '/vendor/pdfjs/pdf.worker.min.mjs');
    assert.equal(OCR_CONFIG.runtime.recognitionStrategy, 'cross-line');
    assert.deepEqual(OCR_CONFIG.runtime.executionProviders, ['wasm']);
    assert.ok(OCR_CONFIG.input.maxFileBytes <= 15 * 1024 * 1024);
    assert.ok(OCR_CONFIG.pdf.maxPages <= 20);
    assert.ok(OCR_CONFIG.image.maxSideMobile < OCR_CONFIG.image.maxSideDesktop);
    assert.ok(OCR_CONFIG.image.enhancementMaxPixels <= 1_800_000);

    for (const tag of Object.values(OCR_CONFIG.tags)) {
        assert.match(config, new RegExp(escapeRegExp(tag)), `${tag} should be named in OCR_CONFIG`);
    }
});

test('receipt pipeline reads config instead of scattering performance literals', async () => {
    const receipt = await read('src/features/receipt.js');
    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.match(receipt, /OCR_CONFIG\.input\.maxFileBytes/);
    assert.match(receipt, /OCR_CONFIG\.pdf\.maxPages/);
    assert.match(receipt, /OCR_CONFIG\.pdf\.previewMaxSide/);
    assert.match(receipt, /OCR_CONFIG\.image\.enhancementMaxPixels/);
    assert.match(receipt, /OCR_CONFIG\.scoring\.highConfidence/);
    assert.match(receipt, /ort\.env\.wasm\.numThreads = runtime\.wasmThreads/);
    assert.match(receipt, /createImageBitmap\(file, OCR_CONFIG\.image\.bitmapOptions\)/);
});

test('platform helpers use browser capabilities for mobile and desktop OCR', async () => {
    const utils = await read('src/core/utils.js');
    assert.match(utils, /platformProfile\(\)/);
    assert.match(utils, /ocrRuntimeProfile\(\)/);
    assert.match(utils, /hardwareConcurrency/);
    assert.match(utils, /deviceMemory/);
    assert.match(utils, /crossOriginIsolated/);
    assert.match(utils, /SharedArrayBuffer/);
    assert.match(utils, /maxSideMobile/);
    assert.match(utils, /maxSideDesktop/);

    const picker = await read('src/features/receipt-picker.js');
    assert.match(picker, /Utils\.prefersCamera\(\)/);
    assert.match(picker, /capture', 'environment'/);
});

test('OCR tags are documented where reviewers look first', async () => {
    const [docs, docsIndex, srcIndex, dependencies, receipt, parser, utils] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/README.md'),
        read('src/README.md'),
        read('docs/DEPENDENCIES.md'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('src/core/utils.js')
    ]);
    const sourceBlob = `${receipt}\n${parser}\n${utils}`;

    for (const tag of Object.values(OCR_CONFIG.tags)) {
        const pattern = new RegExp(escapeRegExp(tag));
        assert.match(docs, pattern, `${tag} should be explained in docs/OCR-PERFORMANCE.md`);
        assert.match(sourceBlob, pattern, `${tag} should appear in source near the relevant code`);
    }

    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(srcIndex, /OCR-PERFORMANCE\.md/);
    assert.match(dependencies, /OCR-PERFORMANCE\.md/);
});
