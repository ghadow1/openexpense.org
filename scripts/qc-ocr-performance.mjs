import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OCR_CONFIG } from '../src/config.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const TAGS = Object.values(OCR_CONFIG.tags);

test('OCR config keeps assets, limits, scoring, and tags centralized', () => {
    assert.deepEqual(TAGS, [
        '@ocr-deps',
        '@ocr-engine',
        '@ocr-pdf',
        '@ocr-pipeline',
        '@ocr-parse',
        '@platform',
        '@perf'
    ]);

    assert.equal(OCR_CONFIG.assets.pdfWorker, '/vendor/pdfjs/pdf.worker.min.mjs');
    assert.equal(OCR_CONFIG.assets.wasm, '/vendor/ort/');
    assert.match(OCR_CONFIG.assets.models.detection, /PP-OCRv6_tiny_det\.ort$/);
    assert.match(OCR_CONFIG.assets.models.recognition, /PP-OCRv6_tiny_rec\.ort$/);
    assert.match(OCR_CONFIG.assets.models.dictionary, /ppocrv6_tiny_dict\.txt$/);

    assert.ok(OCR_CONFIG.limits.imageMobileMaxSide < OCR_CONFIG.limits.imageMaxSide);
    assert.ok(OCR_CONFIG.limits.ocrMobileMaxSide < OCR_CONFIG.limits.ocrMaxSide);
    assert.ok(OCR_CONFIG.limits.enhancementMobileMaxPixels < OCR_CONFIG.limits.enhancementMaxPixels);
    assert.equal(OCR_CONFIG.runtime.executionProvider, 'wasm');
    assert.equal(OCR_CONFIG.runtime.recognitionStrategy, 'cross-line');
    assert.ok(OCR_CONFIG.runtime.maxDesktopThreads >= OCR_CONFIG.runtime.baseThreads);
});

test('receipt OCR uses platform profile instead of hard-coded budgets', async () => {
    const source = await read('src/features/receipt.js');

    assert.match(source, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(source, /const RECEIPT_LIMITS =/);
    assert.match(source, /function ocrRuntimeProfile\(\)/);
    assert.match(source, /window\.crossOriginIsolated/);
    assert.match(source, /navigator\.hardwareConcurrency/);
    assert.match(source, /navigator\.deviceMemory/);
    assert.match(source, /Utils\.isPhone\(\) \|\| Utils\.isMobile\(\) \|\| coarsePointer/);
    assert.match(source, /ort\.env\.wasm\.numThreads = runtimeProfile\.wasmThreads/);
    assert.match(source, /OCR_LIMITS\.pdfPreviewMaxScale/);
    assert.match(source, /OCR_LIMITS\.pdfPreviewMaxSide/);
    assert.match(source, /runtimeProfile\.imageMaxSide/);
    assert.match(source, /runtimeProfile\.ocrMaxSide/);
    assert.match(source, /runtimeProfile\.smoothingQuality/);
    assert.match(source, /enhancementMaxPixels/);
    assert.match(source, /createImageBitmap/);
});

test('OCR tags are documented and present in source', async () => {
    const [docs, receipt, config, docsIndex, sourceIndex] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/features/receipt.js'),
        read('src/config.js'),
        read('docs/README.md'),
        read('src/README.md')
    ]);

    for (const tag of TAGS) {
        assert.ok(docs.includes(`\`${tag}\``), `${tag} should be in the OCR tag legend`);
        assert.ok(config.includes(`'${tag}'`), `${tag} should be centralized in OCR_CONFIG.tags`);
    }

    for (const tag of ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@platform', '@perf']) {
        assert.ok(receipt.includes(tag), `${tag} should appear in receipt.js`);
    }

    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /@ocr-\*/);
    assert.match(docs, /cross-origin isolation/);
    assert.match(docs, /Do not add remote OCR APIs/);
});
