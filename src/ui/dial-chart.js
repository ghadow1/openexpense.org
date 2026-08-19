/**
 * OpenExpense — compact banking dials and analytical charts
 *
 * Charts keep exact values in their accessible labels while using abbreviated
 * money on the visual axes. Full-year trends retain all twelve months so a
 * seasonal spike or reversal is never replaced by a misleading straight line.
 */
import { formatAxisMoney, formatMoney } from '../core/summary.js';

const TAU = Math.PI * 2;

function svgEl(name, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
}

/**
 * @param {object} options
 * @param {number} options.value
 * @param {string} options.label
 * @param {string} [options.caption]
 * @param {number} [options.ratio]  0–1 fill of the ring
 * @param {string} [options.display]
 * @param {string} [options.className]
 */
export function createDial({
    value = 0,
    label = '',
    caption = '',
    ratio = 0,
    display = '',
    className = ''
} = {}) {
    const wrap = document.createElement('figure');
    wrap.className = ['oe-dial', className].filter(Boolean).join(' ');

    const size = 72;
    const r = 26;
    const c = TAU * r;
    const fill = Math.max(0, Math.min(1, Number(ratio) || 0));
    const svg = svgEl('svg', {
        class: 'oe-dial-svg',
        viewBox: `0 0 ${size} ${size}`,
        width: String(size),
        height: String(size),
        'aria-hidden': 'true'
    });
    const cx = size / 2;
    const cy = size / 2;
    svg.append(
        svgEl('circle', { class: 'oe-dial-track', cx, cy, r, fill: 'none' }),
        svgEl('circle', {
            class: 'oe-dial-arc',
            cx,
            cy,
            r,
            fill: 'none',
            'stroke-dasharray': `${(c * fill).toFixed(2)} ${c.toFixed(2)}`,
            transform: `rotate(-90 ${cx} ${cy})`
        })
    );

    const face = document.createElement('div');
    face.className = 'oe-dial-face';
    const amount = document.createElement('strong');
    amount.className = 'oe-dial-value';
    amount.textContent = display || formatAxisMoney(value);
    const kicker = document.createElement('span');
    kicker.className = 'oe-dial-label';
    kicker.textContent = label;
    face.append(amount, kicker);

    const ring = document.createElement('div');
    ring.className = 'oe-dial-ring';
    ring.append(svg, face);

    wrap.appendChild(ring);
    if (caption) {
        const fig = document.createElement('figcaption');
        fig.className = 'oe-dial-caption';
        fig.textContent = caption;
        wrap.appendChild(fig);
    }
    wrap.setAttribute('aria-label', `${label} ${display || formatAxisMoney(value)}${caption ? `, ${caption}` : ''}`);
    return wrap;
}

/**
 * @param {object} options
 * @param {Array<{label: string, value: number, index?: number}>} options.points
 * @param {Function} [options.onSelect]
 * @param {string} [options.ariaLabel]
 * @param {Array<{index: number, label: string, date?: string}>} [options.milestones]
 * @param {number} [options.selectedIndex]
 * @param {string} [options.focusId] Stable identity used to restore focus after rerender.
 */
