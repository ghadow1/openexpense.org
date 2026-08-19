/**
 * Portable-ledger format markers and cheap type guards.
 *
 * This module deliberately has no compression dependency. Validation and app
 * startup can inspect backup files without loading the legacy ZIP codec.
 */
import { ENVELOPE } from './envelope.js';

export const BUNDLE = {
    ENC_NAME: 'ledger.enc.json',
    KEY_NAME: 'ledger.key.json',
    README_NAME: 'README.txt',
    ENC_FORMAT: 'openexpense-encrypted',
    KEY_FORMAT: 'openexpense-key',
    VERSION: ENVELOPE.VERSION,
    LEGACY_VERSION: 1
};

export const ZIP_LIMITS = {
    maxCompressedBytes: 8 * 1024 * 1024,
    maxExpandedBytes: 16 * 1024 * 1024,
    maxEntryBytes: 8 * 1024 * 1024,
    maxEntries: 8
};

export function needsPassphrase(keyFile) {
    return !!keyFile && typeof keyFile === 'object'
        && !!keyFile.wrap && typeof keyFile.wrap === 'object';
}

export function isEncFile(obj) {
    return !!obj && typeof obj === 'object'
        && (obj.format === BUNDLE.ENC_FORMAT || (typeof obj.iv === 'string' && typeof obj.ct === 'string'));
}

export function isKeyFile(obj) {
    return !!obj && typeof obj === 'object'
        && (obj.format === BUNDLE.KEY_FORMAT
            || typeof obj.secret === 'string'
            || (obj.wrap && typeof obj.wrap === 'object')
            || (obj.kty && obj.k)
            || (obj.key && obj.key.kty));
}
