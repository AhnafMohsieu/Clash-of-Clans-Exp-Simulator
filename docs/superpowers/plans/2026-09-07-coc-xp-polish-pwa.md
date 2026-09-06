# CoC XP Polish + PWA Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the XP Farming Simulator to the Ibadah-Quest look and add an installable PWA shell, changing no XP math, features, or storage schema.

**Architecture:** Edit-in-place on the existing static files: tokens in `themes.css`, layout in `main.css`, components in `components.css`, all JS in the shipped bundle `XPC/js/app.js` (new UI-only code lives there directly — no new modules, no build step). New PWA files at repo root with `file://`-safe guarded registration.

**Tech Stack:** Vanilla HTML/CSS/JS, Sora + Inter + Cinzel via Google Fonts, Chart.js CDN (unchanged), Service Worker + Web App Manifest (new).

## Global Constraints

- No build step, no new npm dependencies, no bundler.
- `XPC/index.html` must keep working when double-clicked via `file://` with zero console errors.
- XP math (`xpForLevel`, `cumulXP`, `totalNeeded`, all source rates) must not change.
- Slider ranges, element IDs, app state shape, and preset storage schema (`xp-simulator-presets`, 50 max, 5MB cap) must not change.
- Chart.js stays CDN-optional with graceful degradation.
- Single brand accent: gold `#FFD700`.
- `prefers-reduced-motion` must disable transitions/animations.

---

### Task 1: Design tokens + font stack

**Files:**
- Modify: `XPC/css/themes.css`
- Modify: `XPC/index.html` (font `<link>` only, lines 9-10)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: CSS custom properties `--space-*`, `--radius-*`, `--font-body`, `--font-display`, `--text-*` used by Tasks 2 and 5.

- [ ] **Step 1: Add tokens to `themes.css`**

Replace the file content with the existing `:root` block plus the new tokens (keep every existing variable byte-identical):

```css
/* Theme definitions */
:root, [data-theme="gold"] {
  --acc: #FFD700;
  --acc-dim: #AA7700;
  --acc-glow: rgba(255, 215, 0, 0.35);
  --acc-tint: rgba(255, 215, 0, 0.08);
  --acc-border: rgba(255, 215, 0, 0.25);
  --h1a: #FFD700;
  --h1b: #FF8C00;
  --h1c: #FF4500;

  /* Spacing + radius + type (Ibadah-style system) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 14px;
  --space-4: 20px;
  --space-5: 28px;
  --radius-sm: 7px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --font-body: 'Sora', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Cinzel', serif;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 32px;
}
```

- [ ] **Step 2: Add Sora to the font link in `index.html`**

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Verify in browser**

Run: open `XPC/index.html` via `file://`, open DevTools console.
Expected: zero errors; computed `font-family` of `body` shows `Sora` first (falls back to `Inter`/system offline — that is correct).

- [ ] **Step 4: Commit**

```bash
git add XPC/css/themes.css XPC/index.html
git commit -m "style: add design tokens and Sora font stack"
```

### Task 2: Card, slider, and responsive refresh

**Files:**
- Modify: `XPC/css/main.css`
- Modify: `XPC/css/components.css`

**Interfaces:**
- Consumes: tokens from Task 1 (`--space-*`, `--radius-*`, `--font-body`).
- Produces: final card/slider/grid visuals used by all later tasks (no JS interface).

- [ ] **Step 1: Use tokens for layout in `main.css`**

Replace the hardcoded values (keep selectors and behavior identical):

```css
.shell {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 5rem;
}

.g2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.g3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
}

@media (max-width: 620px) {
  .g2, .g3 {
    grid-template-columns: 1fr;
  }
}

.don-wrap {
  margin-bottom: var(--space-3);
}
```

And switch the body font:

```css
body {
  font-family: var(--font-body);
  ...
}
```

(Keep the existing background, color, min-height, and antialiasing lines unchanged.)

- [ ] **Step 2: Refresh cards in `components.css`**

Make exactly these three edits, nothing else:

