# Clash of Clans — XP Farming Simulator

▶️ **Play it live:** https://ahnafmohsieu.github.io/Clash-of-Clans-Exp-Simulator/

A Vite-built, phone-first web app that calculates exactly how long it takes to reach your target XP level in Clash of Clans based on your daily activity.

Drag the sliders — it instantly shows XP needed, daily XP, time to target, and a per-source breakdown with a bar chart.

> Fan-made planning tool. Not affiliated with or endorsed by Supercell.

## Features

- **Your Profile** — current XP level (1–499), progress % in current level, target level (2–500)
- **Daily Activity** — multiplayer attacks/day (0–20) × avg stars/attack (0–3)
- **Daily Donations** — troop / spell / siege-machine housing donated per day
- **Builders** — builder count (0–6) × avg upgrade time (0–18 days)
- **Clan War & Events** — war attacks/week (0–14), avg war stars (0–3), seasonal XP bonus/day
- **Live results** — XP needed, daily XP, time to target, levels to climb, level-progress bar, daily XP breakdown with % bars
- **Chart** — daily XP per source (Chart.js bar chart, degrades gracefully offline)
- **Presets** — save / load / delete named setups in `localStorage`, export / import as JSON
- **Keyboard shortcuts** — `Ctrl+S` save preset, `Ctrl+E` export results, `?` help, `Esc` close
- **Phone-first HUD** — sticky XP bar, results bottom sheet, confetti on progress, share-card export

## Getting started

```bash
npm install
npm run dev
```

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

Deploy: pushing to `main` builds and publishes `dist/` to GitHub Pages automatically.
Legacy static build (double-clickable, no build step) is tagged `legacy-static`.

## How XP is calculated

Level curve (`xpForLevel` / `cumulXP` in `src/lib/xp-calculator.js`):

| Level | XP for that level |
|-------|-------------------|
| 1 | 30 |
| 2–200 | `(level - 1) × 50` |
| 201–299 | `(level - 200) × 500 + 9,500` |
| 300–500 | `(level - 300) × 1000 + 60,000` |

Total needed = `cumulXP(target) − cumulXP(current) − round(xpForLevel(current) × progress% / 100)`.

Daily XP sources:

| Source | Rate |
|--------|------|
| Multiplayer attacks | 1 XP per star (up to 3 XP/attack) |
| Donations — troops | 1 XP / housing space |
| Donations — spells | 5 XP / housing space |
| Donations — siege machines | 30 XP each |
| Builders | `√(upgrade seconds)` XP per active builder, i.e. longer upgrades = more XP |
| Clan wars | 5 XP per war star, capped at 14 stars/week, averaged to per-day |
| Seasonal / events | 1:1 bonus XP/day as entered |

Time to target = `ceil(XP needed / daily XP)` (shown as days / weeks / months / years). Zero daily XP shows `—`.

Slider scaling note: donation sliders are scaled in the app (`troops × 500`, `spells × 50`, `siege × 5`) to keep the 0–200 slider range usable — the badge shows the real housing count.

## Project structure

```text
src/
  main.js            # app boot, input wiring, render, juice
  styles.css         # Tailwind + design tokens (gold/night/wood/stone)
  lib/
    xp-calculator.js # XP engine (level curve + per-source calculators)
    utils.js         # fmtK, clamp, sanitizeHTML, generateId, deepClone, …
    presets.js       # localStorage presets (max 50, 5 MB cap), export/import
    results.js       # duration formatting, warnings, breakdown percentages
    state.js         # default state + input clamping + param mapping
    chart.js         # Chart.js wrapper with lazy CDN loading
    juice.js         # tween frames, celebration rules, share-card text
scripts/             # node check scripts (parity, state, results, juice, presets)
```

Vite bundles `src/` into `dist/`; the GitHub Actions workflow deploys `dist/` to Pages.

## Presets

- Stored under `localStorage` key `xp-simulator-presets` (max 50 presets, 5 MB cap, duplicate names rejected).
- Export writes `xp-simulator-presets-<timestamp>.json`; import merges by `id`, skipping duplicates.
- Results export writes `xp-simulator-results-<timestamp>.json` (`{ state, timestamp }`).

## Tech

- Vanilla JS ES modules + Vite build, Tailwind CSS v4
- [Chart.js 4.4.1](https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js) via CDN (optional — app runs without it)
- Fonts: Inter + Cinzel + Sora via Google Fonts (optional — falls back to system fonts offline)
- PWA: `vite-plugin-pwa` (Workbox precache + runtime caching for fonts/CDN) — installable when served over HTTP
- Design tokens in `src/styles.css` Tailwind `@theme` (`--color-gold/night/wood/stone`, `--font-display/body`)

## Limitations

- XP rates/level curve are approximations for planning — verify against in-game values for your Town Hall / Clan Perks / events.
- Donation caps noted in the UI (100k troop spaces, 10k spell spaces, 1k sieges/day) are display hints, not enforced.
- Presets live in the browser that saved them — use Export/Import to move them between devices.
- Service worker requires HTTP(S). For `file://` use, grab the legacy static build at tag `legacy-static`.
- Fonts/Chart.js load from CDN with system-font/no-chart fallback offline.
