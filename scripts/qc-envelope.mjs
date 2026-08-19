/**
 * Quality-control checks for the v2 encrypted envelope.
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ENVELOPE, sealPayload, openPayload, deriveEnvelopeKeys, wrapSecret, unwrapSecret,
    canonicalJson, headerAad, equalBytes, randomBytes, toBase64, fromBase64
} from '../src/core/envelope.js';
import {
    BUNDLE, encryptBundle, decryptBundle, needsPassphrase, isEncFile, isKeyFile
} from '../src/core/bundle.js';
import { validateEncFile, validateKeyFile, kidsMatch, classifyJson, FILE_LIMITS } from '../src/core/ledger-file.js';
import { sealRecord, openRecord } from '../src/core/crypto.js';

const payload = {
    name: 'Home ledger',
    events: { '2026-06-01': [{ title: 'Rent', price: 1450, paid: true }] },
    savedAt: 1780000000000
};

const PASSPHRASE = 'correct horse battery staple';

/** Rebuild a v1 export exactly as the previous release wrote it. */
async function legacyBundle(data) {
    const c = globalThis.crypto;
    const key = await c.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = randomBytes(12);
    const ct = await c.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(JSON.stringify(data))
    );
    const jwk = await c.subtle.exportKey('jwk', key);
    const kid = '0123456789abcdef0123456789abcdef';
    return {
        enc: {
            format: 'openexpense-encrypted',
            version: 1,
            alg: 'AES-GCM',
            kid,
            iv: toBase64(iv),
            ct: toBase64(new Uint8Array(ct)),
            createdAt: 1780000000000
        },
        keyFile: { format: 'openexpense-key', version: 1, kid, alg: 'AES-GCM', key: jwk }
    };
}

test('v2 envelope publishes the parameters it was sealed with', async () => {
    const { enc, keyFile } = await encryptBundle(payload);
    assert.equal(enc.version, 2);
    assert.equal(enc.alg, 'AES-256-GCM');
    assert.equal(enc.kdf, 'HKDF-SHA-256');
    assert.equal(fromBase64(enc.salt).length, ENVELOPE.SALT_BYTES);
    assert.equal(fromBase64(enc.iv).length, ENVELOPE.IV_BYTES);
    assert.equal(fromBase64(enc.commit).length, ENVELOPE.COMMIT_BYTES);

    assert.equal(validateEncFile(enc).ok, true);
    assert.equal(validateKeyFile(keyFile).ok, true);
    assert.equal(kidsMatch(enc, keyFile), true);
    assert.equal(classifyJson(enc), 'enc');
    assert.equal(classifyJson(keyFile), 'key');

    const opened = await decryptBundle(enc, keyFile);
    assert.deepEqual(opened, payload);
});

test('salt and iv are fresh for every seal', async () => {
    const seen = new Set();
    for (let i = 0; i < 8; i++) {
        const { enc } = await encryptBundle(payload);
        assert.equal(seen.has(enc.iv), false, 'iv repeated across seals');
        assert.equal(seen.has(enc.salt), false, 'salt repeated across seals');
        seen.add(enc.iv);
        seen.add(enc.salt);
    }
});

test('the commitment rejects a wrong key before any decryption runs', async () => {
    const secret = randomBytes(32);
    const enc = await sealPayload(payload, secret, { kid: 'abc' });
    await assert.rejects(
        () => openPayload(enc, randomBytes(32)),
        /ENVELOPE_KEY_MISMATCH/,
        'a wrong key must be named as such, not surfaced as a generic failure'
    );
    assert.deepEqual(await openPayload(enc, secret), payload);
});

test('a second key cannot be substituted for the sealed one', async () => {
    const a = await encryptBundle(payload);
    const b = await encryptBundle(payload);
    assert.equal(kidsMatch(a.enc, b.keyFile), false);
    await assert.rejects(() => decryptBundle(a.enc, b.keyFile));
});

