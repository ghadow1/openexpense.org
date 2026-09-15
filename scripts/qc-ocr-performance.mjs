import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const OCR_TAGS = [
    '@ocr-deps',
    '@ocr-engine',
    '@ocr-pdf',
    '@ocr-pipeline',
    '@ocr-parse',
    '@platform',
    '@perf'
];

test('receipt OCR has searchable human-readable tags and docs', async () => {
    const [docs, readme, docsIndex, sourceIndex, dependencies] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('README.md'),
        read('docs/README.md'),
        read('src/README.md'),
        read('docs/DEPENDENCIES.md')
    ]);

    for (const tag of OCR_TAGS) assert.ok(docs.includes(tag), `${tag} missing from OCR docs`);
    assert.match(readme, /docs\/OCR-PERFORMANCE\.md/);
    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /OCR_CONFIG/);
    assert.match(sourceIndex, /features\/receipt\.js[\s\S]*OCR-PERFORMANCE\.md/);
    assert.match(dependencies, /@ocr-deps/);
});

test('receipt OCR performance values stay centralized', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = Object\.freeze/);
    for (const tag of OCR_TAGS) assert.ok(config.includes(tag), `${tag} missing from OCR config`);

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.match(receipt, /const OCR_LIMITS = OCR_CONFIG\.limits/);
    assert.match(receipt, /const OCR_SCORING = OCR_CONFIG\.scoring/);
    assert.match(receipt, /const OCR_PROGRESS = OCR_CONFIG\.progress/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.doesNotMatch(receipt, /maxFileBytes:\s*15 \* 1024 \* 1024/);
});

test('receipt OCR uses modern capabilities behind compatible fallbacks', async () => {
    const receipt = await read('src/features/receipt.js');

    assert.match(receipt, /function ocrWasmThreadCount\(\)/);
    assert.match(receipt, /crossOriginIsolated/);
    assert.match(receipt, /SharedArrayBuffer/);
    assert.match(receipt, /navigator\.hardwareConcurrency/);
    assert.match(receipt, /Utils\.isPhone\(\)/);
    assert.match(receipt, /createImageBitmap\(file, \{ imageOrientation: 'from-image' \}\)/);
    assert.match(receipt, /fall back to Image/);
    assert.match(receipt, /pdf\.hasExtractedText/);
});

test('OCR performance guard is part of npm test', async () => {
    const pkg = JSON.parse(await read('package.json'));
    assert.match(pkg.scripts.test, /scripts\/qc-ocr-performance\.mjs/);
});