export function createSpark({
    points = [],
    onSelect = null,
    ariaLabel = 'Period total',
    milestones = [],
    selectedIndex = null,
    focusId = ''
} = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'oe-spark';
    if (focusId) wrap.dataset.chartFocusId = focusId;
    wrap.setAttribute('role', typeof onSelect === 'function' ? 'group' : 'img');

    const rows = (Array.isArray(points) ? points : [])
        .slice(0, 24)
        .map((row, index) => ({
            label: String(row?.label || ''),
            value: Number.isFinite(Number(row?.value)) ? Number(row.value) : 0,
            index: Number.isInteger(row?.index) ? row.index : index
        }));
    if (!rows.length) {
        wrap.setAttribute('aria-label', ariaLabel);
        wrap.classList.add('is-empty');
        wrap.textContent = 'No movement this year.';
        return wrap;
    }
    const accessibleSeries = rows
        .map((row) => `${row.label} ${formatMoney(row.value)}`)
        .join(', ');
    wrap.setAttribute('aria-label', typeof onSelect === 'function'
        ? `${ariaLabel}. Use left and right arrow keys to choose a month.`
        : `${ariaLabel}: ${accessibleSeries}`);

    const width = 220;
    const height = 72;
    const padL = 34;
    const padR = 8;
    const padT = 8;
    const padB = 18;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const domain = chartDomain(rows.map((row) => row.value));
    const minV = domain.min;
    const maxV = domain.max;
    const span = Math.max(maxV - minV, 1);
    const ticks = domain.ticks;
    const stepX = rows.length === 1 ? 0 : plotW / (rows.length - 1);
    const usesMonthScale = rows.every((row) => Number.isInteger(row.index)
        && row.index >= 0 && row.index <= 11);

    const svg = svgEl('svg', {
        class: 'oe-spark-svg',
        viewBox: `0 0 ${width} ${height}`,
        width: '100%',
        height: String(height),
        preserveAspectRatio: 'xMidYMid meet'
    });
    svg.setAttribute('aria-hidden', 'true');

    const yOf = (value) => padT + plotH - ((value - minV) / span) * plotH;

    (Array.isArray(milestones) ? milestones : []).forEach((milestone) => {
        const monthIndex = Math.max(0, Math.min(11, Number(milestone?.index) || 0));
        const x = padL + (monthIndex / 11) * plotW;
        const line = svgEl('line', {
            class: 'oe-spark-milestone',
            x1: x,
            x2: x,
            y1: padT,
            y2: height - padB
        });
        const title = svgEl('title');
        title.textContent = `${milestone.label || 'Goal'}${milestone.date ? ` — ${milestone.date}` : ''}`;
        line.appendChild(title);
        svg.appendChild(line);
    });

    ticks.forEach((tick) => {
        const y = yOf(tick);
        svg.appendChild(svgEl('line', {
            class: 'oe-spark-grid',
            x1: padL,
            x2: width - padR,
            y1: y,
            y2: y
        }));
        const label = svgEl('text', {
            class: 'oe-spark-y',
            x: padL - 4,
            y: y + 3,
            'text-anchor': 'end'
        });
        label.textContent = formatAxisMoney(tick);
        svg.appendChild(label);
    });

    const coords = rows.map((row, i) => {
        const x = padL + (usesMonthScale ? (row.index / 11) * plotW : i * stepX);
        const y = yOf(row.value);
        return { ...row, x, y };
    });

    if (coords.length > 1) {
        const d = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
        const baseline = yOf(0).toFixed(1);
        const area = `${d} L${coords[coords.length - 1].x.toFixed(1)} ${baseline} L${coords[0].x.toFixed(1)} ${baseline} Z`;
        svg.appendChild(svgEl('path', { class: 'oe-spark-area', d: area }));
        svg.appendChild(svgEl('path', { class: 'oe-spark-line', d, fill: 'none' }));
    }

    coords.forEach((pt, index) => {
        const dot = svgEl('circle', {
            class: `oe-spark-dot${pt.index === selectedIndex ? ' is-current' : ''}`,
            cx: pt.x,
            cy: pt.y,
            r: pt.index === selectedIndex ? 4 : 2.5
        });
        svg.appendChild(dot);
        if (!showXLabel(index, coords.length)) return;
        const xLabel = svgEl('text', {
            class: 'oe-spark-x',
            x: pt.x,
            y: height - 4,
            'text-anchor': iCenter(pt, coords)
        });
        xLabel.textContent = shortLabel(pt.label);
        svg.appendChild(xLabel);
    });

    wrap.appendChild(svg);

    if (typeof onSelect === 'function') {
        wrap.classList.add('is-pickable');
        const activePosition = Math.max(0, coords.findIndex((pt) => pt.index === selectedIndex));
        const hitWidth = plotW / Math.max(1, coords.length);
        const selectPoint = (pt, index) => {
            onSelect(pt, index);
            if (!focusId || typeof window === 'undefined') return;
            window.requestAnimationFrame(() => {
                const chart = [...document.querySelectorAll('[data-chart-focus-id]')]
                    .find((candidate) => candidate.dataset.chartFocusId === focusId);
                chart?.querySelector('.oe-spark-hit[aria-current="date"]')?.focus({ preventScroll: true });
            });
        };
        coords.forEach((pt, i) => {
            const hit = document.createElement('button');
            hit.type = 'button';
            hit.className = 'oe-spark-hit';
            hit.style.left = `${((pt.x - hitWidth / 2) / width) * 100}%`;
            hit.style.width = `${(hitWidth / width) * 100}%`;
            hit.setAttribute('aria-label', `${pt.label}: ${formatMoney(pt.value)}`);
            if (pt.index === selectedIndex) hit.setAttribute('aria-current', 'date');
            hit.tabIndex = i === activePosition ? 0 : -1;
            hit.addEventListener('click', () => selectPoint(pt, i));
            hit.addEventListener('keydown', (event) => {
                let next = null;
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, i - 1);
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(coords.length - 1, i + 1);
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = coords.length - 1;
                if (next == null || next === i) return;
                event.preventDefault();
                const target = wrap.querySelectorAll('.oe-spark-hit')[next];
                target.tabIndex = 0;
                hit.tabIndex = -1;
                target.focus();
                selectPoint(coords[next], next);
            });
            wrap.appendChild(hit);
        });
    }

    return wrap;
}

