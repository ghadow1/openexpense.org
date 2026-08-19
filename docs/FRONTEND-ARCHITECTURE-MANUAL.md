# OpenExpense Frontend Architecture Manual

Audience: frontend students, accessibility reviewers, instructors, and
maintainers. This manual documents the authored interface after the
layout-locked semantic and keyboard audit of 19 August 2026.

The governing rule is simple: semantics may improve without moving a pixel.
Class names continue to own presentation; `data-*` attributes continue to own
behavior; IDs continue to connect accessible names, generated content, and
stable application contracts.

Companion references: [`CODEMAP.md`](CODEMAP.md) governs frozen hooks,
[`ARCHITECTURE.md`](ARCHITECTURE.md) explains runtime behavior, and
[`TEACHERS-GUIDE.md`](TEACHERS-GUIDE.md) teaches safe-string/security reasoning.
`scripts/qc-frontend.mjs` is the executable specification for the semantic,
focus, keyboard, and receipt-interface contracts described here.

## SECTION 1: DOM TREE & SEMANTIC STRUCTURAL MAP

### 1.1 Authored shell

```text
body
├── a.skip-link
├── div#welcome-modal.backdrop
│   └── div.welcome-card[role=dialog][aria-modal=true]
├── div.app-shell
│   ├── header.site-header
│   │   └── div.site-header-inner
│   │       ├── div.brand
│   │       ├── div.header-status[role=status]
│   │       └── div.header-actions
│   ├── div.app-container
│   │   ├── main#view-app.app-view
│   │   │   ├── section#pane-overview-hero[data-shell=overview]
│   │   │   ├── section#pane-planner[data-shell=planner]
│   │   │   ├── section#pane-overview-more[data-shell=overview]
│   │   │   ├── section#pane-tracker-head[data-shell=tracker]
│   │   │   └── div.ledger-stage                 ← structural wrapper
│   │   │       ├── div.tracker-toolbar
│   │   │       │   ├── div.tracker-filter[role=group]
│   │   │       │   └── div.dash-actions[role=toolbar]
│   │   │       └── div.tracker-board            ← structural wrapper
│   │   │           ├── div#cal-col.cal-main
│   │   │           └── aside#sidebar.sidebar
│   │   └── main#view-docs.docs-view[hidden]
│   │       ├── section.privacy-tools
│   │       └── div.docs-container
│   │           ├── nav.docs-nav[role=tablist]
│   │           └── section.docs-content
│   │               └── section.docs-pane[role=tabpanel] × 4
│   │                   └── article.docs-book
│   ├── footer.site-footer
│   └── nav.app-dock[aria-label=Primary]
├── div#modal.backdrop
│   └── div#mbox.modal-editor[role=dialog][aria-modal=true]
├── input[type=file][hidden] × 3
├── div#global-tooltip[role=tooltip]
└── noscript
```

Only one `main` landmark is exposed at a time. `applyShell()` synchronizes
`hidden`, `aria-hidden`, and the visual `.hidden` class. The class remains
because it is part of the frozen CSS contract; the attributes make the same
state unambiguous to assistive technology.

### 1.2 Generated subtrees

The static shell provides stable mount points. Feature modules generate the
following short-lived trees:

```text
#cal-col       ← calendar toolbar, weekday headings, day-button grid
#sidebar       ← monthly register, totals, charts, category/group rows
#planner-root  ← planner tablist, tabpanels, controls, computed results
#form-container← labeled add/edit controls
body           ← confirm, search, OCR progress, and OCR review backdrops
```

Generated markup is not a second architecture. It uses the same contracts:
native buttons for actions, native labels for fields, `aria-hidden` on
decorative icons, and `.backdrop > .modal-shell` for modal geometry.

### 1.3 Original-to-semantic comparison