test('every header field is authenticated, not just the ciphertext', async () => {
    const secret = randomBytes(32);
    const base = await sealPayload(payload, secret, {
        format: BUNDLE.ENC_FORMAT,
        kid: '0123456789abcdef0123456789abcdef',
        createdAt: 1780000000000
    });
    assert.deepEqual(await openPayload(base, secret), payload);

    const edits = {
        format: 'something-else',
        kid: 'ffffffffffffffffffffffffffffffff',
        createdAt: 1,
        version: 3,
        alg: 'AES-128-GCM',
        kdf: 'HKDF-SHA-512'
    };
    for (const [field, value] of Object.entries(edits)) {
        await assert.rejects(
            () => openPayload({ ...base, [field]: value }, secret),
            `editing ${field} should break decryption`
        );
    }

    // A field this version never wrote must also invalidate the envelope.
    await assert.rejects(() => openPayload({ ...base, injected: true }, secret));

    // Swapping the published commitment for another key's does not help either.
    const other = randomBytes(32);
    const { commitment } = await deriveEnvelopeKeys(other, fromBase64(base.salt));
    await assert.rejects(() => openPayload({ ...base, commit: toBase64(commitment) }, secret));
});

test('ciphertext tampering is caught', async () => {
    const secret = randomBytes(32);
    const enc = await sealPayload(payload, secret, { kid: 'abc' });
    const ct = fromBase64(enc.ct);
    ct[0] ^= 0x01;
    await assert.rejects(() => openPayload({ ...enc, ct: toBase64(ct) }, secret));
});

test('a passphrase keeps the master secret out of key.json', async () => {
    const { enc, keyFile } = await encryptBundle(payload, { passphrase: PASSPHRASE });
    assert.equal(keyFile.secret, undefined, 'raw secret must not be written when a passphrase is set');
    assert.equal(needsPassphrase(keyFile), true);
    assert.equal(keyFile.wrap.kdf, 'PBKDF2-HMAC-SHA-256');
    assert.equal(keyFile.wrap.iterations, ENVELOPE.WRAP_ITERATIONS);
    assert.equal(validateKeyFile(keyFile).ok, true);

    assert.deepEqual(await decryptBundle(enc, keyFile, { passphrase: PASSPHRASE }), payload);
    await assert.rejects(() => decryptBundle(enc, keyFile, { passphrase: 'not it' }));
    await assert.rejects(() => decryptBundle(enc, keyFile), /PASSPHRASE_REQUIRED/);
});

test('passphrases compare by unicode normalization, not raw bytes', async () => {
    const secret = randomBytes(32);
    // "é" composed vs decomposed — the same word to a person typing it.
    const wrap = await wrapSecret(secret, 'caf\u00e9 latte', { kid: 'abc' });
    const back = await unwrapSecret(wrap, 'cafe\u0301 latte', { kid: 'abc' });
    assert.ok(equalBytes(back, secret));
});

test('passphrase work factor cannot be downgraded', async () => {
    const secret = randomBytes(32);
    const wrap = await wrapSecret(secret, PASSPHRASE, { kid: 'abc' });

    await assert.rejects(
        () => unwrapSecret({ ...wrap, iterations: 1000 }, PASSPHRASE, { kid: 'abc' }),
        /ENVELOPE_WEAK_WRAP/
    );
    assert.equal(validateKeyFile({
        format: 'openexpense-key', version: 2, kid: 'abc', alg: ENVELOPE.ALG, kdf: ENVELOPE.KDF,
        wrap: { ...wrap, iterations: 1000 }
    }).ok, false);

    // Even an iteration count above the floor is bound into the AAD, so it
    // cannot be edited to a cheaper-but-legal value.
    await assert.rejects(
        () => unwrapSecret({ ...wrap, iterations: ENVELOPE.MIN_WRAP_ITERATIONS }, PASSPHRASE, { kid: 'abc' })
    );
});

