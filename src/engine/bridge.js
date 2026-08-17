/**
 * OpenExpense — parent-frame message bridge
 *
 * Off unless embed mode or allowOrigin() is called. Origin must match.
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

function allowedOrigin(explicit) {
    if (explicit && explicit !== '*') return explicit;
    try {
        const fromQuery = new URLSearchParams(location.search).get('origin');
        if (fromQuery && fromQuery !== '*') return fromQuery;
    } catch (_) { }
    return '';
}

function reply(source, origin, payload) {
    if (!source || !origin || origin === 'null') return;
    source.postMessage({ channel: 'openexpense', ...payload }, origin);
}

export function bindHostBridge(api, origin) {
    if (window.__oeBridgeBound) return;
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