1. `.card` — change `border-radius: 14px` to `border-radius: var(--radius-lg)` and add `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);`.
2. `.card:hover` — replace `transform: translateX(3px);` with `border-color: rgba(255, 255, 255, 0.12);` (removes the sideways shift that reads as a bug).
3. `.rcards` — add a mid breakpoint after the existing `@media (max-width: 600px)` block:

```css
@media (max-width: 400px) {
  .rcards {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Add slider track fill + touch targets in `components.css`**

Append at the end of the file (new code only, no edits to existing slider rules):

```css
/* Filled slider track (fill % set from JS via --fill) */
input[type="range"] {
  background: linear-gradient(90deg, var(--acc) var(--fill, 0%), #0d1018 var(--fill, 0%));
}

/* 44px touch targets on coarse pointers */
@media (pointer: coarse) {
  input[type="range"] {
    height: 12px;
  }
  input[type="range"]::-webkit-slider-thumb {
    width: 28px;
    height: 28px;
  }
  input[type="range"]::-moz-range-thumb {
    width: 28px;
    height: 28px;
  }
}
```

- [ ] **Step 4: Verify in browser**

Run: open `XPC/index.html` via `file://` at desktop width and at 360px width (DevTools device toolbar).
Expected: cards have soft shadow and no sideways hover jump; sliders show gold fill left of thumb; 360px layout is single-column with no overlap; console has zero errors.

- [ ] **Step 5: Commit**

```bash
git add XPC/css/main.css XPC/css/components.css
git commit -m "style: refresh cards, slider fill, responsive breakpoints"
```

### Task 3: Toast + modal system (replaces alert/prompt/confirm)

**Files:**
- Modify: `XPC/js/app.js` (append new module section before the `// ── Boot ──` block; rewire `showSavePresetModal`, `deleteCurrentPreset`, `showHelpModal`, export/import feedback)
- Modify: `XPC/index.html` (append `<div id="toast-root">` and `<div id="modal-root">` just before `<!-- Application -->`)
- Modify: `XPC/css/components.css` (append toast + modal styles)

**Interfaces:**
- Consumes: existing `sanitizeHTML(str)` in `app.js` (already defined); existing button IDs (`save-preset-btn`, `delete-preset-btn`, `export-presets-btn`, `import-presets-btn`).
- Produces: `showToast(msg)`, `openModal({title, bodyHTML, actions})`, `closeModal()` used by Task 4.

- [ ] **Step 1: Add toast/modal containers to `index.html`**

```html
<!-- Toast + modal roots -->
<div id="toast-root" aria-live="polite"></div>
<div id="modal-root"></div>

<!-- Application -->
```

- [ ] **Step 2: Append toast/modal styles to `components.css`**

```css
/* Toasts */
#toast-root {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}

.toast {
  background: #10161e;
  border: 1px solid var(--acc-border);
  color: #eef2ff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  animation: toast-in 0.25s ease;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 12, 0.7);
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  background: linear-gradient(135deg, #0c1018, #10161e);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  max-width: 400px;
  width: 100%;
}

.modal h2 {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--acc);
  margin-bottom: 12px;
}

.modal input[type="text"] {
  width: 100%;
  background: #0d1018;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 600;
  color: #eef2ff;
  outline: none;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #eef2ff;
}

.modal-actions button.primary {
  background: var(--acc);
  color: #000;
  border: none;
}
```

- [ ] **Step 3: Add toast/modal JS to `app.js`**

Insert this block immediately before the `// ── Boot ──` section:

```js
// ── Toast + Modal (replaces alert/prompt/confirm) ──
function showToast(msg) {
  var root = document.getElementById('toast-root');
  if (!root) return;
  var el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

function openModal(opts) {
  closeModal();
  var root = document.getElementById('modal-root');
  if (!root) return null;
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
  var box = document.createElement('div');
  box.className = 'modal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  var h = document.createElement('h2');
  h.textContent = opts.title;
  box.appendChild(h);
  var body = document.createElement('div');
  body.innerHTML = opts.bodyHTML || '';
  box.appendChild(body);
  var row = document.createElement('div');
  row.className = 'modal-actions';
  (opts.actions || []).forEach(function(a) {
    var b = document.createElement('button');
    b.textContent = a.label;
    if (a.primary) b.className = 'primary';
    b.addEventListener('click', function() { if (a.onClick) a.onClick(body); });
    row.appendChild(b);
  });
  box.appendChild(row);
  overlay.appendChild(box);
  root.appendChild(overlay);
  var input = box.querySelector('input');
  if (input) input.focus();
  return box;
}

function closeModal() {
  var root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}
```

- [ ] **Step 4: Rewire the four call sites in `app.js`**

1. `showSavePresetModal` — replace the `prompt()` version with:

```js
function showSavePresetModal() {
  openModal({
    title: 'Save Preset',
    bodyHTML: '<input type="text" id="preset-name-input" placeholder="Preset name" maxlength="60">',
    actions: [
      { label: 'Cancel', onClick: function() { closeModal(); } },
      { label: 'Save', primary: true, onClick: function(body) {
        var input = body.querySelector('#preset-name-input');
        var name = input ? input.value : '';
        var result = savePreset(name, state);
        if (result.success) { closeModal(); showToast('Preset saved!'); updatePresetList(); }
        else showToast('Error: ' + result.error);
      }}
    ]
  });
}
```

2. `deleteCurrentPreset` — replace the whole function with:

```js
function deleteCurrentPreset() {
  var select = document.getElementById('load-preset-select');
  var id = select && select.value;
  if (!id) { showToast('Select a preset to delete'); return; }
  openModal({
    title: 'Delete Preset',
    bodyHTML: '<p class="tip-note">Delete this preset? This cannot be undone.</p>',
    actions: [
      { label: 'Cancel', onClick: function() { closeModal(); } },
      { label: 'Delete', primary: true, onClick: function() {
        var result = deletePreset(id);
        if (result.success) { closeModal(); showToast('Preset deleted'); updatePresetList(); }
        else showToast('Error: ' + result.error);
      }}
    ]
  });
}
```
3. `showHelpModal` — replace the `alert(...)` with `openModal({ title: 'Keyboard Shortcuts', bodyHTML: '<p class="tip-note">Ctrl+S: Save preset<br>Ctrl+E: Export results<br>?: Show this help<br>Esc: Close</p>', actions: [{ label: 'Close', primary: true, onClick: function() { closeModal(); } }] })`.
4. `loadPresetById` (`alert('Error: ' + result.error)`) and `importPresetsFromFile` (`alert('Imported ' + ...)` / `alert('Import failed: ' + ...)`) — replace each `alert(...)` with `showToast(...)` carrying the same message text.

- [ ] **Step 5: Verify in browser**

Run: open `XPC/index.html` via `file://`, click Save Current (modal with input appears), save a preset (toast "Preset saved!"), delete it (confirm modal, toast "Preset deleted"), press `?` (help dialog, `Esc` closes it).
Expected: no `alert`/`prompt`/`confirm` dialogs anywhere; toasts auto-dismiss; console has zero errors.

- [ ] **Step 6: Commit**

```bash
git add XPC/js/app.js XPC/index.html XPC/css/components.css
git commit -m "feat: replace native dialogs with toast and modal system"
```

### Task 4: Slider fill wiring + slider aria labels + shortcut footer

**Files:**
- Modify: `XPC/js/app.js` (`updateDisplayValues` + `applyThumbStyles` area)
- Modify: `XPC/index.html` (aria labels on the 11 sliders + footer before `</div>` of `.shell`)

**Interfaces:**
- Consumes: `--fill` convention from Task 2 Step 3; `state` object (unchanged).
- Produces: nothing new (wiring only).

- [ ] **Step 1: Set `--fill` on every slider update in `app.js`**

Add at the top of `updateDisplayValues()`:

```js
function paintSliderFill(id) {
  var el = document.getElementById(id);
  if (!el || el.type !== 'range') return;
  var min = parseFloat(el.min) || 0;
  var max = parseFloat(el.max) || 100;
  var v = parseFloat(el.value) || 0;
  var pct = max > min ? Math.round(((v - min) / (max - min)) * 100) : 0;
  el.style.setProperty('--fill', pct + '%');
}

['xpPct', 'atkSlider', 'starsSlider', 'troopSlider', 'spellSlider', 'siegeSlider', 'bldSlider', 'upgSlider', 'warSlider', 'warStarsSlider', 'seasonSlider'].forEach(paintSliderFill);
```

- [ ] **Step 2: Add aria labels in `index.html`**

Add an `aria-label` to each of the 11 range inputs matching its visible label (exact strings): `xpPct` → `aria-label="XP progress in current level"`, `atkSlider` → `aria-label="Multiplayer attacks per day"`, `starsSlider` → `aria-label="Average stars per attack"`, `troopSlider` → `aria-label="Troop housing donated per day"`, `spellSlider` → `aria-label="Spell housing donated per day"`, `siegeSlider` → `aria-label="Siege machines donated per day"`, `bldSlider` → `aria-label="Number of builders"`, `upgSlider` → `aria-label="Average upgrade time in days"`, `warSlider` → `aria-label="War attacks per week"`, `warStarsSlider` → `aria-label="Average war stars per attack"`, `seasonSlider` → `aria-label="Seasonal XP bonus per day"`. Example:

```html
<input type="range" id="atkSlider" aria-label="Multiplayer attacks per day" min="0" max="20" value="0" step="1">
```

- [ ] **Step 3: Add shortcut hint footer in `index.html`**

Insert just before the closing `</div>` of `.shell` (after the Commander Tips block):

```html
<!-- Shortcut hints -->
<footer class="foot-hints">
  <span><kbd>Ctrl+S</kbd> save preset</span>
  <span><kbd>Ctrl+E</kbd> export</span>
  <span><kbd>?</kbd> shortcuts</span>
  <span><kbd>Esc</kbd> close</span>
</footer>
```

Style it by appending to `components.css`:

```css
.foot-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  margin-top: 18px;
  font-size: 12px;
  color: #556677;
  font-weight: 500;
}

.foot-hints kbd {
  background: #0d1018;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1px 6px;
  font-family: inherit;
  font-size: 11px;
  color: #99aabb;
}
```

- [ ] **Step 4: Verify in browser**

Run: open `XPC/index.html`, drag each slider end-to-end, tab through the page with a keyboard.
Expected: gold fill tracks thumb position on all 11 sliders; screen-reader/keyboard focus order is logical; footer hints visible; console has zero errors.

- [ ] **Step 5: Commit**

```bash
git add XPC/js/app.js XPC/index.html XPC/css/components.css
git commit -m "feat: slider fill, aria labels, shortcut footer"
```

### Task 5: Focus rings + reduced motion

**Files:**
- Modify: `XPC/css/components.css` (append)

**Interfaces:**
- Consumes: `--acc` token. Produces: nothing (pure CSS).

- [ ] **Step 1: Append focus + reduced-motion CSS**

```css
/* Visible keyboard focus */
:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 2px;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify in browser**

Run: open `XPC/index.html`, tab through sliders/buttons/inputs; then emulate `prefers-reduced-motion` in DevTools rendering panel and drag a slider.
Expected: gold focus ring on every interactive element; with reduced motion there are no animated transitions; console has zero errors.

- [ ] **Step 3: Commit**

```bash
git add XPC/css/components.css
git commit -m "style: focus rings and reduced-motion support"
```

### Task 6: PWA shell (manifest, icon, service worker, offline page)

**Files:**
- Create: `manifest.json`
- Create: `assets/icon.svg`
- Create: `sw.js`
- Create: `offline.html`
- Modify: `XPC/index.html` (head meta + SW registration before `</body>`)

**Interfaces:**
- Consumes: toast/modal from Task 3 (not used here — SW failures stay silent by design). Produces: installable PWA; `XPC/index.html` works identically on `file://`.

- [ ] **Step 1: Create `manifest.json`**

```json
{
  "name": "CoC XP Farming Simulator",
  "short_name": "CoC XP Sim",
  "description": "Calculate how long it takes to reach your target XP level in Clash of Clans.",
  "start_url": "XPC/index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0a0c14",
  "theme_color": "#FFD700",
  "icons": [
    { "src": "assets/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 2: Create `assets/icon.svg`**

Gold shield with a star on the dark background (maskable-safe, no text):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0a0c14"/>
  <path d="M256 72 L408 128 V256 C408 348 336 412 256 440 C176 412 104 348 104 256 V128 Z" fill="none" stroke="#FFD700" stroke-width="28"/>
  <path d="M256 168 L286 238 L362 244 L302 292 L320 366 L256 326 L192 366 L210 292 L150 244 L226 238 Z" fill="#FFD700"/>
</svg>
```

- [ ] **Step 3: Create `sw.js`**

Versioned cache-first for local assets, network-first for CDN; cache name MUST be `coc-xp-v1`:

```js
/* CoC XP Simulator service worker (Ibadah-style PWA shell) */
var CACHE = 'coc-xp-v1';
var LOCAL_ASSETS = [
  './',
  'XPC/index.html',
  'XPC/css/themes.css',
  'XPC/css/main.css',
  'XPC/css/components.css',
  'XPC/js/app.js',
  'offline.html',
  'assets/icon.svg',
  'manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) { return cache.addAll(LOCAL_ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(function(hit) { return hit || fetch(event.request); })
        .catch(function() { return caches.match('offline.html'); })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(function() { return caches.match(event.request); })
    );
  }
});
```

- [ ] **Step 4: Create `offline.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#FFD700">
  <title>Offline — CoC XP Simulator</title>
  <style>
    body { background: #0a0c14; color: #eef2ff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    h1 { color: #FFD700; }
    a { color: #FFD700; }
  </style>
</head>
<body>
  <main>
    <h1>⚔️ You're offline</h1>
    <p>The XP Simulator needs a connection for its first load.<br>Reconnect and <a href="XPC/index.html">try again</a>.</p>
  </main>
</body>
</html>
```

- [ ] **Step 5: Wire `index.html` head + SW registration**

In `<head>`, after the stylesheet links, add:

```html
<!-- PWA -->
<link rel="manifest" href="../manifest.json">
<meta name="theme-color" content="#FFD700">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="../assets/icon.svg">
```

Just before `</body>`, add:

```html
<!-- Service worker (http only: file:// keeps working without it) -->
<script>
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('../sw.js').catch(function(e) {
        console.warn('SW registration failed:', e);
      });
    });
  }
</script>
```

- [ ] **Step 6: Verify both modes**

Run A (file mode): open `XPC/index.html` via `file://`.
Expected: app works, console shows no SW errors (registration skipped).

Run B (served mode): `npx serve .` from repo root, open the served `XPC/index.html`, then go offline in DevTools and reload.
Expected: SW registers, app shell loads from cache; hard-navigate to an uncached URL shows `offline.html`. Also run `node --check sw.js` — expected exit 0.

- [ ] **Step 7: Commit**

```bash
git add manifest.json assets/icon.svg sw.js offline.html XPC/index.html
git commit -m "feat: add PWA shell with offline support"
```

### Task 7: README update + full verification + push

**Files:**
- Modify: `README.md`
- Verify: everything from Tasks 1–6

**Interfaces:**
- Consumes: all previous tasks. Produces: pushed `main`.

- [ ] **Step 1: Update `README.md`**

Add after the Tech section's font line:

```markdown
- PWA: `manifest.json` + `sw.js` (cache `coc-xp-v1`) + `offline.html` — installable when served over HTTP; `file://` use unaffected
- Design tokens in `XPC/css/themes.css` (`--space-*`, `--radius-*`, `--font-body`, `--text-*`)
```

And append to the Limitations section:

```markdown
- Service worker requires HTTP(S) — it is skipped automatically on `file://`.
- Sora/Chart.js load from CDN with system-font/no-chart fallback offline.
```

- [ ] **Step 2: Run the full spec checklist (Section 4)**

1. `file://` open — zero console errors, all sliders update results.
2. Served (`npx serve .`) — SW registers, offline reload serves cache/`offline.html`.
3. Presets: save (modal) → load → export → delete → import round-trip.
4. Block Chart.js CDN (DevTools request blocking) — app runs, chart degrades.
5. 360px viewport — single column, no overlap.
6. Keyboard: `Ctrl+S`, `Ctrl+E`, `?`, `Esc`, visible focus rings.
7. `git status --short` shows only intended files per task.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: document PWA shell and design tokens"
git push origin main
```

Expected: push reports `main -> main` with no errors.