test('passphrase work factor is capped before expensive key derivation', async () => {
    const secret = randomBytes(32);
    const wrap = await wrapSecret(secret, PASSPHRASE, { kid: 'abc' });
    const excessiveWrap = { ...wrap, iterations: ENVELOPE.MAX_WRAP_ITERATIONS + 1 };

    await assert.rejects(
        () => unwrapSecret(excessiveWrap, PASSPHRASE, { kid: 'abc' }),
        /ENVELOPE_EXCESSIVE_WRAP/
    );
    assert.equal(validateKeyFile({
        format: 'openexpense-key',
        version: 2,
        kid: 'abc',
        alg: ENVELOPE.ALG,
        kdf: ENVELOPE.KDF,
        wrap: excessiveWrap
    }).ok, false);
});

test('the wrap is bound to its key id', async () => {
    const secret = randomBytes(32);
    const wrap = await wrapSecret(secret, PASSPHRASE, { kid: 'aaaa' });
    await assert.rejects(() => unwrapSecret(wrap, PASSPHRASE, { kid: 'bbbb' }));
});

test('v1 exports still open', async () => {
    const legacy = await legacyBundle(payload);
    assert.equal(isEncFile(legacy.enc), true);
    assert.equal(isKeyFile(legacy.keyFile), true);
    assert.equal(validateEncFile(legacy.enc).ok, true, 'v1 envelopes must stay valid');
    assert.equal(validateKeyFile(legacy.keyFile).ok, true, 'v1 key files must stay valid');
    assert.equal(kidsMatch(legacy.enc, legacy.keyFile), true);
    assert.deepEqual(await decryptBundle(legacy.enc, legacy.keyFile), payload);
});

test('v1 key material is refused for a v2 envelope', async () => {
    const { enc } = await encryptBundle(payload);
    const legacy = await legacyBundle(payload);
    await assert.rejects(() => decryptBundle(enc, legacy.keyFile));
});

test('malformed v2 envelopes are rejected before decryption', async () => {
    const { enc, keyFile } = await encryptBundle(payload);
    assert.equal(validateEncFile({ ...enc, kdf: 'PBKDF2' }).ok, false);
    assert.equal(validateEncFile({ ...enc, salt: toBase64(randomBytes(8)) }).ok, false);
    assert.equal(validateEncFile({ ...enc, commit: toBase64(randomBytes(8)) }).ok, false);
    assert.equal(validateEncFile({ ...enc, iv: toBase64(randomBytes(16)) }).ok, false);
    assert.equal(validateEncFile({ ...enc, version: 99 }).ok, false);

    assert.equal(validateKeyFile({ ...keyFile, secret: toBase64(randomBytes(16)) }).ok, false);
    assert.equal(validateKeyFile({ ...keyFile, kdf: 'nope' }).ok, false);
});

test('direct envelope APIs reject malformed binary dimensions', async () => {
    const secret = randomBytes(32);
    const enc = await sealPayload(payload, secret, { kid: 'abc' });
    const wrap = await wrapSecret(secret, PASSPHRASE, { kid: 'abc' });

    await assert.rejects(
        () => openPayload({ ...enc, iv: toBase64(randomBytes(16)) }, secret),
        /ENVELOPE_BAD_INPUT/
    );
    await assert.rejects(
        () => unwrapSecret({ ...wrap, salt: toBase64(randomBytes(8)) }, PASSPHRASE, { kid: 'abc' }),
        /ENVELOPE_BAD_WRAP/
    );
});

test('canonical json is stable regardless of key order', () => {
    assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
    assert.equal(canonicalJson({ a: { d: 1, c: 2 } }), '{"a":{"c":2,"d":1}}');
    assert.equal(canonicalJson({ a: undefined, b: 1 }), '{"b":1}');
    assert.equal(canonicalJson([3, { y: 1, x: 2 }]), '[3,{"x":2,"y":1}]');

    // The AAD covers the header but never the ciphertext itself.
    const withCt = headerAad({ a: 1, ct: 'AAAA' });
    const withoutCt = headerAad({ a: 1 });
    assert.equal(new TextDecoder().decode(withCt), new TextDecoder().decode(withoutCt));
});

