/**
 * Black Card is meant to be black, greys and white only. Colour creeps back in
 * one convenient hex at a time, so these read the palette in config.js and the
 * dark rules in the stylesheet and insist every literal is neutral.
 *
 * A colour is neutral when its channels are equal: #3a3a3a passes, #7dd3fc does
 * not. Alpha is ignored, since it changes weight and not hue.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { THEMES } from '../src/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'openexpense.css'), 'utf8');

const HEX = /#([0-9a-fA-F]{3,8})\b/g;
const FUNC = /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/g;

function hexChannels(raw) {
    const short = raw.length === 3 || raw.length === 4;
    const size = short ? 1 : 2;
    const part = i => {
        const slice = raw.slice(i * size, i * size + size);
        return parseInt(short ? slice + slice : slice, 16);
    };
    return [part(0), part(1), part(2)];
}

/** Every colour literal in a chunk of CSS or a token value, as [r, g, b]. */
function colors(text) {
    const found = [];
    for (const m of text.matchAll(HEX)) found.push({ raw: m[0], rgb: hexChannels(m[1]) });
    for (const m of text.matchAll(FUNC)) {
        found.push({ raw: m[0] + ')', rgb: [Number(m[1]), Number(m[2]), Number(m[3])] });
    }
    return found;
}

const neutral = ([r, g, b]) => r === g && g === b;

/** Rule bodies whose selector is scoped to the dark theme. */
function darkRules() {
    const rules = [];
    for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
        const selector = m[1].trim().replace(/\s+/g, ' ');
        if (selector.includes('[data-theme="dark"]')) rules.push({ selector, body: m[2] });
    }
    return rules;
}

test('the dark palette in config is black, greys and white', () => {
    for (const [token, value] of Object.entries(THEMES.dark)) {
        for (const found of colors(String(value))) {
            assert.ok(neutral(found.rgb), `THEMES.dark.${token} is not neutral: ${found.raw}`);
        }
    }
});

test('every dark rule in the stylesheet is black, greys and white', () => {
    const rules = darkRules();
    assert.ok(rules.length > 10, 'expected the dark theme rules to be found');
    for (const rule of rules) {
        for (const found of colors(rule.body)) {
            assert.ok(neutral(found.rgb), `${rule.selector} is not neutral: ${found.raw}`);
        }
    }
});

test('the light palette is left alone', () => {
    // Guards the other direction: a blanket find-and-replace over the palette
    // would drain the colour out of Professional too.
    const tinted = Object.values(THEMES.light)
        .flatMap(value => colors(String(value)))
        .filter(found => !neutral(found.rgb));
    assert.ok(tinted.length > 4, 'Professional should still be a colour theme');
});

test('category tones stay distinguishable in the dark ramp', () => {
    const block = darkRules().find(rule => rule.selector === '[data-theme="dark"]');
    const tones = [...block.body.matchAll(/--cat-([a-z]+):\s*(#[0-9a-fA-F]{6})/g)]
        .map(m => ({ name: m[1], level: hexChannels(m[2].slice(1))[0] }))
        .sort((a, b) => a.level - b.level);

    assert.equal(tones.length, 8, 'expected the full set of category tones');
    for (let i = 1; i < tones.length; i++) {
        const gap = tones[i].level - tones[i - 1].level;
        assert.ok(gap >= 20, `--cat-${tones[i].name} sits too close to --cat-${tones[i - 1].name}`);
    }
    // The dimmest tone still has to clear the surfaces it is drawn on (#0a0a0a).
    assert.ok(tones[0].level >= 60, 'the darkest category tone would vanish against black');
});

test('accent fills carry a readable text colour in both themes', () => {
    // Dark's accent is white, so anything painting text on it must use the
    // token rather than a hardcoded #fff.
    assert.match(css, /--on-accent:\s*#ffffff/, 'light is missing --on-accent');
    assert.match(css, /--on-accent:\s*#000000/, 'dark is missing --on-accent');

    for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
        const selector = m[1].trim().replace(/\s+/g, ' ');
        const body = m[2];
        if (selector.includes('[data-theme=')) continue;
        const fills = /background(-color)?:\s*var\(--(accent|accent-hover|income|success)\)/.test(body);
        if (!fills) continue;
        assert.ok(
            !/color:\s*#(fff|ffffff)\b/.test(body),
            `${selector} paints hardcoded white on an accent fill; use var(--on-accent)`
        );
    }
});
