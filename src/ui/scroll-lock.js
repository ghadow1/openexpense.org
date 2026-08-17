/**
 * OpenExpense — body scroll lock
 *
 * iOS Safari keeps rubber-banding the page behind a sheet unless the body
 * is position-fixed. Nested dialogs (confirm over the day editor) share one
 * lock count so unlocking the top layer does not release the page too soon.
 */
let locks = 0;
let scrollY = 0;

export function lockBodyScroll() {
    if (locks === 0) {
        scrollY = window.scrollY || window.pageYOffset || 0;
        document.documentElement.classList.add('oe-scroll-lock');
        document.body.style.top = `-${scrollY}px`;
    }
    locks += 1;
}

export function unlockBodyScroll() {
    locks = Math.max(0, locks - 1);
    if (locks > 0) return;
    document.documentElement.classList.remove('oe-scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
}