/**
 * A few labelled bars sharing one scale. Used beside the dial on a wide screen,
 * where there is room for the split behind the headline figure.
 *
 * @param {object} options
 * @param {Array<{label: string, value: number, target?: number}>} options.rows
 * @param {string} [options.ariaLabel]
 */
export function createBars({ rows = [], ariaLabel = 'Breakdown' } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'oe-bars';
    wrap.setAttribute('role', 'img');

    const live = rows.filter((row) => row && row.label);
    const max = Math.max(...live.flatMap((row) => [
        Math.abs(Number(row.value) || 0),
        Math.abs(Number(row.target) || 0)
    ]), 1);

    wrap.setAttribute('aria-label', `${ariaLabel}: ${live
        .map((row) => {
            const target = Number(row.target);
            return `${row.label} ${formatMoney(row.value)}${Number.isFinite(target) ? ` of ${formatMoney(target)}` : ''}`;
        })
        .join(', ')}`);

    live.forEach((row) => {
        const value = Number(row.value) || 0;
        const line = document.createElement('div');
        line.className = 'oe-bar';

        const label = document.createElement('span');
        label.className = 'oe-bar-label';
        label.textContent = row.label;

        const track = document.createElement('span');
        track.className = 'oe-bar-track';
        const fill = document.createElement('span');
        fill.className = 'oe-bar-fill';
        fill.style.width = value === 0
            ? '0%'
            : `${Math.max(2, (Math.abs(value) / max) * 100)}%`;
        track.appendChild(fill);
        const target = Number(row.target);
        if (Number.isFinite(target) && target >= 0) {
            line.classList.add('has-target');
            if (value > target) line.classList.add('is-over');
            const marker = document.createElement('span');
            marker.className = 'oe-bar-target';
            marker.style.left = `${Math.min(100, (target / max) * 100)}%`;
            marker.title = `Target ${formatMoney(target)}`;
            track.appendChild(marker);
        }

        const amount = document.createElement('span');
        amount.className = 'oe-bar-value';
        amount.textContent = formatAxisMoney(value);

        line.append(label, track, amount);
        wrap.appendChild(line);
    });

    return wrap;
}

function iCenter(pt, coords) {
    if (pt === coords[0]) return 'start';
    if (pt === coords[coords.length - 1]) return 'end';
    return 'middle';
}

function shortLabel(label) {
    const text = String(label || '');
    return text.length <= 3 ? text : text.slice(0, 3);
}

function showXLabel(index, count) {
    if (count <= 6) return true;
    return index === 0 || index === count - 1 || index % 3 === 0;
}

function niceCeiling(value) {
    const n = Math.abs(Number(value) || 0);
    if (n <= 0) return 0;
    const magnitude = 10 ** Math.floor(Math.log10(n));
    const normalized = n / magnitude;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return step * magnitude;
}

function chartDomain(values) {
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);
    if (rawMin === 0 && rawMax === 0) return { min: 0, max: 1, ticks: [0] };
    const min = rawMin < 0 ? -niceCeiling(Math.abs(rawMin)) : 0;
    const max = rawMax > 0 ? niceCeiling(rawMax) : 0;
    const ticks = [...new Set([min, 0, max])].sort((a, b) => a - b);
    return { min, max: max === min ? min + 1 : max, ticks };
}
