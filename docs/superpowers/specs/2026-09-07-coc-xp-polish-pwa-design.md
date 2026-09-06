# CoC XP Simulator — Ibadah-Style Polish + PWA Shell (Design)

Date: 2026-09-07 | Approach: A (approved) | Scope: polish only, no new calculators

## Goal

Make the Clash of Clans XP Farming Simulator look and feel like the
Ibadah-Quest app (dark premium cards, clean type, toasts, mobile layout,
installable PWA) without changing XP math, features, or the no-build
`file://` workflow.

## Section 1 — Visual system (approved)

- Design tokens in `XPC/css/themes.css`: spacing scale, radius scale,
  `--font-display` (Cinzel, hero only), `--font-body` (Sora → Inter →
  system), `--text-*` size scale.
- Sora loaded via Google Fonts with Inter fallback; offline falls back
  to system fonts (same graceful pattern as today).
- Cards: 16px radius, 1px borders, soft shadow; remove the sideways
  `translateX(3px)` hover shift; keep the left accent bar.
- Sliders: filled-track effect via JS-set gradient, 44px touch targets
  on coarse pointers, keep per-card thumb colors.
- Result cards: 4 → 2 → 1 column breakpoints (900px / 600px / 400px).
- `prefers-reduced-motion` disables transitions/animations.
- Gold (`#FFD700`) stays the single brand accent.

## Section 2 — PWA shell (approved)

- `manifest.json` at repo root (scope covers `XPC/`): name
  "CoC XP Farming Simulator", `display: standalone`, gold
  `theme_color`/`background_color`, inline SVG icon (gold shield).
- `sw.js` at repo root: versioned cache (`coc-xp-v1`) of
  `XPC/index.html`, CSS, `js/app.js`, `offline.html`; cache-first for
  local assets, network-first for CDN (Chart.js, fonts); bump version
  per release.
- `offline.html` at repo root: minimal gold-themed retry page.
- `index.html` head: `<link rel="manifest">`, `theme-color`,
  `apple-touch-icon`, `mobile-web-app-capable`; SW registration script
  guarded by `location.protocol.startsWith('http')` so `file://`
  double-click keeps working with zero errors.

## Section 3 — UX + accessibility (approved)

- New toast + modal module inside bundled `app.js` (mirrors
  `sanitizeHTML` usage): `showToast(msg)` auto-dismiss ~3s,
  `showModal({title, body, actions})` for save-preset (inline input,
  replaces `prompt()`), delete-preset confirm (replaces `confirm()`),
  help (replaces `alert()` with real dialog).
- Export/import/results actions report success/failure via toast.
- Sliders get `aria-label`s; number inputs get `<label>`s; visible
  `:focus-visible` rings in gold.
- Keyboard shortcuts unchanged (`Ctrl+S`, `Ctrl+E`, `?`, `Esc`); add a
  visible shortcut hint footer so they are discoverable.
- Preset storage schema (`xp-simulator-presets`, 50 max, 5MB cap)
  unchanged and forward-compatible.

## Section 4 — Boundaries + verification (approved)

Untouched:

- XP math: `xpForLevel`, `cumulXP`, `totalNeeded`, all source rates
  (attacks 1/star, troops 1, spells 5, siege 30, builders
  `sqrt(seconds)`, wars 5/star cap 14/wk, season 1:1).
- Slider ranges, element IDs, state shape.
- Chart.js usage and graceful no-CDN degradation.
- Single-file bundled `app.js` pattern (edits mirrored from modular
  sources as today); no build step, no new dependencies.

Verification (manual checklist):

1. Open via `file://` — no console errors, all sliders update results.
2. Serve via `npx serve` — SW registers, install prompt available,
   offline reload shows `offline.html` or cached app.
3. Presets: save (modal) → load → export → delete → import round-trip.
4. Block Chart.js CDN — app runs, chart area degrades cleanly.
5. 360px viewport — single column, 44px slider targets, no overlap.
6. Keyboard: `Ctrl+S`, `Ctrl+E`, `?`, `Esc`, tab focus rings visible.
7. README updated with PWA + fonts + verification notes.

## File plan (for implementation)

- Edit: `XPC/index.html` (head meta, toast/modal containers, footer,
  SW registration, aria labels).
- Edit: `XPC/css/themes.css` (tokens), `main.css` (layout/responsive),
  `components.css` (cards, sliders, toast, modal, footer).
- Edit: `XPC/js/app.js` (+ mirror in `utils.js`/`chart.js`/`presets.js`
  where the logic canonicaly lives: toast/modal, track fill, dialogs).
- Add: `manifest.json`, `sw.js`, `offline.html`, `assets/icon.svg`
  (gold shield, referenced by manifest + apple-touch-icon).
- Edit: `README.md` (PWA + design-token notes).
