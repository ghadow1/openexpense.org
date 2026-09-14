import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const OCR_TAGS = ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@platform', '@perf'];
const literal = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test('OCR performance tags are documented and present in source', async () => {
    const [doc, config, receipt, parser, utils] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-parse.js'),
        read('src/core/utils.js')
    ]);
    const source = [config, receipt, parser, utils].join('\n');

    for (const tag of OCR_TAGS) {
        assert.match(doc, literal(tag));
        assert.match(source, literal(tag));
    }
});

test('receipt OCR limits and runtime choices stay centralized', async () => {
    const [config, receipt, pickerDoc] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('docs/OCR-PERFORMANCE.md')
    ]);

    assert.match(config, /export const OCR_CONFIG = Object\.freeze/);
    assert.match(config, /maxFileBytes: 15 \* 1024 \* 1024/);
    assert.match(config, /maxPdfPages: 20/);
    assert.match(config, /imageMinSide: 1200/);
    assert.match(config, /imageMaxSide: 2600/);
    assert.match(config, /enhancementMaxPixels: 1_800_000/);
    assert.match(config, /cameraMediaMaxWidth: 900/);
    assert.match(config, /wasmThreads: 1/);

    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.match(receipt, /OCR_LIMITS\.maxFileBytes/);
    assert.match(receipt, /OCR_RUNTIME\.wasmThreads/);
    assert.match(receipt, /OCR_SCORING\.strongScore/);
    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS/);

    assert.match(pickerDoc, /15 MB maximum input file/);
    assert.match(pickerDoc, /20 maximum PDF pages/);
    assert.match(pickerDoc, /1,200-2,600 px OCR image side range/);
});
