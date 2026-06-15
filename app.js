var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config.js
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var CONFIG = {
  version: "Version 2.0.0",
  buildEnv: "Production",
  defaultTheme: "light"
};
var STORAGE_KEYS = { theme: "oe-theme", visited: "hasVisited", ledgerName: "oe-ledger-name" };
var THEMES = {
  light: {
    bg: "#f9f9fb",
    surface: "#ffffff",
    surface2: "#f1f5f9",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    text: "#334155",
    text2: "#94a3b8",
    textMuted: "#94a3b8",
    textStrong: "#0f172a",
    accent: "#6366f1",
    accentHover: "#1d4ed8",
    btnBg: "#ffffff",
    btnText: "#334155",
    btnBorder: "#cbd5e1",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
    dayBg: "#ffffff",
    dayBorder: "#efeff2",
    overlay: "rgba(15, 23, 42, 0.4)",
    pillBg: "#f1f5f9",
    pillText: "#1e40af",
    pillBorder: "#bfdbfe",
    dangerBg: "#fef2f2",
    dangerText: "#b91c1c",
    dangerBorder: "#fca5a5",
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    shadowHover: "rgba(15, 23, 42, 0.03)",
    success: "#16a34a",
    accentRing: "rgba(99, 102, 241, 0.22)",
    thumbBg: "#ffffff",
    modalShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)"
  },
  dark: {
    bg: "#09090b",
    surface: "#18181b",
    surface2: "#27272a",
    border: "#3f3f46",
    borderStrong: "#52525b",
    text: "#a1a1aa",
    text2: "#71717a",
    textMuted: "#52525b",
    textStrong: "#fafafa",
    accent: "#3b82f6",
    accentHover: "#60a5fa",
    btnBg: "#18181b",
    btnText: "#e4e4e7",
    btnBorder: "#3f3f46",
    inputBg: "#18181b",
    inputBorder: "#3f3f46",
    dayBg: "#18181b",
    dayBorder: "#27272a",
    overlay: "rgba(0, 0, 0, 0.65)",
    pillBg: "#1e3a8a",
    pillText: "#bfdbfe",
    pillBorder: "#1e40af",
    dangerBg: "#450a0a",
    dangerText: "#fca5a5",
    dangerBorder: "#7f1d1d",
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    shadowHover: "rgba(0, 0, 0, 0.3)",
    success: "#22c55e",
    accentRing: "rgba(59, 130, 246, 0.28)",
    thumbBg: "#27272a",
    modalShadow: "0 24px 64px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)"
  }
};

// src/core/store.js
var store_exports = {};
__export(store_exports, {
  getColors: () => getColors,
  getState: () => getState,
  patch: () => patch,
  subscribe: () => subscribe
});
var state = {
  currentDate: /* @__PURE__ */ new Date(),
  events: {},
  ledgerName: "",
  isDark: CONFIG.defaultTheme === "dark",
  selectedKey: null,
  editingIndex: null
};
var listeners = /* @__PURE__ */ new Set();
function getState() {
  return state;
}
function getColors() {
  return state.isDark ? THEMES.dark : THEMES.light;
}
function patch(partial) {
  Object.assign(state, partial);
  listeners.forEach((fn) => fn(state));
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// src/core/persist.js
var DB_NAME = "openexpense";
var DB_VERSION = 1;
var STORE_NAME = "ledger";
var KEY = "current";
var saveTimer = null;
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}
async function loadLedger() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(KEY);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result ?? null);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}
async function saveLedger(data) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(data, KEY);
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  } catch {
  }
}
function initPersist(store) {
  store.subscribe(() => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const s = store.getState();
      saveLedger({ name: s.ledgerName, events: s.events, savedAt: Date.now() });
    }, 400);
  });
}

// src/core/utils.js
var Utils = {
  pad: (n) => String(n).padStart(2, "0"),
  dateKey: (y, m, d) => `${y}-${Utils.pad(m + 1)}-${Utils.pad(d)}`,
  getPrice: (e) => {
    if (e.price !== void 0 && e.price !== null && e.price !== "") return parseFloat(e.price);
    const match = e.note?.match(/\$(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  },
  escapeHtml: (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]),
  bindTooltip: (el, text) => {
    if (!text) return;
    const tt = document.getElementById("global-tooltip");
    el.addEventListener("mouseenter", () => {
      tt.textContent = text;
      tt.style.opacity = "1";
    });
    el.addEventListener("mousemove", (e) => {
      tt.style.left = `${e.clientX}px`;
      tt.style.top = `${e.clientY - 15}px`;
    });
    el.addEventListener("mouseleave", () => {
      tt.style.opacity = "0";
    });
  },
  isMobile: () => window.matchMedia("(max-width: 640px)").matches,
  canUseSavePicker: () => typeof window.showSaveFilePicker === "function" && window.isSecureContext && !Utils.isMobile(),
  sanitizeFilename(name) {
    return String(name ?? "").trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, " ").slice(0, 80);
  },
  filenameToLedgerName(filename) {
    return Utils.sanitizeFilename(String(filename ?? "").replace(/\.json$/i, ""));
  },
  exportFilename(name) {
    const cleaned = Utils.sanitizeFilename(name);
    if (cleaned) return `${cleaned}.json`;
    return `ledger-${Utils.dateKey((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), (/* @__PURE__ */ new Date()).getDate())}.json`;
  },
  ledgerFilename: () => `ledger-${Utils.dateKey((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), (/* @__PURE__ */ new Date()).getDate())}.json`
};

// src/ui/theme.js
function applyTheme() {
  const c = getColors();
  const root = document.documentElement;
  const { isDark } = getState();
  root.dataset.theme = isDark ? "dark" : "light";
  document.body.style.background = c.bg;
  Object.keys(c).forEach((k) => root.style.setProperty(`--${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}`, c[k]));
  root.style.setProperty("--day-bg", c.dayBg);
  root.style.setProperty("--day-border", c.dayBorder);
  root.style.setProperty("--pill-bg", c.pillBg);
  root.style.setProperty("--accent-ring", c.accentRing);
  root.style.setProperty("--thumb-bg", c.thumbBg);
  root.style.setProperty("--modal-shadow", c.modalShadow);
}
function setTheme(isDark) {
  patch({ isDark });
  try {
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
  } catch (_) {
  }
}

// src/ui/components.js
var UI = {
  createButton: (label, onClick, opts = {}) => {
    const c = getColors();
    const btn = document.createElement("button");
    if (opts.icon) {
      btn.innerHTML = `<i class="ti ti-${opts.icon}" style="font-size: 15px;"></i>${label ? `<span style="margin-left: 6px;">${label}</span>` : ""}`;
    } else {
      btn.textContent = label;
    }
    btn.onclick = onClick;
    const bg = opts.accent ? c.accent : opts.danger ? c.dangerBg : c.btnBg;
    const col = opts.accent ? "#fff" : opts.danger ? c.dangerText : opts.iconOnly ? c.text : c.btnText;
    const bdr = opts.accent ? c.accent : opts.danger ? c.dangerBorder : c.btnBorder;
    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: opts.icon && !label ? "6px" : "6px 12px",
      fontSize: "13px",
      fontWeight: "500",
      borderRadius: "6px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      border: `1px solid ${bdr}`,
      background: bg,
      color: col,
      transition: "all 0.1s ease",
      outline: "none",
      height: "34px",
      boxShadow: opts.accent ? `0 1px 2px ${c.accent}20` : c.shadowSm
    });
    btn.onmouseenter = () => {
      btn.style.background = opts.accent ? c.accentHover : opts.danger ? c.dangerBorder : c.surface2;
      if (!opts.accent && !opts.danger) btn.style.color = c.textStrong;
    };
    btn.onmouseleave = () => {
      btn.style.background = bg;
      btn.style.color = col;
    };
    return btn;
  },
  createInput: (id, val, placeholder, type = "text") => {
    const c = getColors();
    const el = document.createElement(type === "textarea" ? "textarea" : "input");
    el.id = id;
    el.placeholder = placeholder || "";
    if (type === "textarea") {
      el.value = val || "";
      el.style.height = "62px";
      el.style.resize = "vertical";
    } else if (type === "checkbox") {
      el.type = "checkbox";
      el.checked = !!val;
      return el;
    } else {
      el.type = type;
      el.value = val || "";
      if (type === "number") el.step = "0.01";
    }
    Object.assign(el.style, {
      width: "100%",
      background: c.inputBg,
      border: `1px solid ${c.inputBorder}`,
      borderRadius: "6px",
      color: c.textStrong,
      padding: "8px 12px",
      fontSize: "13px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      transition: "border-color 0.1s, box-shadow 0.1s"
    });
    el.onfocus = () => {
      el.style.borderColor = c.accent;
      el.style.boxShadow = `0 0 0 3px ${c.accentRing}`;
    };
    el.onblur = () => {
      el.style.borderColor = c.inputBorder;
      el.style.boxShadow = "none";
    };
    return el;
  },
  createFieldGroup: (id, label, val, placeholder, type = "text") => {
    const wrap = document.createElement("div");
    wrap.className = "input-group";
    const lbl = document.createElement("label");
    lbl.className = "input-label";
    lbl.textContent = label;
    lbl.htmlFor = id;
    wrap.append(lbl, UI.createInput(id, val, placeholder, type));
    return wrap;
  }
};