| Area | Before audit | Audited structure | Why it is safe |
| --- | --- | --- | --- |
| Documentation panes | Generic `div` with visual active class | `section[role=tabpanel]` with label and hidden state | `section.docs-pane` is explicitly reset to zero margin/padding |
| Documentation navigation | `nav` containing button-like visual tabs | ARIA tablist with typed buttons, tab ownership, roving tab stop | Existing classes and child order are unchanged |
| Transaction filter | Tab semantics without actual tabpanels | Named button group with `aria-pressed` state | It filters one register; it does not switch tabpanels |
| Welcome heading | `h3` under the site `h1` | Dialog `h2`, described and modal | `.modal-title` owns typography and spacing |
| Day editor headings | `h3` then `h4` | Dialog `h2` then panel `h3` | Existing classes own visual size |
| OCR review heading | Unlabelled `h3` inside a labelled dialog | `h2` referenced by `aria-labelledby` | No wrapper or class changed |

No `.ledger-stage`, `.tracker-board`, `.site-header-inner`, modal, chart, or
form wrapper was pruned. Each is a flex/grid participant, a containment
boundary, a responsive flattening point, or a delegated-event boundary.

## SECTION 2: LAYOUT PROTECTION & CSS COUPLING GUIDE

### 2.1 Layout preservation matrix

| Critical node / selector | Mechanic | Protected behavior | Safe maintenance rule |
| --- | --- | --- | --- |
| `.app-shell` | page flex column | header/content/footer height flow | Preserve direct region order |
| `.site-header` | sticky layered header | top-edge position and stacking | Keep its z-index below backdrops |
| `.site-header-inner` | flex row | brand/status/actions alignment | Do not remove or reorder without all frame checks |
| `.app-container` | width and flex owner | centers both main views | Keep both mains as direct children |
| `#view-app` | frame-dependent grid/flex/block | shell track map | Preserve pane IDs and direct-child relationship |
| `.ledger-stage` | grid wrapper on phone; `display: contents` elsewhere | exposes toolbar/board to parent tracks | Never replace with `display:block` globally |
| `.tracker-board` | two-column grid; one column on phone; flattened at larger frames | calendar/register placement | Keep `#cal-col` and `#sidebar` as direct children |
| `.tracker-filter` | three equal grid columns | stable filter widths | Keep exactly three button children |
| `.docs-container` | navigation/content grid | documentation rail | Preserve nav before content |
| `.docs-nav` | desktop sticky flex rail; responsive tab grid | chapter navigation geometry | Preserve button children and breakpoint rules |
| `.docs-pane` | one visible block | chapter replacement | Toggle both `.active` and `hidden` |
| `.app-dock` | fixed four-column grid, z-index 180 | mobile primary navigation | Keep four direct buttons and safe-area spacing |
| `.backdrop` | fixed viewport flex layer | centering, dimming, scroll boundary | Dialog shell must remain a direct child |
| `.modal-shell` | size, border, shadow, animation | common modal surface | Semantic roles belong here, not on backdrop |
| `.modal-columns` | responsive two-column layout | editor/register split | Preserve panel wrappers |
| `.cal-grid` / `.cal-day` | seven-column grid and day cells | date alignment | Keep day cells as direct grid children |
| `.sidebar` | sticky/column register surface | monthly summary position | Preserve ID; render modules target it |
| `.sidebar-flip-inner` | overlapping 3D faces | expense/income card flip | Keep both faces rendered; make only the active face accessible |

OpenExpense uses JavaScript-owned frame states rather than relying only on
viewport media queries:

```text
html[data-frame=phone]    compact controls, one-column board
html[data-frame=tablet]   intermediate shell; grid/flex varies near 980px
html[data-frame=desktop]  named application grid tracks
html[data-shell=…]        Overview / Tracker / Planner / Privacy visibility
```

Test every structural edit at phone, tablet, and desktop widths and in all four
shell states. A desktop-only screenshot cannot validate `display: contents`,
the fixed dock, bottom safe areas, or sheet sizing.

### 2.2 Layer and stacking map

```text
document flow
  └── sticky header / sticky docs rail
      └── fixed application dock (z-index 180)
          └── modal backdrop and shell
              └── status toast / tooltip where configured
```

