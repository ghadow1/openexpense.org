export const UI = {
    // Buttons and inputs use design-system classes so light/dark tokens restyle
    // them automatically, including when nodes are cached in the DOM.
    createButton: (label, onClick, opts = {}) => {
        const btn = document.createElement('button');
        btn.type = 'button';

        const classes = ['ui-btn'];
        if (opts.accent) classes.push('ui-btn--accent');
        else if (opts.danger) classes.push('ui-btn--danger');
        if (opts.icon && !label) classes.push('ui-btn--icon');
        btn.className = classes.join(' ');

        if (opts.icon) {
            btn.innerHTML = `<i class="ti ti-${opts.icon}" aria-hidden="true"></i>${label ? `<span>${label}</span>` : ''}`;
        } else {
            btn.textContent = label;
        }

        btn.onclick = onClick;
        return btn;
    },

    createInput: (id, val, placeholder, type = 'text') => {
        const el = document.createElement(type === 'textarea' ? 'textarea' : 'input');

        el.id = id;
        el.placeholder = placeholder || '';

        if (type === 'textarea') {
            el.value = val || '';
            el.className = 'text-input text-input--area';
        } else if (type === 'checkbox') {
            el.type = 'checkbox';
            el.checked = !!val;
            return el;
        } else {
            el.type = type;
            el.value = val || '';
            el.className = 'text-input';
            if (type === 'number') el.step = '0.01';
        }

        return el;
    },

    createFieldGroup: (id, label, val, placeholder, type = 'text') => {
        const wrap = document.createElement('div');
        wrap.className = 'input-group';
        const lbl = document.createElement('label');
        lbl.className = 'input-label';
        lbl.textContent = label;
        lbl.htmlFor = id;
        wrap.append(lbl, UI.createInput(id, val, placeholder, type));
        return wrap;
    }
};
