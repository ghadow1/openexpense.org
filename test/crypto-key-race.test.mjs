import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import 'fake-indexeddb/auto';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';

if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
        value: webcrypto,
        configurable: true
    });
}

async function copyModuleTree() {
    const root = await mkdtemp(path.join(tmpdir(), 'openexpense-crypto-test-'));
    const coreDir = path.join(root, 'src', 'core');
    await mkdir(coreDir, { recursive: true });
    await writeFile(path.join(root, 'package.json'), '{"type":"module"}\n');

    for (const file of ['crypto.js', 'persist.js']) {
        const source = await readFile(path.join(process.cwd(), 'src', 'core', file), 'utf8');
        await writeFile(path.join(coreDir, file), source);
    }

    return root;
}

test('concurrent first-use encryption reuses one persisted device key', async () => {
    globalThis.indexedDB = new FDBFactory();
    const root = await copyModuleTree();

    try {
        const cryptoUrl = pathToFileURL(path.join(root, 'src', 'core', 'crypto.js')).href;
        const [tabA, tabB] = await Promise.all([
            import(`${cryptoUrl}?tab=a`),
            import(`${cryptoUrl}?tab=b`)
        ]);

        const payloadA = { name: 'tab-a', events: { '2026-08-15': [{ title: 'Coffee', price: 4 }] } };
        const payloadB = { name: 'tab-b', events: { '2026-08-16': [{ title: 'Lunch', price: 12 }] } };
        const [encryptedA, encryptedB] = await Promise.all([
            tabA.encryptJSON(payloadA),
            tabB.encryptJSON(payloadB)
        ]);

        const reader = await import(`${cryptoUrl}?tab=reader`);
        await assert.doesNotReject(() => reader.decryptJSON(encryptedA));
        await assert.doesNotReject(() => reader.decryptJSON(encryptedB));
        assert.deepEqual(await reader.decryptJSON(encryptedA), payloadA);
        assert.deepEqual(await reader.decryptJSON(encryptedB), payloadB);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
