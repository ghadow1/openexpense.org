/**
 * OpenExpense — layout frames
 *
 * Phone, tablet, and desktop are three snapped views, not a fluid in-between.
 * Phone is the stacked Overview the user asked to keep. Desktop is the compact
 * dial strip beside the calendar from this morning. Tablet is its own middle
 * snap so an iPad does not inherit a squeezed desktop or a stretched phone.
 */
export const FRAMES = ['phone', 'tablet', 'desktop'];

export const FRAME_QUERIES = {
    phone: '(max-width: 720px)',
    tablet: '(min-width: 721px) and (max-width: 1099px)',
    desktop: '(min-width: 1100px)'
};

function media(query) {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia(query);
}

export function readFrame() {
    if (media(FRAME_QUERIES.phone)?.matches) return 'phone';
    if (media(FRAME_QUERIES.tablet)?.matches) return 'tablet';
    if (media(FRAME_QUERIES.desktop)?.matches) return 'desktop';
    return 'desktop';
}

export function applyFrame(frame) {
    const next = FRAMES.includes(frame) ? frame : readFrame();
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.frame = next;
    }
    return next;
}

let bound = false;

export function bootFrame(onChange) {
    const first = applyFrame();
    if (bound || typeof window === 'undefined') return first;
    bound = true;

    const notify = () => {
        const prev = typeof document !== 'undefined' ? document.documentElement.dataset.frame : '';
        const next = applyFrame();
        if (next !== prev) onChange?.(next);
    };

    for (const query of Object.values(FRAME_QUERIES)) {
        media(query)?.addEventListener?.('change', notify);
    }
    return first;
}
