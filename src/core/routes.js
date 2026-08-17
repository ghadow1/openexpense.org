/**
 * OpenExpense — public paths
 *
 * The product has two in-app views (Expenses, Privacy & Help) on the homepage.
 * Any other URL is a missing page and should serve 404.html.
 */
const STATIC_LEAF = /^(index\.html|404\.html)$/i;
const STATIC_ASSET = /\.(js|css|json|xml|txt|svg|png|jpe?g|webp|ico|webmanifest|map)$/i;

export function shouldShowNotFound(pathname = '/') {
    const parts = String(pathname || '/').split('/').filter(Boolean);
    if (parts.length === 0) return false;
    const leaf = parts[parts.length - 1];
    if (STATIC_LEAF.test(leaf)) return false;
    if (parts.length === 1 && STATIC_ASSET.test(leaf)) return false;
    return true;
}
