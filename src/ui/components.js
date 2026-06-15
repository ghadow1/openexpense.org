import { getColors } from '../core/store.js';

export const UI = {
    createButton: (label, onClick, opts = {}) => {
        const c = getColors();
        const btn = document.createElement('button');

        if (opts.icon) {
            btn.innerHTML = `<i class="ti ti-${opts.icon}" style="font-size: 15px;"></i>${label ? `<span style="margin-left: 6px;">${label}</span>` : ''}`;
        } else {
            btn.textContent = label;
        }

        btn.onclick = onClick;

        const bg = opts.accent ? c.accent : opts.danger ? c.dangerBg : c.btnBg;
        const col = opts.accent ? '#fff' : opts.danger ? c.dangerText : (opts.iconOnly ? c.text : c.btnText);
        const bdr = opts.accent ? c.accent : opts.danger ? c.dangerBorder : c.btnBorder;

        Object.assign(btn.style, {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: (opts.icon && !label) ? '6px' : '6px 12px',
            fontSize: '13px', fontWeight: '500', borderRadius: '6px', cursor: 'pointer',
            whiteSpace: 'nowrap', border: `1px solid ${bdr}`, background: bg, color: col,
            transition: 'all 0.1s ease', outline: 'none', height: '34px',
            boxShadow: opts.accent ? `0 1px 2px ${c.accent}20` : c.shadowSm
        });

        btn.onmouseenter = () => {
            btn.style.background = opts.accent ? c.accentHover : opts.danger ? c.dangerBorder : c.surface2;
            if (!opts.accent && !opts.danger) btn.style.color = c.textStrong;
        };
        btn.onmouseleave = () => { btn.style.background = bg; btn.style.color = col; };
        return btn;
    },

    createInput: (id, val, placeholder, type = 'text') => {
        const c = getColors();
        const el = document.createElement(type === 'textarea' ? 'textarea' : 'input');

        el.id = id;
        el.placeholder = placeholder || '';

        if (type === 'textarea') {
            el.value = val || '';
            el.style.height = '62px';
            el.style.resize = 'vertical';
        } else if (type === 'checkbox') {
            el.type = 'checkbox';
            el.checked = !!val;
            return el;
        } else {
            el.type = type;
            el.value = val || '';
            if (type === 'number') el.step = '0.01';
        }

        Object.assign(el.style, {
            width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
            borderRadius: '6px', color: c.textStrong, padding: '8px 12px',
            fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box',
            transition: 'border-color 0.1s, box-shadow 0.1s'
        });

        el.onfocus = () => { el.style.borderColor = c.accent; el.style.boxShadow = `0 0 0 3px ${c.accentRing}`; };
        el.onblur = () => { el.style.borderColor = c.inputBorder; el.style.boxShadow = 'none'; };
        return el;
    },

    createFieldGroup: (id, label, val, placeholder, type = 'text') => {
        const wrap = document.createElement('div'); wrap.className = 'input-group';
        const lbl = document.createElement('label'); lbl.className = 'input-label';
        lbl.textContent = label; lbl.htmlFor = id;
        wrap.append(lbl, UI.createInput(id, val, placeholder, type));
        return wrap;
    }
};
