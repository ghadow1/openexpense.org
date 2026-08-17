/**
 * OpenExpense — pointer drag helpers
 *
 * Thresholded pointer capture so a tap still clicks and a short move
 * becomes a drag. Used by the day list and calendar chips. No library.
 */

const THRESHOLD = 7;

export function dayCellFromPoint(x, y) {
    if (typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') return null;
    const el = document.elementFromPoint(x, y);
    return el?.closest?.('.cal-day[data-date]') || null;
}

export function bindThresholdDrag(el, { onDragStart, onDragMove, onDragEnd, threshold = THRESHOLD } = {}) {
    if (!el || el.dataset.thresholdDrag === '1') return;
    el.dataset.thresholdDrag = '1';

    el.addEventListener('pointerdown', (event) => {
        if (event.button != null && event.button !== 0) return;
        if (event.target.closest('button, input, textarea, label, a, select')) return;

        const originX = event.clientX;
        const originY = event.clientY;
        let dragging = false;
        let moved = false;

        const move = (ev) => {
            const dx = ev.clientX - originX;
            const dy = ev.clientY - originY;
            if (!dragging && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
                dragging = true;
                moved = true;
                try { el.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
                onDragStart?.(ev, { originX, originY });
            }
            if (dragging) onDragMove?.(ev);
        };

        const end = (ev) => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', end, true);
            window.removeEventListener('pointercancel', end, true);
            if (dragging) onDragEnd?.(ev, { moved });
        };

        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', end, true);
        window.addEventListener('pointercancel', end, true);
    });
}

export function placeGhost(ghost, clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = `${clientX + 10}px`;
    ghost.style.top = `${clientY + 10}px`;
}

export function makeGhost(text) {
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = text;
    ghost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ghost);
    return ghost;
}

export function clearDropMarks(root, selector) {
    (root || document).querySelectorAll(selector).forEach((node) => {
        node.classList.remove('is-drop-target', 'is-drop-before', 'is-dragging');
    });
}
