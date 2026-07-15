import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const decoder = new TextDecoder();

async function loadBundleModule(t) {
    const dir = await mkdtemp(path.join(tmpdir(), 'openexpense-bundle-test-'));
    t.after(() => rm(dir, { recursive: true, force: true }));

    const outfile = path.join(dir, 'bundle.mjs');
    await build({
        entryPoints: [path.join(root, 'src/core/bundle.js')],
        bundle: true,
        platform: 'node',
        format: 'esm',
        outfile,
        logLevel: 'silent'
    });

    return import(pathToFileURL(outfile).href);
}

test('encrypted export zip does not include the decryption key', async (t) => {
    const { BUNDLE, entryToJson, unzipBundle, zipBundle } = await loadBundleModule(t);
    const encryptedLedger = {
        format: BUNDLE.ENC_FORMAT,
        version: BUNDLE.VERSION,
        alg: 'AES-GCM',
        iv: 'test-iv',
        ct: 'test-ciphertext'
    };

    const entries = unzipBundle(zipBundle(encryptedLedger));

    assert.ok(entries[BUNDLE.ENC_NAME], 'encrypted ledger is included');
    assert.ok(entries[BUNDLE.README_NAME], 'restore instructions are included');
    assert.equal(entries[BUNDLE.KEY_NAME], undefined, 'key file must not be packaged with ciphertext');
    assert.deepEqual(entryToJson(entries[BUNDLE.ENC_NAME]), encryptedLedger);
    assert.match(decoder.decode(entries[BUNDLE.README_NAME]), /does not contain the key file/i);
});
