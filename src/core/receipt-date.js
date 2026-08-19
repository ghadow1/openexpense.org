/**
 * Resolve the date shown after OCR, including day-sheet scan context.
 */
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function validDateKey(value) {
    const key = String(value || '');
    if (!DATE_KEY.test(key)) return '';
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day
        ? key
        : '';
}

export function receiptDateContext({ detectedDate, intendedDate, today } = {}) {
    const detected = validDateKey(detectedDate);
    const intended = validDateKey(intendedDate);
    const fallback = validDateKey(today);
    return {
        detectedDate: detected,
        intendedDate: intended,
        mismatch: !!(detected && intended && detected !== intended),
        initialDate: detected || intended || fallback
    };
}
