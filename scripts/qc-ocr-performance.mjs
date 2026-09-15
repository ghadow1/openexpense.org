/**
 * Keep OCR performance knobs and human-readable tags discoverable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');

test('OCR runtime knobs live in shared config', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = \{/);
    assert.match(config, /@ocr-deps @platform @perf/);
    assert.match(config, /pdfWorker: '\/vendor\/pdfjs\/pdf\.worker\.min\.mjs'/);
    assert.match(config, /wasm: '\/vendor\/ort\/'/);
    assert.match(config, /detection: '\/vendor\/ocr-models\/PP-OCRv6_tiny_det\.ort'/);
    assert.match(config, /recognition: '\/vendor\/ocr-models\/PP-OCRv6_tiny_rec\.ort'/);
    assert.match(config, /dictionary: '\/vendor\/ocr-models\/ppocrv6_tiny_dict\.txt'/);
    assert.match(config, /maxFileBytes: 15 \* 1024 \* 1024/);
    assert.match(config, /maxPdfPages: 20/);
    assert.match(config, /maxDecodeSide: 2600/);
    assert.match(config, /maxEnhancePixels: 1_800_000/);
    assert.match(config, /requireCrossOriginIsolationForThreads: true/);

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.match(receipt, /ort\.env\.wasm\.wasmPaths = Receipt\.OCR_ASSETS\.wasm/);
    assert.match(receipt, /ort\.env\.wasm\.numThreads = Receipt\.wasmThreadCount\(\)/);
    assert.match(receipt, /executionProviders: OCR_CONFIG\.runtime\.executionProviders/);
});

test('OCR source tags and docs stay connected', async () => {
    const [docs, codeMap, sourceReadme, rootReadme, packageJson] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/CODEMAP.md'),
        read('src/README.md'),
        read('README.md'),
        read('package.json')
    ]);

    for (const tag of ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@platform', '@perf']) {
        assert.match(docs, new RegExp(tag));
        assert.match(codeMap, new RegExp(tag));
    }

    const taggedFiles = new Map([
        ['src/config.js', /@ocr-deps @platform @perf/],
        ['src/features/receipt.js', /@ocr-engine @ocr-pipeline @platform @perf[\s\S]*@ocr-pdf/],
        ['src/features/receipt-parse.js', /@ocr-parse @ocr-pipeline/],
        ['src/features/receipt-picker.js', /@platform @ocr-pipeline/]
    ]);
    for (const [path, pattern] of taggedFiles) {
        assert.match(await read(path), pattern);
    }

    assert.match(sourceReadme, /docs\/OCR-PERFORMANCE\.md/);
    assert.match(rootReadme, /docs\/OCR-PERFORMANCE\.md/);
    assert.match(packageJson, /qc-ocr-performance\.mjs/);
});

test('OCR performance guide documents platform safeguards', async () => {
    const [docs, help, deps] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('index.html'),
        read('docs/DEPENDENCIES.md')
    ]);

    assert.match(docs, /createImageBitmap\(\)/);
    assert.match(docs, /PDF files use native text first/);
    assert.match(docs, /cross-origin isolated/);
    assert.match(docs, /SharedArrayBuffer/);
    assert.match(docs, /Do not switch model assets to remote URLs/);
    assert.match(help, /Phones open the camera-friendly picker/);
    assert.match(help, /uses embedded PDF text when it can/);
    assert.match(deps, /OCR_CONFIG/);
});