test('equalBytes is length-safe and value-correct', () => {
    assert.equal(equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])), true);
    assert.equal(equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4])), false);
    assert.equal(equalBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3])), false);
    assert.equal(equalBytes(null, new Uint8Array([1])), false);
});

test('derived subkeys are independent of each other', async () => {
    const secret = randomBytes(32);
    const salt = randomBytes(32);
    const { commitment } = await deriveEnvelopeKeys(secret, salt);
    const { commitment: again } = await deriveEnvelopeKeys(secret, salt);
    assert.ok(equalBytes(commitment, again), 'derivation must be deterministic');

    const { commitment: otherSalt } = await deriveEnvelopeKeys(secret, randomBytes(32));
    assert.equal(equalBytes(commitment, otherSalt), false, 'a new salt must give a new commitment');

    // The commitment ships in the clear, so it must not open the ciphertext.
    const enc = await sealPayload(payload, secret, { kid: 'abc' });
    const asKey = await globalThis.crypto.subtle.importKey(
        'raw', (await deriveEnvelopeKeys(secret, fromBase64(enc.salt))).commitment,
        { name: 'AES-GCM' }, false, ['decrypt']
    );
    await assert.rejects(() => globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(enc.iv), tagLength: 128, additionalData: headerAad(enc) },
        asKey,
        fromBase64(enc.ct)
    ), 'the published commitment must not decrypt the payload');
});

test('a short master secret is refused', async () => {
    await assert.rejects(() => sealPayload(payload, randomBytes(16), {}), /ENVELOPE_BAD_SECRET/);
});

test('randomBytes fills past the getRandomValues call limit', () => {
    // getRandomValues throws over 65,536 bytes, so the helper must chunk.
    const big = randomBytes(200000);
    assert.equal(big.length, 200000);

    // Every chunk must actually be written, not left as zeroes.
    for (let offset = 0; offset < big.length; offset += 65536) {
        const slice = big.subarray(offset, Math.min(offset + 65536, big.length));
        assert.ok(slice.some((byte) => byte !== 0), `chunk at ${offset} was never filled`);
    }
});

test('randomBytes does not repeat itself', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(toBase64(randomBytes(32)));
    assert.equal(seen.size, 200);

    // A crude spread check: 32 random bytes should not be dominated by one value.
    const counts = new Map();
    for (const byte of randomBytes(65536)) counts.set(byte, (counts.get(byte) || 0) + 1);
    assert.equal(counts.size, 256, 'every byte value should appear across 64 KiB');
    const worst = Math.max(...counts.values());
    assert.ok(worst < 512, `byte value appeared ${worst} times, expected roughly 256`);
});

test('base64 round-trips payloads larger than one chunk', () => {
    for (const size of [0, 1, 32, 0x8000 - 1, 0x8000, 0x8000 + 1, 300000]) {
        const bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) bytes[i] = (i * 31 + 7) & 0xff;
        const back = fromBase64(toBase64(bytes));
        assert.equal(back.length, size, `length changed at ${size}`);
        assert.ok(equalBytes(back, bytes), `bytes changed at ${size}`);
    }
});

test('a large ledger seals and opens intact', async () => {
    const events = {};
    for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= 28; day++) {
            const key = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            events[key] = [{ title: `Entry ${day}`, price: 12.34, paid: true, note: 'x'.repeat(80) }];
        }
    }
    const big = { name: 'Big', events, savedAt: 1780000000000 };
    const { enc, keyFile } = await encryptBundle(big);
    assert.equal(validateEncFile(enc).ok, true);
    assert.deepEqual(await decryptBundle(enc, keyFile), big);
});

