/**
 * Quality-control checks for encrypted ledger.json + key.json.
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    sanitizeLedger, sanitizeEntry, sanitizePlan, validateEncFile, validateKeyFile,
    kidsMatch, wipeKeyFile, classifyJson, countEntries, exportFilenames,
    stableExportFilenames, matchLedgerPairNames, isValidDateKey, readJsonFile, FILE_LIMITS
} from '../src/core/ledger-file.js';
import { shouldShowNotFound } from '../src/core/routes.js';
import { encryptBundle, decryptBundle, unzipBundle, ZIP_LIMITS } from '../src/core/bundle.js';
import { normalizeRepeat, nextOccurrenceKey, seriesCopyCount, repeatLabel } from '../src/core/series.js';
import { zipSync } from 'fflate';

const sample = {
    name: 'Home ledger',
    events: {
        '2026-06-01': [
            { title: 'Rent', price: 1450, recurring: true, repeat: 'monthly', paid: true },
            { title: 'Paycheck', price: 3200, kind: 'income', recurring: true, repeat: 'monthly', paid: true }
        ],
        '2026-02-31': [{ title: 'Impossible day', price: 1 }],
        __proto__: [{ title: 'pollute', price: 1 }],
        constructor: [{ title: 'nope', price: 1 }]
    },
    extra: 'drop-me'
};

test('one file keeps expense and income', () => {
    const cleaned = sanitizeLedger(sample);
    assert.equal(cleaned.name, 'Home ledger');
    assert.equal(cleaned.events['2026-06-01'].length, 2);
    assert.equal(cleaned.events['2026-06-01'][0].kind, undefined);
    assert.equal(cleaned.events['2026-06-01'][1].kind, 'income');
    assert.equal(countEntries(cleaned.events), 2);
});

test('sanitize drops invalid dates and prototype keys', () => {
    const poisoned = { name: 'X', events: { '2026-06-01': [{ title: 'Ok', price: 1 }] } };
    Object.defineProperty(poisoned.events, '__proto__', { value: [{ title: 'bad', price: 1 }], enumerable: true });
    Object.defineProperty(poisoned.events, 'constructor', { value: [{ title: 'nope', price: 1 }], enumerable: true });
    const cleaned = sanitizeLedger({ ...sample, events: { ...sample.events, ...poisoned.events } });
    assert.equal(cleaned.events['2026-02-31'], undefined);
    assert.equal(Object.hasOwn(cleaned.events, '__proto__'), false);
    assert.equal(Object.hasOwn(cleaned.events, 'constructor'), false);
    assert.equal(cleaned.events['2026-06-01'][0].title, 'Ok');
});

test('sanitizeEntry drops unknown fields and empty titles', () => {
    assert.equal(sanitizeEntry({ title: '  ', price: 3 }), null);
    const row = sanitizeEntry({
        title: 'Coffee',
        price: 4.5,
        note: 'x'.repeat(5000),
        kind: 'income',
        paid: true,
        evil: '<script>',
        __proto__: { admin: true }
    });
    assert.equal(row.title, 'Coffee');
    assert.equal(row.price, 4.5);
    assert.equal(row.kind, 'income');
    assert.equal(row.note.length, FILE_LIMITS.maxNote);
    assert.equal(row.evil, undefined);
    assert.equal(sanitizeEntry({ title: 'Refund', price: -5 }), null);
    assert.equal(sanitizeEntry({ title: 'Half cent', price: 1.005 }).price, 1.01);
    assert.equal(
        sanitizeEntry({
            title: 'Rent',
            recurring: true,
            repeat: 'monthly',
            seriesId: 'ABCDEF0123456789ABCDEF0123456789'
        }).seriesId,
        'abcdef0123456789abcdef0123456789'
    );
});

test('portable key validation requires exactly 256 bits', () => {
    const base = {
        format: 'openexpense-key',
        version: 1,
        kid: '0123456789abcdef0123456789abcdef',
        alg: 'AES-GCM'
    };
    const weak = {
        ...base,
        key: { kty: 'oct', k: Buffer.alloc(16).toString('base64url'), alg: 'A128GCM' }
    };
    const strong = {
        ...base,
        key: { kty: 'oct', k: Buffer.alloc(32).toString('base64url'), alg: 'A256GCM' }
    };
    assert.equal(validateKeyFile(weak).ok, false);
    assert.equal(validateKeyFile(strong).ok, true);
});

test('ZIP import rejects entries that expand beyond the per-entry cap', () => {
    const oversized = new Uint8Array(ZIP_LIMITS.maxEntryBytes + 1);
    const zipped = zipSync({ 'ledger.json': oversized }, { level: 9 });
    assert.ok(zipped.byteLength < ZIP_LIMITS.maxCompressedBytes);
    assert.throws(() => unzipBundle(zipped), /ZIP_EXPANSION_LIMIT/);
});

test('isValidDateKey rejects non-calendar days', () => {
    assert.equal(isValidDateKey('2026-06-01'), true);
    assert.equal(isValidDateKey('2026-02-31'), false);
    assert.equal(isValidDateKey('__proto__'), false);
});

test('classifyJson recognizes enc, key, and plaintext', async () => {
    const { enc, keyFile } = await encryptBundle({ name: 'A', events: { '2026-06-01': [{ title: 'X', price: 1 }] } });
    assert.equal(classifyJson(enc), 'enc');
    assert.equal(classifyJson(keyFile), 'key');
    assert.equal(classifyJson({ name: 'A', events: { '2026-06-01': [] } }), 'plaintext');
    assert.equal(classifyJson({ foo: 1 }), 'unknown');
});

test('encrypt / decrypt roundtrip reuses the same pair', async () => {
    const payload = sanitizeLedger(sample);
    const { enc, keyFile } = await encryptBundle(payload);
    assert.equal(validateEncFile(enc).ok, true);
    assert.equal(validateKeyFile(keyFile).ok, true);
    assert.equal(kidsMatch(enc, keyFile), true);
    const opened = sanitizeLedger(await decryptBundle(enc, keyFile));
    assert.equal(opened.events['2026-06-01'][1].kind, 'income');
    assert.equal(opened.events['2026-06-01'][0].title, 'Rent');
});

test('encrypted roundtrip preserves goal priority and optional amounts', async () => {
    const payload = sanitizeLedger({
        ...sample,
        goals: [
            {
                id: '11111111111111111111111111111111',
                title: 'First',
                targetDate: '2027-01-01',
                targetAmount: 100,
                createdAt: 1
            },
            {
                id: '22222222222222222222222222222222',
                title: 'Second',
                targetDate: '2027-02-01',
                createdAt: 2
            }
        ]
    });
    const { enc, keyFile } = await encryptBundle(payload);
    const opened = sanitizeLedger(await decryptBundle(enc, keyFile));
    assert.deepEqual(opened.goals.map((goal) => goal.title), ['First', 'Second']);
    assert.equal(opened.goals[0].targetAmount, 100);
    assert.equal(opened.goals[1].targetAmount, undefined);
});

test('wrong key or mismatched kid is refused', async () => {
    const a = await encryptBundle({ name: 'A', events: { '2026-06-01': [{ title: 'A', price: 1 }] } });
    const b = await encryptBundle({ name: 'B', events: { '2026-06-01': [{ title: 'B', price: 2 }] } });
    assert.equal(kidsMatch(a.enc, b.keyFile), false);
    await assert.rejects(() => decryptBundle(a.enc, b.keyFile));
});

test('wipeKeyFile removes portable key material', async () => {
    const { keyFile } = await encryptBundle({ name: 'A', events: {} });
    assert.ok(keyFile.secret.length > 10);
    wipeKeyFile(keyFile);
    assert.equal(keyFile.secret, undefined);

    const wrapped = await encryptBundle({ name: 'A', events: {} }, { passphrase: 'open sesame please' });
    assert.ok(wrapped.keyFile.wrap.ct.length > 10);
    wipeKeyFile(wrapped.keyFile);
    assert.equal(wrapped.keyFile.wrap.ct, undefined);

    // v1 key files are JWK-shaped and must still be scrubbed.
    const legacy = { key: { kty: 'oct', k: 'AAAAAAAAAAAAAAAAAAAAAA' } };
    wipeKeyFile(legacy);
    assert.equal(legacy.key.k, undefined);
});

test('export filenames are a sibling pair', () => {
    const names = exportFilenames('Home ledger');
    assert.match(names.ledger, /^Home ledger-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(names.key, names.ledger.replace(/\.json$/, '.key.json'));
});

test('linked-folder save uses a stable pair and overwrites the existing JSON', () => {
    const stable = stableExportFilenames('Home ledger');
    assert.equal(stable.ledger, 'Home ledger.json');
    assert.equal(stable.key, 'Home ledger.key.json');
    assert.equal(matchLedgerPairNames([], 'Home ledger').ledger, 'Home ledger.json');
    assert.equal(matchLedgerPairNames(['Home ledger.json'], 'Home ledger').ledger, 'Home ledger.json');
    assert.equal(
        matchLedgerPairNames(['Home ledger-2026-08-01.json', 'Home ledger-2026-08-17.json'], 'Home ledger').ledger,
        'Home ledger-2026-08-17.json'
    );
    assert.equal(
        matchLedgerPairNames(['Home ledger.json', 'Home ledger-2026-08-17.json'], 'Home ledger').ledger,
        'Home ledger.json'
    );
});

test('unknown public paths are 404; the homepage is not', () => {
    assert.equal(shouldShowNotFound('/'), false);
    assert.equal(shouldShowNotFound('/index.html'), false);
    assert.equal(shouldShowNotFound('/404.html'), false);
    assert.equal(shouldShowNotFound('/app.js'), false);
    assert.equal(shouldShowNotFound('/docs'), true);
    assert.equal(shouldShowNotFound('/privacy'), true);
    assert.equal(shouldShowNotFound('/missing/page'), true);
});

test('weekly cadence copies the same weekday', () => {
    assert.equal(normalizeRepeat('weekly'), 'weekly');
    assert.equal(normalizeRepeat('week'), 'weekly');
    assert.equal(repeatLabel('weekly'), 'Weekly');
    assert.equal(seriesCopyCount('weekly'), 52);
    assert.equal(nextOccurrenceKey('2026-08-17', 'weekly', 1), '2026-08-24');
    assert.equal(nextOccurrenceKey('2026-08-17', 'weekly', 2), '2026-08-31');
    assert.equal(sanitizeEntry({ title: 'Paycheck', kind: 'income', recurring: true, repeat: 'weekly' }).repeat, 'weekly');
});

test('sanitizeLedger keeps a non-default plan and drops the default', () => {
    const withPlan = sanitizeLedger({
        name: 'Home ledger',
        events: sample.events,
        plan: { weeklySavings: 50, spendBasis: 'paid', incomeBasis: 'scheduled', reserveSavings: false }
    });
    assert.deepEqual(withPlan.plan, {
        weeklySavings: 50,
        weeklyIncome: 0,
        reserveSavings: false,
        spendBasis: 'paid',
        incomeBasis: 'scheduled',
        taxWithholdPct: 0,
        savingsPct: 0,
        savingsFixed: 0,
        currentSavings: 0,
        ratioNeeds: 50,
        ratioWants: 30,
        ratioSave: 20
    });

    const defaultPlan = sanitizeLedger({
        name: 'Home ledger',
        events: sample.events,
        plan: { weeklySavings: 0, spendBasis: 'logged', incomeBasis: 'deposited' }
    });
    assert.equal(defaultPlan.plan, undefined);

    const junk = sanitizePlan({ weeklySavings: -12, spendBasis: 'maybe', incomeBasis: null, reserveSavings: 'no' });
    assert.deepEqual(junk, {
        weeklySavings: 0,
        weeklyIncome: 0,
        reserveSavings: true,
        spendBasis: 'logged',
        incomeBasis: 'deposited',
        taxWithholdPct: 0,
        savingsPct: 0,
        savingsFixed: 0,
        currentSavings: 0,
        ratioNeeds: 50,
        ratioWants: 30,
        ratioSave: 20
    });
});

test('sanitizeLedger keeps bounded savings goals in priority order', () => {
    const cleaned = sanitizeLedger({
        name: 'Goal ledger',
        events: sample.events,
        goals: [
            {
                id: '11111111111111111111111111111111',
                title: ' Emergency   fund ',
                targetDate: '2027-01-15',
                targetAmount: 2500.125,
                createdAt: 1,
                remoteId: 'drop'
            },
            { title: 'Impossible date', targetDate: '2027-02-31', targetAmount: 5 }
        ]
    });
    assert.deepEqual(cleaned.goals, [{
        id: '11111111111111111111111111111111',
        title: 'Emergency fund',
        targetDate: '2027-01-15',
        targetAmount: 2500.13,
        createdAt: 1
    }]);
});

test('readJsonFile rejects oversized and invalid files', async () => {
    const huge = { size: FILE_LIMITS.maxBytes + 1, text: async () => '' };
    const tooBig = await readJsonFile(huge);
    assert.equal(tooBig.ok, false);

    const bad = { size: 12, text: async () => 'not-json' };
    const invalid = await readJsonFile(bad);
    assert.equal(invalid.ok, false);

    const okFile = { size: 20, text: async () => '{"format":"x"}' };
    const parsed = await readJsonFile(okFile);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.obj.format, 'x');
});
