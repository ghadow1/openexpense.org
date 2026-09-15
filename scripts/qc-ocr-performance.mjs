import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OCR_CONFIG } from '../src/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');

test('OCR performance guide documents searchable source tags', async () => {
    const files = {
        config: await read('src/config.js'),
        receipt: await read('src/features/receipt.js'),
        parser: await read('src/features/receipt-parse.js'),
        picker: await read('src/features/receipt-picker.js'),
        utils: await read('src/core/utils.js'),
        guide: await read('docs/OCR-PERFORMANCE.md')
    };

    const tagOwners = {
        '@ocr-deps': [files.config],
        '@ocr-engine': [files.receipt],
        '@ocr-pdf': [files.receipt],
        '@ocr-pipeline': [files.receipt],
        '@ocr-parse': [files.parser],
        '@platform': [files.config, files.receipt, files.picker, files.utils],
        '@perf': [files.config, files.receipt, files.parser]
    };

    for (const [tag, sources] of Object.entries(tagOwners)) {
        assert.match(files.guide, new RegExp(tag));
        assert.equal(sources.some((source) => source.includes(tag)), true, `${tag} missing from source`);
    }
});

test('OCR runtime limits and assets stay centralized', async () => {
    const [receipt, deps, readme, docsIndex, sourceIndex] = await Promise.all([
        read('src/features/receipt.js'),
        read('docs/DEPENDENCIES.md'),
        read('README.md'),
        read('docs/README.md'),
        read('src/README.md')
    ]);

    assert.equal(OCR_CONFIG.dependencies.engine, 'ppu-paddle-ocr');
    assert.equal(OCR_CONFIG.dependencies.runtime, 'onnxruntime-web');
    assert.equal(OCR_CONFIG.dependencies.pdf, 'pdfjs-dist');
    assert.equal(OCR_CONFIG.assets.wasmPath, '/vendor/ort/');
    assert.equal(OCR_CONFIG.limits.maxFileBytes, 15 * 1024 * 1024);
    assert.equal(OCR_CONFIG.limits.maxOcrSide, 2600);
    assert.equal(OCR_CONFIG.limits.maxEnhancePixels, 1_800_000);
    assert.equal(OCR_CONFIG.runtime.wasmThreads, 1);
    assert.deepEqual(OCR_CONFIG.runtime.executionProviders, ['wasm']);

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);
    assert.doesNotMatch(receipt, /\/vendor\/ocr-models\//);
    assert.doesNotMatch(receipt, /PP-OCRv6_tiny_(det|rec)\.ort/);
    assert.match(receipt, /createImageBitmap\(file, \{ imageOrientation: 'from-image' \}\)/);
    assert.match(receipt, /Image fallback for Safari/);

    for (const source of [deps, readme, docsIndex, sourceIndex]) {
        assert.match(source, /OCR-PERFORMANCE\.md|OCR_CONFIG/);
    }
});

test('OCR dependencies listed in config are installed package dependencies', async () => {
    const pkg = JSON.parse(await read('package.json'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const dependencyName of Object.values(OCR_CONFIG.dependencies)) {
        if (dependencyName === OCR_CONFIG.dependencies.model) continue;
        assert.ok(deps[dependencyName], `${dependencyName} missing from package.json`);
    }

    assert.match(pkg.scripts.test, /qc-ocr-performance\.mjs/);
});
