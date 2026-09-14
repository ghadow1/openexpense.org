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

test('OCR performance settings stay centralized and documented', async () => {
    const [config, receipt, parser, guide, docsIndex, sourceIndex] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/README.md'),
        read('src/README.md')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    assert.match(config, /pdfWorker: '\/vendor\/pdfjs\/pdf\.worker\.min\.mjs'/);
    assert.match(config, /wasmRoot: '\/vendor\/ort\/'/);
    assert.match(config, /PP-OCRv6_tiny_det\.ort/);
    assert.match(config, /PP-OCRv6_tiny_rec\.ort/);
    assert.match(config, /maxFileBytes: 15 \* 1024 \* 1024/);
    assert.match(config, /imageMaxSide: 2600/);
    assert.match(config, /enhanceMaxPixels: 1_800_000/);
    assert.match(config, /wasmThreads: 1/);

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.match(receipt, /const RECEIPT_LIMITS = OCR_CONFIG\.limits/);
    assert.match(receipt, /const OCR_SCORING = OCR_CONFIG\.scoring/);
    assert.match(receipt, /OCR_CONFIG\.runtime\.preferImageBitmap/);
    assert.match(receipt, /OCR_CONFIG\.runtime\.executionProviders/);
    assert.match(receipt, /Receipt\.scoreOcr\(first\) >= OCR_SCORING\.goodScore/);
    assert.doesNotMatch(receipt, /maxSide = 2600/);
    assert.doesNotMatch(receipt, /numThreads = 1/);

    for (const tag of TAGS) {
        assert.match(`${config}\n${receipt}\n${parser}`, new RegExp(tag), `${tag} missing from source`);
        assert.match(guide, new RegExp(tag), `${tag} missing from docs/OCR-PERFORMANCE.md`);
    }

    assert.match(docsIndex, /OCR-PERFORMANCE\.md/);
    assert.match(sourceIndex, /OCR_CONFIG/);
});

test('OCR dependencies remain same-origin and lazy', async () => {
    const [config, receipt, picker, architecture, deps] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-picker.js'),
        read('docs/ARCHITECTURE.md'),
        read('docs/DEPENDENCIES.md')
    ]);

    assert.doesNotMatch(config, /https?:\/\//);
    assert.match(receipt, /await import\('onnxruntime-web'\)/);
    assert.match(receipt, /await import\('ppu-paddle-ocr\/web'\)/);
    assert.match(receipt, /await import\('pdfjs-dist\/build\/pdf\.mjs'\)/);
    assert.match(receipt, /pdf\.hasExtractedText/);
    assert.match(picker, /user gesture/);
    assert.match(picker, /capture', 'environment'/);
    assert.match(architecture, /OCR_CONFIG/);
    assert.match(deps, /Receipt runtimes and models load only when needed/);
});
