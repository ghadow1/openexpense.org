/**
 * OpenExpense — small banking dial and three-point spark
 *
 * One circle for the period total, and a line that only plots start, end,
 * and a single peak or valley. Axes stay short: $5k, $10k.
 */
import { formatAxisMoney } from '../core/summary.js';

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
 */
export function createSpark({
    points = [],
    onSelect = null,
    ariaLabel = 'Period total',
    milestones = []
} = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'oe-spark';
    wrap.setAttribute('role', typeof onSelect === 'function' ? 'group' : 'img');
    wrap.setAttribute('aria-label', ariaLabel);

    const rows = points.slice(0, 3);
    if (!rows.length) {
        wrap.classList.add('is-empty');
        wrap.textContent = 'No movement this year.';
        return wrap;
    }

    const width = 220;
    const height = 72;
    const padL = 34;
    const padR = 8;
    const padT = 8;
    const padB = 18;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const values = rows.map((row) => row.value);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(0, ...values);
    const span = Math.max(maxV - minV, 1);
    const ticks = (minV === 0 && maxV === 0) ? [0] : [minV, maxV];
    const stepX = rows.length === 1 ? 0 : plotW / (rows.length - 1);

    const svg = svgEl('svg', {
        class: 'oe-spark-svg',
        viewBox: `0 0 ${width} ${height}`,
        width: '100%',
        height: String(height),
        preserveAspectRatio: 'xMidYMid meet'
    });
    if (typeof onSelect === 'function') svg.setAttribute('aria-hidden', 'true');

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
        const x = padL + i * stepX;
        const y = yOf(row.value);
        return { ...row, x, y };
    });

    if (coords.length > 1) {
        const d = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
        svg.appendChild(svgEl('path', { class: 'oe-spark-line', d, fill: 'none' }));
    }

    coords.forEach((pt) => {
        const dot = svgEl('circle', {
            class: 'oe-spark-dot',
            cx: pt.x,
            cy: pt.y,
            r: 3.5
        });
        svg.appendChild(dot);
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
        coords.forEach((pt, i) => {
            const hit = document.createElement('button');
            hit.type = 'button';
            hit.className = 'oe-spark-hit';
            hit.style.left = `${((pt.x - 10) / width) * 100}%`;
            hit.setAttribute('aria-label', `${pt.label}: ${formatAxisMoney(pt.value)}`);
            hit.addEventListener('click', () => onSelect(pt, i));
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
 * @param {Array<{label: string, value: number}>} options.rows
 * @param {string} [options.ariaLabel]
 */
export function createBars({ rows = [], ariaLabel = 'Breakdown' } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'oe-bars';
    wrap.setAttribute('role', 'img');

    const live = rows.filter((row) => row && row.label);
    const max = Math.max(...live.map((row) => Math.abs(Number(row.value) || 0)), 1);

    wrap.setAttribute('aria-label', `${ariaLabel}: ${live
        .map((row) => `${row.label} ${formatAxisMoney(row.value)}`)
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