Do not “fix” overlap by assigning arbitrary large z-index values. Compare the
existing layer token or selector first; isolated stacking contexts created by
`transform`, `opacity`, or positioned ancestors can change the result.

### 2.3 Styling selectors versus behavior hooks

| Contract | Owner | Example | Rule |
| --- | --- | --- | --- |
| Class | CSS/presentation | `.tracker-filter-btn`, `.docs-pane` | JS may toggle documented state classes only |
| `data-action` | delegated command | `data-action="export-ledger"` | Stable public behavior hook |
| `data-view` | primary shell | `data-view="planner"` | Must match `SHELL_TABS` |
| `data-shell` | pane membership | `data-shell="overview"` | Read by `applyShell()` |
| `data-tab` | docs tab key | `data-tab="schema"` | Must match `dt-*` and `pane-*` suffixes |
| `data-tracker-filter` | filter value | `expense` | Must match store validation |
| ID | mount/name relationship | `#sidebar`, `#modal-date-title` | Change only atomically across HTML, CSS, and JS |

New event handling should select `data-*` behavior attributes. Classes remain
appropriate when code is painting a visual state (`.active`, `.is-active`,
`.open`) or locating a component-private child. A mass conversion of every
private class query to `data-*` would add markup without reducing coupling.

## SECTION 3: ACCESSIBILITY (A11Y) & UX AUDIT REPORT

### 3.1 Improvements applied

- Dialogs expose `role="dialog"` or `role="alertdialog"`, accessible names,
  `aria-modal="true"`, and descriptions where useful.
- `src/ui/dialog-focus.js` traps Tab within the topmost dialog and restores the
  launch control on close. It supports nested dialogs without changing modal
  classes, dimensions, or scroll policy.
- Documentation navigation follows the WAI-ARIA tabs pattern: `role="tab"`,
  `aria-controls`, `aria-selected`, labelled tabpanels, one roving `tabindex`,
  and Arrow/Home/End operation.
- Transaction filters now expose toggle-button state with `aria-pressed`
  instead of claiming to be tabs without tabpanels.
- Search has an accessible field name, a polite result summary, a named result
  region, trapped focus, Escape dismissal, and launch-point restoration.
- OCR review has a labelled heading, decorative icons hidden from screen
  readers, meaningful preview alternative text, Escape dismissal, focus
  containment, and restoration. The mobile day sheet adds a camera/file shortcut
  scoped to that selected day; when OCR finds another date, review presents both
  dates as explicit radio choices and blocks saving until one is confirmed.
- Static and generated close icons are decorative; their parent buttons carry
  the accessible names.
- Main-view visibility now agrees across visual CSS, DOM `hidden`, and
  `aria-hidden`, preventing duplicate main landmarks.
- The visually reversed sidebar face is `inert` and `aria-hidden`; both faces
  remain rendered so the 3D flip geometry is unchanged.
- Calendar month arrows have persistent accessible names and the changing
  month title is exposed as a polite level-two heading.
- Selectable year charts use a labelled group rather than an image role. Every
  observed or scheduled month remains in the DOM, the selected month has
  `aria-current="date"`, and a roving tab stop supports arrow, Home, and End
  keys without adding every month to the page tab order. A stable chart identity
  restores that tab stop after month selection rerenders the chart.
- Error toasts use assertive alert semantics while informational messages
  remain polite statuses; decorative toast icons are hidden.
- Keyboard focus outlines are restored for search and text fields whose
  component-level mouse-focus rules previously overrode the global
  `:focus-visible` rule.
- Heading order inside welcome, day editor, confirm, and OCR dialogs starts at
  `h2`; internal panels follow at `h3`.

These changes improve WCAG 2.2 alignment, particularly 1.3.1 Info and
Relationships, 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 3.3.2
Labels or Instructions, and 4.1.2 Name, Role, Value.

### 3.2 Keyboard walkthrough

1. Use the skip link to move to the active ledger main.
2. Tab through header controls and native action buttons.
3. In Privacy, use Left/Right or Up/Down to move chapter tabs; Home and End
   select the first and last chapter.
