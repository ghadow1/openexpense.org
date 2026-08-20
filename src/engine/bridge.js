/**
 * OpenExpense — parent-frame message bridge
 *
 * Cross-origin postMessage is embed-only. The default wallet never binds,
 * even if allowOrigin() is called. Parent origin must be https (or local http).
 */
const HELLO = 'oe:hello';
const GET = 'oe:get';
const SET = 'oe:set';
const IMPORT = 'oe:import';
const SNAPSHOT = 'oe:snapshot';

export function isEmbedMode() {
    try {
        const path = String(location.pathname || '');
        if (/embed\.html$/i.test(path)) return true;
        return new URLSearchParams(location.search).get('embed') === '1';
    } catch {
        return false;
    }
}

/**
 * Accept a host origin string. Paths, queries, and fragments are dropped.
 * Wildcards, credentials, and non-https remote schemes are rejected.
 */
export function normalizeParentOrigin(value) {
    if (value == null) return '';
    const raw = String(value).trim();
    if (!raw || raw === '*' || raw.toLowerCase() === 'null') return '';
    let url;
    try {
        url = new URL(raw);
    } catch {
        return '';
    }
    if (url.username || url.password) return '';
    if (!url.origin || url.origin === 'null') return '';
    const host = String(url.hostname || '');
    if (!host || host.includes('*')) return '';
    const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (url.protocol === 'https:') return url.origin;
    if (url.protocol === 'http:' && local) return url.origin;
    return '';
}

function allowedOrigin(explicit) {
    const fromExplicit = normalizeParentOrigin(explicit);
    if (fromExplicit) return fromExplicit;
    try {
        return normalizeParentOrigin(new URLSearchParams(location.search).get('origin'));
    } catch (_) { }
    return '';
}

function reply(source, origin, payload) {
    if (!source || !origin || origin === 'null') return;
    source.postMessage({ channel: 'openexpense', ...payload }, origin);
}

export function bindHostBridge(api, origin) {
    if (window.__oeBridgeBound) return;
    if (!isEmbedMode()) return;
    const allow = allowedOrigin(origin);
    if (!allow) return;
    window.__oeBridgeBound = true;

    window.addEventListener('message', (event) => {
        if (event.origin !== allow) return;
        const data = event.data;
        if (!data || data.channel !== 'openexpense') return;
        try {
            switch (data.type) {
                case HELLO:
                    reply(event.source, event.origin, { type: 'oe:ready', version: api.version });
                    break;
                case GET:
                    reply(event.source, event.origin, { type: 'oe:state', ledger: api.get() });
                    break;
                case SET:
                    reply(event.source, event.origin, { type: 'oe:state', ledger: api.set(data.ledger) });
                    break;
                case IMPORT:
                    reply(event.source, event.origin, { type: 'oe:state', ledger: api.importTransactions(data.transactions) });
                    break;
                case SNAPSHOT:
                    reply(event.source, event.origin, { type: 'oe:snapshot', snapshot: api.getSnapshot(data.date) });
                    break;
                default:
                    break;
            }
        } catch (err) {
            reply(event.source, event.origin, { type: 'oe:error', error: 'request failed' });
            console.error('[OpenExpense] host bridge:', err);
        }
    });
}
