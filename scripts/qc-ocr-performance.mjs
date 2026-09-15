import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('receipt OCR has documented readable source tags', async () => {
    const [docs, receipt, parser, config] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('src/config.js')
    ]);

    const tags = [
        '@ocr-deps',
        '@ocr-engine',
        '@ocr-pdf',
        '@ocr-pipeline',
        '@ocr-parse',
        '@platform',
        '@perf'
    ];

    for (const tag of tags) {
        assert.match(docs, new RegExp(tag));
        assert.match(`${receipt}\n${parser}\n${config}`, new RegExp(tag));
    }
});

test('OCR tunables stay centralized and same-origin', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js';/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS = \{/);

    for (const asset of ['pdfWorker', 'wasmPath', 'detectionModel', 'recognitionModel', 'dictionary']) {
        assert.match(config, new RegExp(`${asset}: '/vendor/`));
    }

    for (const key of ['maxFileMegabytes', 'maxPdfPages', 'maxExtractedLines', 'maxExtractedChars']) {
        assert.match(config, new RegExp(`${key}:`));
        assert.match(receipt, new RegExp(`OCR_CONFIG\\.(limits|assets|canvas|runtime|scoring)`));
    }
});

test('scanner keeps mobile and desktop performance paths explicit', async () => {
    const receipt = await read('src/features/receipt.js');

    assert.match(receipt, /platformProfile\(\)/);
    assert.match(receipt, /canvasSizing\(\)/);
    assert.match(receipt, /wasmThreadCount\(\)/);
    assert.match(receipt, /crossOriginIsolated === true/);
    assert.match(receipt, /SharedArrayBuffer/);
    assert.match(receipt, /hardwareConcurrency/);
    assert.match(receipt, /createImageBitmap\(file, \{ imageOrientation: 'from-image' \}\)/);
    assert.match(receipt, /pdf\.hasExtractedText/);
    assert.match(receipt, /Receipt\.scoreOcr\(first\) >= OCR_CONFIG\.scoring\.highQualityScore/);
});

test('documentation indexes link to OCR performance guidance', async () => {
    const [readme, docsReadme, sourceReadme, deps] = await Promise.all([
        read('README.md'),
        read('docs/README.md'),
        read('src/README.md'),
        read('docs/DEPENDENCIES.md')
    ]);

    assert.match(readme, /docs\/OCR-PERFORMANCE\.md/);
    assert.match(docsReadme, /OCR-PERFORMANCE\.md/);
    assert.match(sourceReadme, /OCR_CONFIG/);
    assert.match(deps, /OCR-PERFORMANCE\.md/);
});