4. Open Add, Search, Confirm, or receipt review. Tab and Shift+Tab cycle within
   the topmost dialog.
5. Close the surface. Focus returns to the control that opened it.
6. Calendar days remain native keyboard targets through their generated
   `role="button"` and Enter/Space handling.

### 3.3 Residual review boundaries

- Financial chart visuals provide programmatic text labels, but future chart
  types must continue to expose an equivalent text summary.
- Color token changes require a fresh WCAG contrast measurement in both
  themes. This audit intentionally changed no palette values.
- `display: contents` has improved substantially across current browsers, but
  regression testing should include the supported screen-reader/browser pairs
  whenever its children gain new landmark semantics.
- OCR output is advisory. The labelled review form remains the required human
  confirmation step.

## SECTION 4: EDUCATIONAL COMPONENT SPECIMENS

The complete, runnable specimens are the canonical repository files below.
They are linked rather than copied into this manual because a second full copy
of an 8,000-line stylesheet would drift from production and teach unsafe
maintenance habits.

### 4.1 `index.html`

Canonical source: [`../index.html`](../index.html)

The file owns document metadata, landmarks, stable mount points, native
controls, accessible relationships, and the no-script explanation. It does
not own feature calculations.

```html
<nav class="docs-nav" aria-label="Documentation sections" role="tablist">
  <button type="button" id="dt-manual" class="docs-nav-tab active"
    data-tab="manual" role="tab" aria-selected="true"
    aria-controls="pane-manual" tabindex="0">…</button>
</nav>
<section id="pane-manual" class="docs-pane active"
  role="tabpanel" aria-labelledby="dt-manual" tabindex="0">…</section>
```

### 4.2 `openexpense.css` (the production stylesheet)

Canonical source: [`../openexpense.css`](../openexpense.css)

The project intentionally uses `openexpense.css`, not a duplicate
`styles.css`. It contains tokens first, primitives second, component rules
third, and frame/breakpoint overrides after the base contracts.

```css
html[data-frame="desktop"] .ledger-stage,
html[data-frame="desktop"] .tracker-board {
  /* Children participate in #view-app's named tracks. */
  display: contents;
}

.docs-pane {
  display: none;
  margin: 0;
  padding: 0;
}
```

### 4.3 DOM selection and event safety layer

There is deliberately no catch-all `ui-hooks.js`. Three focused files form
the safer layer:

- [`../src/main.js`](../src/main.js): document-level delegation through stable
  `data-*` commands;
- [`../src/app/views.js`](../src/app/views.js): shell and documentation-tab
  state synchronization;
- [`../src/ui/dialog-focus.js`](../src/ui/dialog-focus.js): modal keyboard
  boundary and focus restoration.

The separation prevents a generic hook registry from becoming a second global
state store. A new component should keep private queries inside its module and
expose only the smallest command needed by `main.js`.

```javascript
const actionElement = event.target.closest('[data-action]');
const tabElement = event.target.closest('[data-tab]');

activateDialogFocus(dialogElement, preferredInitialControl);
deactivateDialogFocus(dialogElement);
```

### 4.4 Safe extension exercise

To add a fifth documentation chapter:

1. Add one typed tab button with `data-tab="example"`,
   `id="dt-example"`, `aria-controls="pane-example"`, and the inactive tab
   state.
2. Add `section#pane-example.docs-pane[role=tabpanel]` with
   `aria-labelledby="dt-example"`, `hidden`, and `aria-hidden="true"`.
3. Do not add a click listener. Existing `[data-tab]` delegation and keyboard
   handling discover it automatically.
4. Check phone, tablet, and desktop grids. The current narrow docs layout may
   need a deliberate track count adjustment when chapter count changes.
5. Run `npm test`, `npm run build`, and a keyboard/browser smoke test.

This exercise demonstrates the architecture's central lesson: extend semantic
relationships and stable behavior hooks together while leaving visual classes
responsible for layout.
