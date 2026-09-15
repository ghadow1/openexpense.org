/**
 * OCR source tags and performance knobs are review aids. This check keeps the
 * receipt pipeline searchable without needing to import browser-only modules.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(ROOT, path), 'utf8');
const TAGS = ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@platform', '@perf'];

test('OCR code tags are documented and present at runtime boundaries', async () => {
    const [docs, config, receipt, picker, utils] = await Promise.all([
        read('docs/OCR-PERFORMANCE.md'),
        read('src/config.js'),
        read('src/features/receipt.js'),
        read('src/features/receipt-picker.js'),
        read('src/core/utils.js')
    ]);

    for (const tag of TAGS) {
        assert.match(docs, new RegExp(tag), `${tag} missing from OCR guide`);
    }

    assert.match(config, /export const OCR_CONFIG/);
    assert.match(receipt, /Tags: @ocr-deps @ocr-engine @ocr-pdf @ocr-pipeline @ocr-parse @platform @perf/);
    assert.match(receipt, /import \{ OCR_CONFIG \} from '\.\.\/config\.js'/);
    assert.match(picker, /@platform Mobile and coarse-pointer devices/);
    assert.match(utils, /ocrThreadBudget/);
});

test('OCR resource budgets stay centralized in config', async () => {
    const [config, receipt] = await Promise.all([
        read('src/config.js'),
        read('src/features/receipt.js')
    ]);

    for (const key of [
        'maxFileBytes',
        'maxPdfPages',
        'maxExtractedLines',
        'maxExtractedChars',
        'minOcrSide',
        'maxOcrSide',
        'maxEnhancementPixels',
        'pdfPreviewMaxSide',
        'pdfPreviewMaxScale',
        'desktopMaxThreads'
    ]) {
        assert.match(config, new RegExp(`${key}:`), `${key} missing from OCR_CONFIG`);
    }

    assert.doesNotMatch(receipt, /const RECEIPT_LIMITS = \{/);
    assert.match(receipt, /const RECEIPT_LIMITS = OCR_CONFIG\.limits/);
    assert.match(receipt, /Utils\.ocrThreadBudget\(OCR_CONFIG\.platform\)/);
    assert.match(receipt, /RECEIPT_LIMITS\.maxEnhancementPixels/);
});

test('PDF text extraction avoids repeated whole-document joins', async () => {
    const receipt = await read('src/features/receipt.js');

    assert.match(receipt, /let extractedChars = 0/);
    assert.match(receipt, /extractedChars \+= line\.length \+ 1/);
    assert.doesNotMatch(receipt, /allLines\.join\('\\n'\)\.length/);
});