// src/ui/toast.js
var Toast = {
  icons: { success: "circle-check", error: "alert-triangle", info: "info-circle" },
  show(message, type = "info", timeout = 3200) {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toast-stack";
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.setAttribute("role", "status");
    el.innerHTML = `<i class="ti ti-${Toast.icons[type] || Toast.icons.info}"></i><span>${Utils.escapeHtml(message)}</span>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 220);
    }, timeout);
  }
};

// src/features/ledger.js
var Ledger = {
  setLedgerName(name) {
    patch({ ledgerName: Utils.sanitizeFilename(name) });
    syncLedgerNameInput();
  },
  nameFromImport(filename, payload) {
    const fromJson = payload?.name ?? payload?.ledgerName;
    if (fromJson && String(fromJson).trim()) return Utils.sanitizeFilename(String(fromJson).trim());
    return Utils.filenameToLedgerName(filename);
  },
  import() {
    const input = document.getElementById("ledger-import-input");
    if (!input) return;
    input.value = "";
    input.click();
  },
  async saveWithPicker(json, filename) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: "OpenExpense ledger",
        accept: { "application/json": [".json"] }
      }]
    });
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
  },
  downloadFallback(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  },
  async export() {
    const { ledgerName, events } = getState();
    const payload = {
      name: ledgerName || "",
      events
    };
    const json = JSON.stringify(payload, null, 2);
    const filename = Utils.exportFilename(ledgerName);
    const blob = new Blob([json], { type: "application/json" });
    const file = new File([blob], filename, { type: "application/json" });
    const shareTitle = ledgerName || "OpenExpense Ledger";
    if (Utils.canUseSavePicker()) {
      try {
        await Ledger.saveWithPicker(json, filename);
        Toast.show("Ledger saved.", "success");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    if (Utils.isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: shareTitle });
        Toast.show("Ledger shared.", "success");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    Ledger.downloadFallback(blob, filename);
    Toast.show("Ledger exported.", "success");
  },
  handleImport(evt) {
    const f = evt.target.files && evt.target.files[0];
    if (!f) return;
    const { events, ledgerName } = getState();
    const hasData = Object.keys(events).length > 0 || ledgerName;
    if (hasData) {
      const ok = confirm("Import will replace your current ledger. Continue?");
      if (!ok) {
        evt.target.value = "";
        return;
      }
    }
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        const importedEvents = p && typeof p === "object" ? p.events || p : null;
        if (!importedEvents || typeof importedEvents !== "object" || Array.isArray(importedEvents)) {
          throw new Error("Unexpected structure");
        }
        patch({
          ledgerName: Ledger.nameFromImport(f.name, p),
          events: importedEvents
        });
        render();
        const count = Object.values(importedEvents).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
        Toast.show(`Imported ${count} item${count === 1 ? "" : "s"}.`, "success");
      } catch {
        Toast.show("Invalid ledger file. Choose a valid OpenExpense .json export.", "error");
      }
    };
    r.onerror = () => Toast.show("Could not read that file.", "error");
    r.readAsText(f);
    evt.target.value = "";
  }
};

// src/features/modal.js
function openModal(key) {
  patch({ selectedKey: key, editingIndex: null });
  document.getElementById("modal").classList.add("open");
  renderModal();
}
function closeModal() {
  patch({ selectedKey: null, editingIndex: null });
  document.getElementById("modal").classList.remove("open");
}
function bgClose(e) {
  if (e.target === document.getElementById("modal")) closeModal();
}
function initModalBindings() {
  const modal = document.getElementById("modal");
  if (modal && !modal.dataset.bound) {
    modal.addEventListener("click", bgClose);
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    modal.dataset.bound = "1";
  }
}
function renderModal() {
  const { selectedKey } = getState();
  if (!selectedKey) return;
  const c = getColors();
  const [y, m, d] = selectedKey.split("-");
  const dateObj = new Date(+y, +m - 1, +d);
  const titleEl = document.getElementById("modal-date-title");
  if (titleEl) {
    titleEl.textContent = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }
  const eventsContainer = document.getElementById("events-container");
  const formContainer = document.getElementById("form-container");
  const { events } = getState();
  if (eventsContainer) {
    eventsContainer.innerHTML = "";
    const list = events[selectedKey] || [];
    if (!list.length) {
      const p = document.createElement("p");
      p.style.cssText = `font-size:13px; color:${c.textMuted}; padding: 16px 0; border-bottom: 1px solid ${c.border}`;
      p.textContent = "No expenses logged on this date.";
      eventsContainer.appendChild(p);
    } else {
      list.forEach((e, i) => eventsContainer.appendChild(buildRow(e, i)));
    }
  }
  if (formContainer) {
    formContainer.innerHTML = "";
    const form = document.createElement("form");
    form.className = "record-form";
    form.onsubmit = (e) => {
      e.preventDefault();
      addEvent();
    };
    form.appendChild(UI.createFieldGroup("et", "Title", "", "e.g. Server Invoice"));
    const splitRow = document.createElement("div");
    splitRow.className = "form-row-split";
    const costWrap = UI.createFieldGroup("ep", "Cost", "", "0.00", "number");
    costWrap.style.flex = "0 0 45%";
    const costInput = costWrap.querySelector("input");
    costInput.style.paddingLeft = "24px";
    const dollarSign = document.createElement("span");
    dollarSign.style.cssText = `position:absolute; left:12px; top:31px; color:${c.text2}; font-weight:500; font-size:13px;`;
    dollarSign.textContent = "$";
    costWrap.style.position = "relative";
    costWrap.appendChild(dollarSign);
    splitRow.appendChild(costWrap);
    const optWrap = document.createElement("div");
    optWrap.style.cssText = "display:flex; gap:20px; flex:1; padding-bottom: 3px;";
    optWrap.innerHTML = `
            <label class="custom-cb"><input type="checkbox" id="er"><span>Recurring</span></label>
            <label class="custom-cb"><input type="checkbox" id="epad"><span>Paid</span></label>
        `;
    splitRow.appendChild(optWrap);
    form.appendChild(splitRow);
    form.appendChild(UI.createFieldGroup("en", "Notes", "", "Optional context...", "textarea"));
    const act = document.createElement("div");
    act.style.cssText = "display:flex; justify-content:flex-end; margin-top: 6px;";
    const submitBtn = UI.createButton("Save Item", null, { icon: "plus", accent: true });
    submitBtn.type = "submit";
    act.appendChild(submitBtn);
    form.appendChild(act);
    formContainer.appendChild(form);
    setTimeout(() => {
      const etEl = document.getElementById("et");
      if (etEl) etEl.focus();
    }, 60);
  }
}
function buildRow(e, i) {
  const { editingIndex } = getState();
  if (editingIndex === i) return buildEditRow(e, i);
  const row = document.createElement("div");
  row.id = `row-${i}`;
  row.className = "event-row";
  const info = document.createElement("div");
  info.className = "event-info";
  const titleRow = document.createElement("div");
  titleRow.className = "event-header";
  const t = document.createElement("span");
  t.className = `event-title ${e.paid ? "paid" : ""}`;
  t.textContent = e.title;
  titleRow.appendChild(t);
  const amt = Utils.getPrice(e);
  if (amt > 0) {
    const badge = document.createElement("span");
    badge.className = "event-badge";
    badge.textContent = `$${amt.toFixed(2)}`;
    titleRow.appendChild(badge);
  }
  if (e.recurring) {
    const rec = document.createElement("span");
    rec.className = "event-badge-icon";
    rec.innerHTML = '<i class="ti ti-refresh"></i>';
    titleRow.appendChild(rec);
  }
  info.appendChild(titleRow);
  if (e.note) {
    const n = document.createElement("p");
    n.className = "event-note";
    n.textContent = e.note;
    info.appendChild(n);
  }
  row.appendChild(info);
  const act = document.createElement("div");
  act.className = "row-actions";
  const editBtn = document.createElement("button");
  editBtn.className = "btn-icon-edit";
  editBtn.innerHTML = '<i class="ti ti-edit" style="font-size:15px;"></i>';
  editBtn.onclick = () => startEdit(i);
  const delBtn = document.createElement("button");
  delBtn.className = "btn-icon-delete";
  delBtn.innerHTML = '<i class="ti ti-trash" style="font-size:15px;"></i>';
  delBtn.onclick = () => deleteEv(i);
  act.append(editBtn, delBtn);
  row.appendChild(act);
  return row;
}
function buildEditRow(e, i) {
  const c = getColors();
  const wrap = document.createElement("div");
  wrap.id = `row-${i}`;
  Object.assign(wrap.style, { padding: "16px", background: c.surface2, borderRadius: "8px", border: `1px solid ${c.borderStrong}`, marginBottom: "12px", marginTop: "12px" });
  const form = document.createElement("div");
  form.className = "form-grid";
  form.style.margin = "0";
  form.appendChild(UI.createFieldGroup(`edit-title-${i}`, "Title", e.title));
  const row2 = document.createElement("div");
  row2.className = "form-row";
  const pWrap = UI.createFieldGroup(`edit-price-${i}`, "Cost", Utils.getPrice(e) || "", "0.00", "number");
  pWrap.querySelector("input").style.paddingLeft = "24px";
  const dollar = document.createElement("span");
  dollar.style.cssText = `position:absolute; left:10px; top:31px; color:${c.text2}; font-weight:500; font-size:13px;`;
  dollar.textContent = "$";
  pWrap.style.position = "relative";
  pWrap.appendChild(dollar);
  row2.appendChild(pWrap);
  const optWrap = document.createElement("div");
  optWrap.className = "input-group";
  optWrap.style.justifyContent = "flex-end";
  const optRow = document.createElement("div");
  optRow.style.cssText = "display:flex; gap:16px; height: 35px; align-items:center;";
  const recWrap = document.createElement("label");
  recWrap.className = "cb-wrap";
  const recCb = UI.createInput(`edit-rec-${i}`, e.recurring, "", "checkbox");
  recWrap.append(recCb, Object.assign(document.createElement("span"), { textContent: "Recurring" }));
  const paidWrap = document.createElement("label");
  paidWrap.className = "cb-wrap";
  const paidCb = UI.createInput(`edit-paid-${i}`, e.paid, "", "checkbox");
  paidWrap.append(paidCb, Object.assign(document.createElement("span"), { textContent: "Paid" }));
  optRow.append(recWrap, paidWrap);
  optWrap.appendChild(optRow);
  row2.appendChild(optWrap);
  form.appendChild(row2);
  form.appendChild(UI.createFieldGroup(`edit-note-${i}`, "Notes", e.note || "", "", "textarea"));
  wrap.appendChild(form);
  const act = document.createElement("div");
  act.style.cssText = "display:flex; gap:8px; margin-top:16px; justify-content:flex-end;";
  act.appendChild(UI.createButton("Cancel", () => {
    patch({ editingIndex: null });
    renderModal();
  }));
  act.appendChild(UI.createButton("Update", () => saveEdit(i), { icon: "check", accent: true }));
  wrap.appendChild(act);
  setTimeout(() => {
    const edEl = document.getElementById(`edit-title-${i}`);
    if (edEl) edEl.focus();
  }, 60);
  return wrap;
}
function startEdit(i) {
  patch({ editingIndex: i });
  const listEl = document.getElementById("events-container");
  const { selectedKey, events } = getState();
  const list = events[selectedKey] || [];
  listEl.innerHTML = "";
  list.forEach((e, idx) => listEl.appendChild(buildRow(e, idx)));
}
function propagateRecurring(baseEvent, startKey) {
  const [y, m, d] = startKey.split("-").map(Number);
  const { events } = getState();
  const nextEvents = { ...events };
  for (let i = 1; i <= 12; i++) {
    let nextM = m + i;
    let nextY = y;
    if (nextM > 12) {
      nextY += Math.floor((nextM - 1) / 12);
      nextM = (nextM - 1) % 12 + 1;
    }
    const daysInNextMonth = new Date(nextY, nextM, 0).getDate();
    const nextD = Math.min(d, daysInNextMonth);
    const nextKey = `${nextY}-${Utils.pad(nextM)}-${Utils.pad(nextD)}`;
    if (!nextEvents[nextKey]) nextEvents[nextKey] = [];
    const exists = nextEvents[nextKey].some((e) => e.title === baseEvent.title && e.recurring === true);
    if (!exists) nextEvents[nextKey].push({ ...baseEvent, paid: false });
  }
  patch({ events: nextEvents });
}
function saveEdit(i) {
  const title = document.getElementById(`edit-title-${i}`).value.trim();
  if (!title) return;
  const isRecurring = document.getElementById(`edit-rec-${i}`).checked;
  const price = document.getElementById(`edit-price-${i}`).value;
  const updatedEv = {
    title,
    note: document.getElementById(`edit-note-${i}`).value.trim(),
    price: price ? parseFloat(price) : null,
    recurring: isRecurring,
    paid: document.getElementById(`edit-paid-${i}`).checked
  };
  const { selectedKey, events } = getState();
  const nextEvents = { ...events };
  nextEvents[selectedKey] = [...nextEvents[selectedKey]];
  nextEvents[selectedKey][i] = updatedEv;
  patch({ events: nextEvents, editingIndex: null });
  if (isRecurring) propagateRecurring(updatedEv, selectedKey);
  renderModal();
  render();
}
function deleteEv(i) {
  const row = document.getElementById(`row-${i}`);
  const go = () => {
    const { selectedKey, events } = getState();
    const nextEvents = { ...events };
    nextEvents[selectedKey] = [...nextEvents[selectedKey]];
    nextEvents[selectedKey].splice(i, 1);
    if (!nextEvents[selectedKey].length) delete nextEvents[selectedKey];
    patch({ events: nextEvents, editingIndex: null });
    renderModal();
    render();
  };
  if (row) {
    Object.assign(row.style, { opacity: "0", maxHeight: "0", padding: "0", overflow: "hidden" });
    setTimeout(go, 120);
  } else go();
}
function addEvent() {
  const t = document.getElementById("et").value.trim();
  if (!t) return;
  const p = document.getElementById("ep").value;
  const isRecurring = document.getElementById("er").checked;
  const newEv = {
    title: t,
    note: document.getElementById("en").value.trim(),
    price: p ? parseFloat(p) : null,
    recurring: isRecurring,
    paid: document.getElementById("epad").checked
  };
  const { selectedKey, events } = getState();
  const nextEvents = { ...events };
  if (!nextEvents[selectedKey]) nextEvents[selectedKey] = [];
  else nextEvents[selectedKey] = [...nextEvents[selectedKey]];
  nextEvents[selectedKey].push(newEv);
  patch({ events: nextEvents });
  if (isRecurring) propagateRecurring(newEv, selectedKey);
  renderModal();
  render();
}

// src/features/receipt.js
var Receipt = {
  OCR_CDN: "https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js",
  _service: null,
  _initPromise: null,
  _previewUrl: null,
  pickImage() {
    const input = document.getElementById("receipt-scan-input");
    if (!input) return;
    input.value = "";
    if (Utils.isMobile()) input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.click();
  },
  async ensureEngine(onProgress) {
    if (Receipt._service) return Receipt._service;
    if (Receipt._initPromise) return Receipt._initPromise;
    Receipt._initPromise = (async () => {
      onProgress?.("Loading OCR engine\u2026", 0.08);
      const { PaddleOcrService } = await import(Receipt.OCR_CDN);
      onProgress?.("Downloading models (first scan only)\u2026", 0.2);
      const service = new PaddleOcrService({ recognition: { strategy: "cross-line" } });
      await service.initialize();
      onProgress?.("Warming up\u2026", 0.88);
      const warm = document.createElement("canvas");
      warm.width = warm.height = 64;
      const ctx = warm.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#000";
      ctx.font = "20px sans-serif";
      ctx.fillText("A", 20, 40);
      try {
        await service.recognize(warm, { flatten: true });
      } catch (_) {
      }
      Receipt._service = service;
      onProgress?.("Ready", 1);
      return service;
    })();
    try {
      return await Receipt._initPromise;
    } catch (err) {
      Receipt._initPromise = null;
      throw err;
    }
  },
  async fileToCanvas(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Could not load image"));
        el.src = url;
      });
      const maxSide = 2400;
      let { width, height } = img;
      if (width > maxSide || height > maxSide) {
        const scale = maxSide / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return { canvas: Receipt.prepareForOcr(canvas), previewUrl: url };
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  },
  prepareForOcr(source) {
    const minSide = 1e3;
    const maxSide = 2400;
    let w = source.width;
    let h = source.height;
    const longest = Math.max(w, h);
    if (longest < minSide) {
      const scale = minSide / longest;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    } else if (longest > maxSide) {
      const scale = maxSide / longest;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    if (w === source.width && h === source.height) return source;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);
    return canvas;
  },
  linesFromResult(result) {
    return (result?.lines || []).map(
      (line) => line.map((r) => r.text).join(" ").replace(/\s{2,}/g, " ").trim()
    ).filter(Boolean);
  },
  buildLineList(result, flatResult) {
    const fromRegions = Receipt.linesFromResult(result);
    const fromFlat = (flatResult?.text || "").split("\n").map((l) => l.replace(/\s{2,}/g, " ").trim()).filter(Boolean);
    const lineList = fromRegions.length >= fromFlat.length ? fromRegions : fromFlat;
    if (!lineList.length) return Receipt.normalizeLines(fromFlat.length ? fromFlat : fromRegions);
    return Receipt.normalizeLines(lineList);
  },
  normalizeLines(lineList) {
    return lineList.map(
      (line) => line.replace(/\bzooml\b/gi, "Zoom").replace(/(\d)[|lI](\d{2})\b/g, "$1.$2").replace(/\s+/g, " ").trim()
    ).filter(Boolean);
  },
  normalizeText(text, lines) {
    const body = (text || lines.join("\n")).replace(/\bzooml\b/gi, "Zoom Communications").replace(/zoom\s*c[o0]mmunications/gi, "Zoom Communications");
    return body;
  },
  async recognizeText(file, onProgress) {
    const service = await Receipt.ensureEngine(onProgress);
    const { canvas, previewUrl } = await Receipt.fileToCanvas(file);
    Receipt._previewUrl = previewUrl;
    onProgress?.("Reading text\u2026", 0.55);
    let result = await service.recognize(canvas, { flatten: false });
    let flatResult = null;
    let lines = Receipt.linesFromResult(result);
    let text = (result.text || "").trim();
    if (!lines.length && !text) {
      flatResult = await service.recognize(canvas, { flatten: true });
      text = (flatResult.text || "").trim();
      lines = Receipt.buildLineList(result, flatResult);
    } else {
      if (!lines.length && text) {
        lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      }
      lines = Receipt.normalizeLines(lines);
    }
    if (!text) text = lines.join("\n");
    text = Receipt.normalizeText(text, lines);
    const confidence = Math.max(result.confidence ?? 0, flatResult?.confidence ?? 0);
    return { text, lines, confidence, previewUrl };
  },
  async scan(file) {
    const progress = Receipt.showProgress();
    try {
      const ocr = await Receipt.recognizeText(file, (label, pct) => progress.set(label, pct));
      progress.close();
      const parsed = Receipt.parse(ocr.text, ocr.lines, ocr.confidence);
      if (!ocr.lines.length && !ocr.text.trim()) {
        parsed.lowConfidence = true;
        Toast.show("No text detected \u2014 fill in the fields manually or try a clearer photo.", "error");
      }
      Receipt.showPreview(parsed, ocr.previewUrl);
    } catch (err) {
      console.error("OCR error:", err);
      progress.close();
      if (Receipt._previewUrl) URL.revokeObjectURL(Receipt._previewUrl);
      Toast.show("Receipt scanning failed. Try a clearer photo with good lighting.", "error");
    }
  },
  showProgress() {
    const backdrop = document.createElement("div");
    backdrop.className = "backdrop open";
    backdrop.id = "ocr-progress";
    backdrop.innerHTML = `
            <div class="modal-shell ocr-progress" role="status" aria-live="polite">
                <i class="ti ti-scan ocr-progress-icon"></i>
                <strong>Reading receipt\u2026</strong>
                <p class="ocr-progress-note">First scan downloads ~5 MB of models, then caches locally.</p>
                <div class="bar"><span></span></div>
                <small class="ocr-pct">Starting\u2026</small>
            </div>`;
    document.body.appendChild(backdrop);
    const fill = backdrop.querySelector(".bar > span");
    const pct = backdrop.querySelector(".ocr-pct");
    return {
      set(label, p) {
        const v = Math.round((p || 0) * 100);
        fill.style.width = `${v}%`;
        pct.textContent = typeof label === "string" ? `${label} (${v}%)` : `${v}%`;
      },
      close() {
        backdrop.remove();
      }
    };
  },
  moneyOnLine(line) {
    const amounts = [];
    for (const m of line.matchAll(/\$\s*(\d{1,6}[.,]\d{2})/g)) {
      const v = parseFloat(m[1].replace(",", "."));
      if (!isNaN(v) && v >= 0 && v < 1e5) amounts.push(v);
    }
    if (amounts.length) return amounts[amounts.length - 1];
    for (const m of line.matchAll(/(?<!\d)(\d{1,4}[.,]\d{2})(?!\d)/g)) {
      const v = parseFloat(m[1].replace(",", "."));
      if (!isNaN(v) && v >= 0 && v < 1e5) amounts.push(v);
    }
    return amounts.length ? amounts[amounts.length - 1] : null;
  },
  allMoneyOnLine(line) {
    const amounts = [];
    for (const m of line.matchAll(/\$\s*(\d{1,6}[.,]\d{2})/g)) {
      const v = parseFloat(m[1].replace(",", "."));
      if (!isNaN(v) && v >= 0 && v < 1e5) amounts.push(v);
    }
    if (!amounts.length) {
      for (const m of line.matchAll(/(?<!\d)(\d{1,4}[.,]\d{2})(?!\d)/g)) {
        const v = parseFloat(m[1].replace(",", "."));
        if (!isNaN(v) && v >= 0 && v < 1e5) amounts.push(v);
      }
    }
    return amounts;
  },
  isAddressOrMeta(line) {
    return /\b(street|st\.|blvd|boulevard|ave|avenue|floor|suite|drive|road|rd\.)\b/i.test(line) || /,\s*[A-Z]{2}\s+\d{5}/.test(line) || /\b\d{1,5}\s+\w+\s+(street|st|blvd|ave)/i.test(line) || /^invoice\s*#?/i.test(line) || /^account\s*(number|#)/i.test(line) || /federal\s*employer/i.test(line) || /purchase\s*order/i.test(line) || /^(sold|bill)\s*to/i.test(line) || /^\d{5}(-\d{4})?$/.test(line.trim());
  },
  fuzzyMonth(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    if (months.includes(w.slice(0, 3))) return w.slice(0, 3);
    let best = null, bestDist = 3;
    for (const m of months) {
      let dist = 0;
      for (let i = 0; i < Math.min(w.length, m.length); i++) dist += w[i] === m[i] ? 0 : 1;
      dist += Math.abs(w.length - m.length);
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
    return bestDist <= 2 ? best : null;
  },
  parseDate(text, lines) {
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const iso = (y, m, d) => {
      y = +y;
      m = +m;
      d = +d;
      if (y < 100) y += 2e3;
      if (m < 1 || m > 12 || d < 1 || d > 31) return null;
      return `${y}-${Utils.pad(m)}-${Utils.pad(d)}`;
    };
    const sources = [...lines || [], text];
    for (const src of sources) {
      const norm = src.replace(/[|:]/g, " ").replace(/\s+/g, " ");
      let m = norm.match(/(?:invoice|due|service|issue)?\s*date[:\s]+([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
      if (m) {
        const mon = Receipt.fuzzyMonth(m[1]);
        if (mon) return iso(m[3], months[mon], m[2]);
      }
      m = norm.match(/([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
      if (m) {
        const mon = Receipt.fuzzyMonth(m[1]);
        if (mon) return iso(m[3], months[mon], m[2]);
      }
      m = norm.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (m) return iso(m[1], m[2], m[3]);
      m = norm.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
      if (m) {
        let mm = +m[1], dd = +m[2];
        if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
        return iso(m[3], mm, dd);
      }
    }
    return null;
  },
  scoreAmount(line) {
    const lower = line.toLowerCase();
    let score = 0;
    if (/grand\s*total|amount\s*due|balance\s*due|total\s*due|total\s*amount/i.test(lower)) score += 120;
    else if (/\btotal\b/i.test(lower) && !/sub|taxes|fees|surcharges/i.test(lower)) score += 90;
    else if (/\bamount\b/i.test(lower)) score += 70;
    if (/sub\s*-?total|taxes|fees|surcharges|tip|change|tender|payment\s*method|visa|mastercard|amex/i.test(lower)) score -= 80;
    if (Receipt.isAddressOrMeta(line)) score -= 200;
    const amt = Receipt.moneyOnLine(line);
    if (amt == null) return null;
    if (amt < 0.01) score -= 60;
    if (amt >= 1e3 && !/\$\s*\d/.test(line)) score -= 150;
    return { amt, score, line };
  },
  rowTotalFromAmounts(amounts) {
    if (amounts.length >= 3) return amounts[amounts.length - 1];
    if (amounts.length === 2) {
      const [a, b] = amounts;
      if (b < a && b < 1 && a > 0) return Math.round((a + b) * 100) / 100;
      return b;
    }
    return amounts.length === 1 ? amounts[0] : null;
  },
  collectInvoiceAmounts(lineList) {
    const rows = [];
    for (let i = 0; i < lineList.length; i++) {
      const line = lineList[i];
      if (Receipt.isAddressOrMeta(line)) continue;
      const amounts = Receipt.allMoneyOnLine(line);
      if (!amounts.length) continue;
      if (amounts.length >= 2) {
        const rowTotal = Receipt.rowTotalFromAmounts(amounts);
        if (rowTotal != null) rows.push(rowTotal);
        continue;
      }
      let paired = null;
      for (let j = i + 1; j < Math.min(i + 4, lineList.length); j++) {
        const next = Receipt.allMoneyOnLine(lineList[j]);
        if (!next.length) continue;
        if (next.length === 1 && next[0] < amounts[0] && next[0] < 1 && amounts[0] > 0) {
          paired = Math.round((amounts[0] + next[0]) * 100) / 100;
        }
        break;
      }
      rows.push(paired != null ? paired : amounts[0]);
    }
    const positive = rows.filter((v) => v > 0 && v < 500);
    if (!positive.length) return null;
    return Math.round(positive.reduce((a, b) => a + b, 0) * 100) / 100;
  },
  parseTotalFromText(text) {
    const triple = text.match(/\$\s*(\d+\.\d{2})\s+\$\s*(\d+\.\d{2})\s+\$\s*(\d+\.\d{2})/);
    if (triple) {
      const a = parseFloat(triple[1]);
      const b = parseFloat(triple[2]);
      const c = parseFloat(triple[3]);
      if (Math.abs(c - (a + b)) < 0.06) return c;
    }
    const due = text.match(/(?:amount|balance|total)\s*due[:\s]*\$?\s*(\d+\.\d{2})/i);
    if (due) return parseFloat(due[1]);
    return null;
  },
  sumInvoiceRowTotals(lineList) {
    let sum = 0;
    let rows = 0;
    for (const line of lineList) {
      const amounts = Receipt.allMoneyOnLine(line);
      if (amounts.length < 2 || Receipt.isAddressOrMeta(line)) continue;
      const rowTotal = Receipt.rowTotalFromAmounts(amounts);
      if (rowTotal == null) continue;
      sum += rowTotal;
      rows++;
    }
    return rows > 0 ? Math.round(sum * 100) / 100 : null;
  },
  inferTotalFromAmounts(lineList) {
    const amounts = [];
    for (const line of lineList) {
      if (Receipt.isAddressOrMeta(line)) continue;
      amounts.push(...Receipt.allMoneyOnLine(line));
    }
    const positive = amounts.filter((a) => a > 0 && a < 500);
    if (!positive.length) return null;
    const subtotals = positive.filter((a) => a >= 1);
    const fees = positive.filter((a) => a > 0 && a < 1);
    if (subtotals.length && fees.length) {
      return Math.round((Math.max(...subtotals) + Math.max(...fees)) * 100) / 100;
    }
    return Math.max(...positive);
  },
  parseMerchant(lineList, text) {
    const companyPat = /\b(inc\.?|llc\.?|corp\.?|ltd\.?|communications|incorporated)\b/i;
    const skipPat = /^(invoice|zoom)$/i;
    const known = [
      [/zoom\s+communications?,?\s*inc\.?/i, "Zoom Communications, Inc."],
      [/\bzoom[l1i]?\b/i, "Zoom Communications, Inc."],
      [/amazon\.?\s*com/i, "Amazon"],
      [/whole\s*foods/i, "Whole Foods"],
      [/costco\s*wholesale/i, "Costco"],
      [/target\s*(store|corp)?/i, "Target"],
      [/walmart/i, "Walmart"],
      [/starbucks/i, "Starbucks"]
    ];
    for (const [pat, name] of known) {
      if (pat.test(text)) return name;
    }
    for (const line of lineList.slice(0, 25)) {
      if (Receipt.isAddressOrMeta(line) || skipPat.test(line.trim())) continue;
      if (companyPat.test(line)) {
        return line.replace(/\s{2,}/g, " ").trim().slice(0, 60);
      }
    }
    const zoomMatch = text.match(/zoom\s+communications,?\s*inc\.?/i);
    if (zoomMatch) return zoomMatch[0].replace(/\s+/g, " ").trim();
    for (const line of lineList.slice(0, 12)) {
      const trimmed = line.trim();
      if (/^zoom[l1i]?$/i.test(trimmed) || /^zoom\s*communications/i.test(trimmed)) {
        return "Zoom Communications, Inc.";
      }
    }
    for (const line of lineList.slice(0, 12)) {
      if (Receipt.isAddressOrMeta(line)) continue;
      const letters = (line.match(/[A-Za-z]/g) || []).length;
      const digits = (line.match(/\d/g) || []).length;
      if (letters >= 5 && letters > digits * 2 && line.length >= 5) {
        return line.replace(/\s{2,}/g, " ").trim().slice(0, 60);
      }
    }
    for (const line of lineList.slice(0, 6)) {
      if (/^zoom\b/i.test(line.trim())) return "Zoom Communications, Inc.";
    }
    return lineList.find((l) => l.length >= 3 && !/^\d+$/.test(l))?.slice(0, 60) || "";
  },
  parseItems(lineList) {
    const skip = /sub\s*-?total|taxes|fees|surcharges|change|tender|payment|visa|mastercard|amex|debit|credit|tip|balance\s*forward|payment\s*terms|currency|certificate|charge\s*description|billing\s*period/i;
    const totalKey = /(grand\s*total|amount\s*due|balance\s*due|total\s*due|\btotal\b)/i;
    const items = [];
    for (const line of lineList) {
      if (skip.test(line) || totalKey.test(line) || Receipt.isAddressOrMeta(line)) continue;
      const charge = line.match(/charge\s*name[:\s]+(.+)/i);
      if (charge) {
        items.push(charge[1].trim().slice(0, 72));
        continue;
      }
      if (/\$\s*\d+\.\d{2}/.test(line)) {
        const amt = Receipt.moneyOnLine(line);
        if (amt != null && amt > 0) {
          items.push(line.replace(/\s{2,}/g, " ").trim().slice(0, 72));
        }
      }
      if (items.length >= 6) break;
    }
    return items;
  },
  parse(text, lines, confidence = 0) {
    const lineList = lines && lines.length ? lines : text.split("\n").map((l) => l.trim()).filter(Boolean);
    let total = null;
    let bestScore = -Infinity;
    for (const line of lineList) {
      const scored = Receipt.scoreAmount(line);
      if (scored && scored.score > bestScore) {
        bestScore = scored.score;
        total = scored.amt;
      }
    }
    const invoiceSum = Receipt.sumInvoiceRowTotals(lineList);
    const clustered = Receipt.collectInvoiceAmounts(lineList);
    const textTotal = Receipt.parseTotalFromText(text);
    for (const candidate of [textTotal, clustered, invoiceSum, Receipt.inferTotalFromAmounts(lineList)]) {
      if (candidate != null && (total == null || total > 500 || candidate > (total || 0))) {
        total = candidate;
      }
    }
    if (total == null) {
      const amounts = lineList.filter((l) => !Receipt.isAddressOrMeta(l)).map(Receipt.moneyOnLine).filter((v) => v != null && v > 0 && v < 1e4);
      if (amounts.length) total = amounts.reduce((a, b) => a + b, 0);
      if (total != null) total = Math.round(total * 100) / 100;
    }
    let tax = null;
    for (const line of lineList) {
      if (/\btax(es)?\b|fees?\s*&?\s*surcharges?/i.test(line)) {
        const amounts = Receipt.allMoneyOnLine(line);
        if (amounts.length) tax = amounts[amounts.length - 1];
      }
    }
    const merchant = Receipt.parseMerchant(lineList, text);
    const items = Receipt.parseItems(lineList);
    return {
      merchant,
      total,
      tax,
      date: Receipt.parseDate(text, lineList),
      items,
      rawText: text,
      confidence,
      lowConfidence: confidence > 0 && confidence < 0.55
    };
  },
  showPreview(parsed, previewUrl) {
    Receipt.closePreview();
    const today = Utils.dateKey((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), (/* @__PURE__ */ new Date()).getDate());
    const noteParts = [...parsed.items];
    if (parsed.tax != null) noteParts.push(`Tax: $${parsed.tax.toFixed(2)}`);
    const confPct = parsed.confidence ? Math.round(parsed.confidence * 100) : null;
    const confClass = parsed.lowConfidence ? "ocr-conf-low" : "ocr-conf-ok";
    const backdrop = document.createElement("div");
    backdrop.className = "backdrop open";
    backdrop.id = "ocr-preview";
    backdrop.innerHTML = `
            <div class="modal-shell ocr-sheet" role="dialog" aria-modal="true" aria-label="Review scanned receipt">
                <div class="ocr-sheet-header">
                    <div>
                        <h3 class="modal-title">Review receipt</h3>
                        ${confPct != null ? `<span class="ocr-conf ${confClass}">${confPct}% match</span>` : ""}
                    </div>
                    <button class="close-modal" type="button" data-act="cancel" aria-label="Close"><i class="ti ti-x"></i></button>
                </div>
                ${parsed.lowConfidence ? `<p class="ocr-hint"><i class="ti ti-info-circle"></i> Low confidence \u2014 please double-check the fields below.</p>` : ""}
                ${previewUrl ? `<div class="ocr-thumb-wrap"><img class="ocr-thumb" src="${previewUrl}" alt=""></div>` : ""}
                <div class="ocr-body">
                    <div class="ocr-field">
                        <label class="field-label" for="ocr-title">Title / Merchant</label>
                        <input class="text-input" type="text" id="ocr-title" spellcheck="false" autocomplete="off"
                            value="${Utils.escapeHtml(parsed.merchant)}" placeholder="e.g. Whole Foods">
                    </div>
                    <div class="ocr-grid">
                        <div class="ocr-field ocr-field-amount">
                            <label class="field-label" for="ocr-amount">Amount</label>
                            <div class="amount-wrap">
                                <span class="amount-prefix">$</span>
                                <input class="text-input amount-input" type="text" inputmode="decimal" id="ocr-amount"
                                    value="${parsed.total != null ? parsed.total.toFixed(2) : ""}" placeholder="0.00">
                            </div>
                        </div>
                        <div class="ocr-field">
                            <label class="field-label" for="ocr-date">Date</label>
                            <input class="text-input" type="date" id="ocr-date" value="${parsed.date || today}">
                        </div>
                    </div>
                    <div class="ocr-field">
                        <label class="field-label" for="ocr-note">Notes</label>
                        <textarea class="text-input" id="ocr-note" rows="3" placeholder="Line items and details">${Utils.escapeHtml(noteParts.join("\n"))}</textarea>
                    </div>
                    <details class="ocr-raw">
                        <summary>View raw scanned text</summary>
                        <pre>${Utils.escapeHtml(parsed.rawText || "No text recognized.")}</pre>
                    </details>
                </div>
                <div class="modal-actions ocr-actions">
                    <button class="btn-secondary" type="button" data-act="cancel">Cancel</button>
                    <button class="btn-primary" type="button" data-act="apply"><i class="ti ti-plus"></i> Add expense</button>
                </div>
            </div>`;
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) Receipt.closePreview();
    });
    backdrop.querySelectorAll('[data-act="cancel"]').forEach((b) => b.onclick = Receipt.closePreview);
    backdrop.querySelector('[data-act="apply"]').onclick = Receipt.apply;
    document.body.appendChild(backdrop);
    const thumb = backdrop.querySelector(".ocr-thumb");
    const thumbWrap = thumb?.closest(".ocr-thumb-wrap");
    if (thumb && thumbWrap) {
      const reveal = () => thumbWrap.classList.add("is-ready");
      const hide = () => thumbWrap.remove();
      thumb.addEventListener("load", reveal, { once: true });
      thumb.addEventListener("error", hide, { once: true });
      if (thumb.complete && thumb.naturalWidth > 0) reveal();
    }
    backdrop.querySelector("#ocr-title").focus();
  },
  closePreview() {
    document.getElementById("ocr-preview")?.remove();
    if (Receipt._previewUrl) {
      URL.revokeObjectURL(Receipt._previewUrl);
      Receipt._previewUrl = null;
    }
  },
  apply() {
    const dateStr = document.getElementById("ocr-date").value;
    const title = document.getElementById("ocr-title").value.trim();
    const amountRaw = document.getElementById("ocr-amount").value.replace(/[^0-9.]/g, "");
    const note = document.getElementById("ocr-note").value.trim();
    if (!title) {
      Toast.show("Please enter a title or merchant name.", "error");
      return;
    }
    if (!dateStr) {
      Toast.show("Please choose a date.", "error");
      return;
    }
    const [y, m, d] = dateStr.split("-").map(Number);
    patch({ currentDate: new Date(y, m - 1, d) });
    Receipt.closePreview();
    render();
    openModal(dateStr);
    const et = document.getElementById("et");
    const ep = document.getElementById("ep");
    const en = document.getElementById("en");
    if (et) et.value = title;
    if (ep) ep.value = amountRaw || "";
    if (en) en.value = note;
    Toast.show("Review the details, then Save Item.", "info");
  }
};

// src/features/calendar.js
function changeMonth(delta) {
  const { currentDate } = getState();
  patch({
    currentDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1)
  });
  render();
}
function renderCalendar() {
  const calCol = document.getElementById("cal-col");
  if (!calCol) return;
  calCol.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const { currentDate, events } = getState();
  const hdr = document.createElement("div");
  hdr.className = "toolbar";
  const nav = document.createElement("div");
  nav.className = "nav-group";
  const titleStr = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  nav.append(
    UI.createButton("", () => changeMonth(-1), { icon: "chevron-left", iconOnly: true }),
    Object.assign(document.createElement("div"), { className: "month-title", textContent: titleStr }),
    UI.createButton("", () => changeMonth(1), { icon: "chevron-right", iconOnly: true })
  );
  const actions = document.createElement("div");
  actions.className = "nav-group toolbar-actions";
  const divider = () => Object.assign(document.createElement("div"), { className: "nav-divider" });
  actions.append(
    UI.createButton("Today", () => {
      patch({ currentDate: /* @__PURE__ */ new Date() });
      render();
    }),
    divider(),
    UI.createButton("Import", Ledger.import, { icon: "upload" }),
    UI.createButton("Export", Ledger.export, { icon: "download" }),
    divider(),
    UI.createButton(Utils.isMobile() ? "Scan" : "Scan Receipt", () => Receipt.pickImage(), { icon: "camera" })
  );
  hdr.append(nav, actions);
  fragment.appendChild(hdr);
  const gridHead = document.createElement("div");
  gridHead.className = "grid-head";
  DAYS.forEach((d) => gridHead.appendChild(Object.assign(document.createElement("span"), { textContent: d })));
  fragment.appendChild(gridHead);
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const today = /* @__PURE__ */ new Date();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const grid = document.createElement("div");
  grid.className = "cal-grid";
  for (let i = 0; i < firstDay + daysInMonth; i++) {
    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (i >= firstDay) {
      const d = i - firstDay + 1;
      const dateKey = Utils.dateKey(y, m, d);
      const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", `Log expense for ${dateKey}`);
      cell.onclick = () => openModal(dateKey);
      cell.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          openModal(dateKey);
        }
      };
      const numLabel = document.createElement("div");
      numLabel.className = `cal-day-num${isToday ? " is-today" : ""}`;
      numLabel.textContent = d;
      cell.appendChild(numLabel);
      const dayEvents = events[dateKey] || [];
      dayEvents.slice(0, 4).forEach((e) => {
        const pill = document.createElement("div");
        pill.className = `pill ${e.paid ? "is-paid" : ""}`;
        const amt = Utils.getPrice(e);
        pill.innerHTML = `<span class="title">${Utils.escapeHtml(e.title)}</span>${amt > 0 ? `<span class="pill-amt">$${amt.toFixed(2)}</span>` : ""}`;
        pill.onclick = (ev) => {
          ev.stopPropagation();
          openModal(dateKey);
        };
        cell.appendChild(pill);
      });
      if (dayEvents.length > 4) {
        const more = document.createElement("div");
        more.className = "cal-more";
        more.textContent = `+${dayEvents.length - 4} more`;
        cell.appendChild(more);
      }
    } else {
      cell.classList.add("is-empty");
    }
    grid.appendChild(cell);
  }
  fragment.appendChild(grid);
  calCol.appendChild(fragment);
}

// src/features/sidebar.js
function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  sidebar.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const c = getColors();
  const { currentDate, events } = getState();
  const sideHeader = document.createElement("div");
  sideHeader.style.cssText = `display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;`;
  const sideTitle = document.createElement("h3");
  sideTitle.className = "sidebar-title";
  sideTitle.innerHTML = `<i class="ti ti-chart-pie"></i> Monthly Summary`;
  sideHeader.appendChild(sideTitle);
  fragment.appendChild(sideHeader);
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const mKey = `${y}-${Utils.pad(m + 1)}`;
  let tTotal = 0, tPaid = 0, tPending = 0;
  let yearlyTotal = 0;
  let monthTotals = new Array(12).fill(0);
  const list = [];
  Object.keys(events).forEach((k) => {
    const isCurrentMonth = k.startsWith(mKey);
    const isCurrentYear = k.startsWith(`${y}-`);
    if (!isCurrentMonth && !isCurrentYear) return;
    const currentMonthIdx = isCurrentYear ? parseInt(k.split("-")[1], 10) - 1 : -1;
    events[k].forEach((e) => {
      const amt = Utils.getPrice(e);
      if (amt <= 0) return;
      if (isCurrentMonth) {
        tTotal += amt;
        if (e.paid) tPaid += amt;
        else tPending += amt;
        list.push({ title: e.title, val: amt, date: k, recurring: e.recurring, paid: e.paid, note: e.note });
      }
      if (isCurrentYear) {
        yearlyTotal += amt;
        monthTotals[currentMonthIdx] += amt;
      }
    });
  });
  const pctPaid = tTotal ? tPaid / tTotal * 100 : 0;
  const pctPending = tTotal ? tPending / tTotal * 100 : 0;
  const statsWrap = document.createElement("div");
  statsWrap.style.cssText = `background: ${c.surface2}; border: 1px solid ${c.border}; border-radius: 8px; padding: 16px; margin-bottom: 20px; box-shadow: ${c.shadowSm};`;
  statsWrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
          <div>
            <div style="font-size:10px; color:${c.text2}; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Total Budget</div>
            <div style="font-size:22px; font-weight:700; color:${c.textStrong}; letter-spacing:-0.02em;">$${tTotal.toFixed(2)}</div>
          </div>
        </div>
        <div class="budget-bar">
          <div class="budget-fill-paid" style="width: ${pctPaid}%"></div>
          <div class="budget-fill-pending" style="width: ${pctPending}%"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:12px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:8px; height:8px; border-radius:2px; background:${c.success};"></div>
            <span style="color:${c.text2}">Paid <strong style="color:${c.textStrong}; margin-left:2px;">$${tPaid.toFixed(2)}</strong></span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:8px; height:8px; border-radius:2px; background:${c.accent};"></div>
            <span style="color:${c.text2}">Pending <strong style="color:${c.textStrong}; margin-left:2px;">$${tPending.toFixed(2)}</strong></span>
          </div>
        </div>
    `;
  fragment.appendChild(statsWrap);
  const activeMonths = monthTotals.filter((a) => a > 0).length || 1;
  const monthlyAvg = yearlyTotal / activeMonths;
  const insightsWrap = document.createElement("div");
  insightsWrap.style.cssText = `margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid ${c.border};`;
  insightsWrap.innerHTML = `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.text2}; font-weight: 600; margin-bottom: 12px;">${y} Projections</div>`;
  const miniGrid = document.createElement("div");
  miniGrid.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;`;
  const mkMiniCard = (icon, label, val) => `
        <div style="background: ${c.surface2}; border: 1px solid ${c.border}; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; color: ${c.text2}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            <i class="ti ti-${icon}" style="font-size: 13px; color: ${c.accent};"></i> ${label}
          </div>
          <div style="font-size: 15px; font-weight: 700; color: ${c.textStrong}; letter-spacing: -0.01em;">$${val.toFixed(2)}</div>
        </div>
    `;
  miniGrid.innerHTML = mkMiniCard("chart-bar", "Avg Month", monthlyAvg) + mkMiniCard("wallet", "Year Total", yearlyTotal);
  insightsWrap.appendChild(miniGrid);
  const maxMonth = Math.max(...monthTotals, 1);
  const graphWrap = document.createElement("div");
  graphWrap.className = "mini-graph";
  monthTotals.forEach((amt, i) => {
    const pct = amt / maxMonth * 100;
    const bar = document.createElement("div");
    const isCur = i === currentDate.getMonth();
    bar.className = "graph-bar";
    bar.style.background = isCur ? c.accent : c.borderStrong;
    bar.style.height = `${Math.max(pct, 6)}%`;
    bar.style.opacity = isCur ? "1" : "0.4";
    const monthName = new Date(y, i).toLocaleString("default", { month: "short" });
    Utils.bindTooltip(bar, `${monthName}: $${amt.toFixed(2)}`);
    bar.onmouseenter = () => {
      bar.style.opacity = "1";
    };
    bar.onmouseleave = () => {
      bar.style.opacity = isCur ? "1" : "0.4";
    };
    bar.onclick = () => {
      patch({ currentDate: new Date(y, i, 1) });
      if (getState().selectedKey) closeModal();
      render();
    };
    graphWrap.appendChild(bar);
  });
  insightsWrap.appendChild(graphWrap);
  fragment.appendChild(insightsWrap);
  if (list.length > 0) {
    const listHeader = document.createElement("div");
    listHeader.style.cssText = `font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.text2}; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${c.border}`;
    listHeader.textContent = "Expense Items";
    fragment.appendChild(listHeader);
    const ledgerWrap = document.createElement("div");
    ledgerWrap.style.cssText = "display:flex; flex-direction:column; gap:4px;";
    list.sort((a, b) => a.date.localeCompare(b.date)).forEach((item) => {
      const row = document.createElement("div");
      row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 8px; transition: background-color 0.1s; background: ${item.paid ? "transparent" : c.surface2}; border: 1px solid ${item.paid ? "transparent" : c.border};`;
      row.onmouseenter = () => {
        row.style.background = c.surface2;
      };
      row.onmouseleave = () => {
        row.style.background = item.paid ? "transparent" : c.surface2;
      };
      Utils.bindTooltip(row, item.note);
      row.innerHTML = `
            <div style="display:flex; flex-direction:column; opacity: ${item.paid ? "0.5" : "1"}; min-width:0; flex:1;">
                <span style="color:${c.textStrong}; font-weight: 500; font-size:13px; text-decoration: ${item.paid ? "line-through" : "none"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:8px;">${Utils.escapeHtml(item.title)} ${item.recurring ? '<i class="ti ti-refresh" style="font-size:11px; margin-left:2px; opacity:0.6;"></i>' : ""}</span>
                <span style="font-size: 11px; color:${c.text2}; margin-top:1px;">${item.date}</span>
            </div>
            <span style="font-weight:600; color:${item.paid ? c.text2 : c.textStrong}; font-size:13px; opacity: ${item.paid ? "0.5" : "1"}; flex-shrink:0;">$${item.val.toFixed(2)}</span>
            `;
      ledgerWrap.appendChild(row);
    });
    fragment.appendChild(ledgerWrap);
  } else {
    const empty = document.createElement("div");
    empty.style.cssText = `text-align:center; padding: 32px 0; color: ${c.textMuted}; font-size: 13px;`;
    empty.innerHTML = `<i class="ti ti-receipt" style="font-size:28px; opacity:0.4; margin-bottom:8px; display:block;"></i>No items logged.`;
    fragment.appendChild(empty);
  }
  sidebar.appendChild(fragment);
}

