/**
 * Quality check: OCR performance config and human-readable source tags.
 * Run: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function read(path) {
    return readFile(join(ROOT, path), 'utf8');
}

test('OCR config owns receipt assets, limits, scoring, and runtime knobs', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    assert.match(config, /export const OCR_CONFIG = Object\.freeze/);
    assert.match(config, /assets: Object\.freeze/);
    assert.match(config, /limits: Object\.freeze/);
    assert.match(config, /scoring: Object\.freeze/);
    assert.match(config, /runtime: Object\.freeze/);
    assert.match(config, /PP-OCRv6_tiny_det\.ort/);
    assert.match(config, /pdfWorker: '\/vendor\/pdfjs\/pdf\.worker\.min\.mjs'/);

    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.match(receipt, /OCR_CONFIG\.limits\.maxFileBytes/);
    assert.match(receipt, /OCR_CONFIG\.limits\.imageMaxSide/);
    assert.match(receipt, /OCR_CONFIG\.scoring\.strongScore/);
    assert.match(receipt, /ort\.env\.wasm\.numThreads = ocrThreadCount\(\)/);
});

test('OCR code keeps mobile and desktop capability choices explicit', async () => {
    const receipt = await read('src/features/receipt.js');

    assert.match(receipt, /globalThis\.crossOriginIsolated !== true/);
    assert.match(receipt, /\(pointer: coarse\)/);
    assert.match(receipt, /navigator\?\.hardwareConcurrency/);
    assert.match(receipt, /Utils\.isPhone\(\)/);
    assert.match(receipt, /createImageBitmap\(file, \{ imageOrientation: 'from-image' \}\)/);
    assert.match(receipt, /Image keeps older browsers working/);
    assert.match(receipt, /PDF\.js is lazy/);
    assert.match(receipt, /Extra passes run only when the first pass is weak/);
});

test('OCR source tags are documented and present where they matter', async () => {
    const [config, receipt, parser, docs, codemap, srcReadme] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('docs/OCR-PERFORMANCE.md'),
        read('docs/CODEMAP.md'),
        read('src/README.md')
    ]);

    for (const tag of ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@platform', '@perf']) {
        assert.match(docs, new RegExp(tag));
        assert.match(codemap, new RegExp(tag));
    }

    assert.match(config, /@ocr-deps/);
    assert.match(config, /@perf/);
    assert.match(receipt, /@ocr-engine/);
    assert.match(receipt, /@ocr-pdf/);
    assert.match(receipt, /@ocr-pipeline/);
    assert.match(receipt, /@platform/);
    assert.match(parser, /@ocr-parse/);
    assert.match(srcReadme, /OCR_CONFIG/);
});

test('public docs point reviewers to the OCR performance contract', async () => {
    const [readme, docsReadme, deps, architecture] = await Promise.all([
        read('README.md'),
        read('docs/README.md'),
        read('docs/DEPENDENCIES.md'),
        read('docs/ARCHITECTURE.md')
    ]);

    for (const source of [readme, docsReadme, deps, architecture]) {
        assert.match(source, /OCR-PERFORMANCE\.md/);
    }
    assert.match(readme, /Mobile stays memory-aware/);
    assert.match(readme, /isolated desktop browsers can use capped WASM threads/);
    assert.match(architecture, /OCR_CONFIG/);
});