test('a ledger the app accepts can always be exported and reopened', async () => {
    // The sanitizer caps a ledger at maxEntries/maxNote, so anything inside
    // those caps has to survive a round trip. It used to export a file that
    // readJsonFile then refused as "too large to open".
    const events = {};
    let made = 0;
    let day = 0;
    const perDay = 100;
    const note = 'n'.repeat(500);
    while (made < FILE_LIMITS.maxEntries) {
        const date = new Date(Date.UTC(2015, 0, 1) + day * 86400000).toISOString().slice(0, 10);
        const count = Math.min(perDay, FILE_LIMITS.maxEntries - made);
        events[date] = Array.from({ length: count }, () => ({
            title: 'T'.repeat(40), price: 42.5, paid: true, note
        }));
        made += count;
        day++;
    }

    const { enc } = await encryptBundle({ name: 'Max', events });
    assert.equal(validateEncFile(enc).ok, true, 'the export must satisfy the import validator');

    const fileBytes = JSON.stringify(enc, null, 2).length;
    assert.ok(
        fileBytes <= FILE_LIMITS.maxBytes,
        `a ${(fileBytes / 1048576).toFixed(1)}MB export cannot be reopened under a ${(FILE_LIMITS.maxBytes / 1048576).toFixed(0)}MB limit`
    );
});

test('the same secret and salt never reuse an iv', async () => {
    const secret = randomBytes(32);
    const ivs = new Set();
    for (let i = 0; i < 25; i++) {
        const enc = await sealPayload(payload, secret, { kid: 'abc' });
        assert.equal(ivs.has(enc.iv), false, 'iv reuse under one key breaks AES-GCM');
        ivs.add(enc.iv);
    }
});

test('key material never appears in the files that get written', async () => {
    const secret = randomBytes(32);
    const enc = await sealPayload(payload, secret, { kid: 'abc' });
    const secretB64 = toBase64(secret);
    const onDisk = JSON.stringify(enc);
    assert.equal(onDisk.includes(secretB64), false, 'the envelope must not carry the secret');

    // Nor may the commitment leak it, even though it ships in the clear.
    assert.equal(enc.commit === secretB64, false);

    // With a passphrase the key file must not carry it either.
    const { keyFile } = await encryptBundle(payload, { passphrase: PASSPHRASE });
    const keyJson = JSON.stringify(keyFile);
    assert.equal(/"secret"/.test(keyJson), false);
    assert.equal(keyJson.includes(PASSPHRASE), false, 'the passphrase must never be written');
});

/* The device autosave record in IndexedDB, sealed under a non-extractable key. */

async function deviceKey() {
    return globalThis.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
}

test('autosave records round-trip and stamp their version', async () => {
    const key = await deviceKey();
    const record = await sealRecord(payload, key);
    assert.equal(record.__enc, true);
    assert.equal(record.v, 2);
    assert.equal(record.alg, 'AES-256-GCM');
    assert.equal(new Uint8Array(record.iv).length, ENVELOPE.IV_BYTES);
    assert.deepEqual(await openRecord(record, key), payload);
});

test('autosave records cannot be restamped or relabelled', async () => {
    const key = await deviceKey();
    const record = await sealRecord(payload, key, 1780000000000);
    await assert.rejects(() => openRecord({ ...record, savedAt: 1 }, key));
    await assert.rejects(() => openRecord({ ...record, alg: 'AES-128-GCM' }, key));
    await assert.rejects(() => openRecord({ ...record, v: 1 }, key));

    const otherDevice = await deviceKey();
    await assert.rejects(() => openRecord(record, otherDevice));
});

test('v1 autosave records still open without an aad', async () => {
    const key = await deviceKey();
    const iv = randomBytes(12);
    const ct = await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload))
    );
    const legacy = { __enc: true, v: 1, alg: 'AES-GCM', iv: iv.buffer, ct, savedAt: 1780000000000 };
    assert.deepEqual(await openRecord(legacy, key), payload);
});