// src/app/render.js
function render() {
  applyTheme();
  renderToolbar();
  syncLedgerNameInput();
  renderCalendar();
  renderSidebar();
}
function syncLedgerNameInput() {
  const input = document.getElementById("ledger-name-input");
  const { ledgerName } = getState();
  if (input && document.activeElement !== input && input.value !== ledgerName) {
    input.value = ledgerName;
  }
}
function renderToolbar() {
  const toggleSlot = document.getElementById("theme-toggle-slot");
  if (toggleSlot) {
    toggleSlot.innerHTML = "";
    const { isDark } = getState();
    const btn = UI.createButton(
      "",
      () => setTheme(!isDark),
      { icon: isDark ? "sun" : "moon", iconOnly: true }
    );
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    Object.assign(btn.style, {
      fontSize: "10px",
      fontWeight: "600",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      color: "var(--text2)",
      padding: "2px 6px",
      borderRadius: "4px",
      height: "auto",
      boxShadow: "none",
      width: "auto"
    });
    toggleSlot.appendChild(btn);
  }
}

// src/app/views.js
function switchView(viewName) {
  const appView = document.getElementById("view-app");
  const docsView = document.getElementById("view-docs");
  const tabApp = document.getElementById("vt-app");
  const tabDocs = document.getElementById("vt-docs");
  if (viewName === "app") {
    if (appView) appView.classList.remove("hidden");
    if (docsView) docsView.classList.add("hidden");
    if (tabApp) tabApp.classList.add("active");
    if (tabDocs) tabDocs.classList.remove("active");
    render();
  } else {
    if (appView) appView.classList.add("hidden");
    if (docsView) docsView.classList.remove("hidden");
    if (tabApp) tabApp.classList.remove("active");
    if (tabDocs) tabDocs.classList.add("active");
  }
}
function switchDocTab(tabName) {
  document.querySelectorAll(".docs-pane").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".docs-nav-tab").forEach((t) => t.classList.remove("active"));
  document.getElementById(`pane-${tabName}`)?.classList.add("active");
  document.getElementById(`dt-${tabName}`)?.classList.add("active");
}
function showWelcome() {
  const modal = document.getElementById("welcome-modal");
  if (!modal) return;
  let visited = false;
  try {
    visited = !!localStorage.getItem(STORAGE_KEYS.visited);
  } catch (_) {
  }
  if (!visited) {
    modal.classList.add("open");
    try {
      localStorage.setItem(STORAGE_KEYS.visited, "true");
    } catch (_) {
    }
  }
}
function closeWelcomeModal() {
  document.getElementById("welcome-modal")?.classList.remove("open");
}

