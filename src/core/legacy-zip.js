/**
 * Legacy ZIP backup compatibility.
 *
 * Current exports are a pair of JSON files. Keeping ZIP support isolated lets
 * the app load its codec only when an older backup is actually imported.
 */
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { BUNDLE, ZIP_LIMITS } from './bundle-format.js';

export function zipBundle(enc, keyFile) {
    const files = {
        [BUNDLE.ENC_NAME]: strToU8(JSON.stringify(enc, null, 2)),
        [BUNDLE.KEY_NAME]: strToU8(JSON.stringify(keyFile, null, 2)),
        [BUNDLE.README_NAME]: strToU8(
            'OpenExpense encrypted export\n' +
            '================================\n\n' +
            `${BUNDLE.ENC_NAME}  - your ledger, encrypted with AES-256-GCM.\n` +
            `${BUNDLE.KEY_NAME}  - the key needed to decrypt it.\n\n` +
            'To restore: open openexpense.org and use Import. Prefer the two JSON\n' +
            'files saved next to each other (encrypted ledger.json + key.json).\n' +
            'This zip is a legacy bundle of the same pair.\n\n' +
            'The portable key is only in key.json. OpenExpense does not keep it\n' +
            'in the browser. Without a passphrase, anyone with BOTH files can\n' +
            'read the ledger. With one, key.json is useless on its own.\n'
        )
    };
    return zipSync(files, { level: 6 });
}

export function unzipBundle(u8) {
    if (!(u8 instanceof Uint8Array) || u8.byteLength > ZIP_LIMITS.maxCompressedBytes) {
        throw new Error('ZIP_TOO_LARGE');
    }
    let count = 0;
    let expectedBytes = 0;
    const entries = unzipSync(u8, {
        filter(file) {
            count += 1;
            const size = Number(file?.originalSize ?? 0);
            expectedBytes += size;
            if (count > ZIP_LIMITS.maxEntries
                || size > ZIP_LIMITS.maxEntryBytes
                || expectedBytes > ZIP_LIMITS.maxExpandedBytes) {
                throw new Error('ZIP_EXPANSION_LIMIT');
            }
            return true;
        }
    });
    const out = {};
    let expandedBytes = 0;
    for (const name of Object.keys(entries)) {
        expandedBytes += entries[name].byteLength;
        if (entries[name].byteLength > ZIP_LIMITS.maxEntryBytes
            || expandedBytes > ZIP_LIMITS.maxExpandedBytes) {
            throw new Error('ZIP_EXPANSION_LIMIT');
        }
        out[name] = entries[name];
    }
    return out;
}

export function entryToJson(u8) {
    if (!u8) return null;
    try {
        return JSON.parse(strFromU8(u8));
    } catch {
        return null;
    }
}