// src/main.js
async function initApplication() {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (storedTheme) patch({ isDark: storedTheme === "dark" });
  } catch (_) {
  }
  const saved = await loadLedger();
  if (saved && typeof saved === "object") {
    patch({
      ledgerName: saved.name ? Utils.sanitizeFilename(saved.name) : getState().ledgerName,
      events: saved.events && typeof saved.events === "object" ? saved.events : getState().events
    });
  } else {
    try {
      const storedName = localStorage.getItem(STORAGE_KEYS.ledgerName);
      if (storedName) patch({ ledgerName: Utils.sanitizeFilename(storedName) });
    } catch (_) {
    }
  }
  initPersist(store_exports);
  const versionBadge = document.getElementById("app-version");
  if (versionBadge && CONFIG.version) {
    versionBadge.textContent = CONFIG.version;
    versionBadge.style.display = "inline-block";
    if (CONFIG.buildEnv) Utils.bindTooltip(versionBadge, `Environment: ${CONFIG.buildEnv}`);
  }
  switchView("app");
  const importInput = document.getElementById("ledger-import-input");
  if (importInput && !importInput.dataset.bound) {
    importInput.addEventListener("change", Ledger.handleImport);
    importInput.dataset.bound = "1";
  }
  const ledgerNameInput = document.getElementById("ledger-name-input");
  if (ledgerNameInput && !ledgerNameInput.dataset.bound) {
    ledgerNameInput.addEventListener("input", (e) => Ledger.setLedgerName(e.target.value));
    ledgerNameInput.dataset.bound = "1";
  }
  const scanInput = document.getElementById("receipt-scan-input");
  if (scanInput && !scanInput.dataset.bound) {
    scanInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) Receipt.scan(file);
      e.target.value = "";
    });
    scanInput.dataset.bound = "1";
  }
  initModalBindings();
  window.__oeBoot = { ok: true };
}
function handleDelegatedClick(e) {
  const actionEl = e.target.closest("[data-action]");
  if (actionEl) {
    const action = actionEl.dataset.action;
    switch (action) {
      case "close-welcome":
        closeWelcomeModal();
        break;
      case "close-modal":
        closeModal();
        break;
    }
    return;
  }
  const viewEl = e.target.closest("[data-view]");
  if (viewEl) {
    switchView(viewEl.dataset.view);
    return;
  }
  const tabEl = e.target.closest("[data-tab]");
  if (tabEl) {
    switchDocTab(tabEl.dataset.tab);
  }
}
document.addEventListener("click", handleDelegatedClick);
subscribe(() => {
  render();
  if (getState().selectedKey) renderModal();
});
document.addEventListener("DOMContentLoaded", () => {
  initApplication().catch((err) => {
    console.error("[OpenExpense] init failed:", err);
    Toast.show("Failed to start OpenExpense. Try refreshing the page.", "error", 6e3);
  });
  showWelcome();
});
