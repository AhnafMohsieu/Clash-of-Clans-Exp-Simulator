# Clash of Clans — XP Farming Simulator

A static, no-build web app that calculates exactly how long it takes to reach your target XP level in Clash of Clans based on your daily activity.

Open `XPC/index.html` and drag the sliders — it instantly shows XP needed, daily XP, time to target, and a per-source breakdown with a bar chart.

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
- **Works from `file://`** — the shipped `XPC/js/app.js` is a single bundled file (no ES modules), so double-clicking `index.html` works without a server

## Getting started

No install, no build.

Option 1 — just open it:

```text
XPC/index.html
```

Option 2 — serve it locally (needed only if you want to use the modular `xp-calculator.js` / `utils.js` / etc. sources directly):

```powershell
# from the repo root
npx serve "New folder"
# or
python -m http.server 8000
```

Then open `http://localhost:8000/XPC/`.

## How XP is calculated

Level curve (`xpForLevel` / `cumulXP` in `XPC/js/xp-calculator.js`):

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
XPC/
  index.html          # all UI: profile, activity, donations, builders, war, presets, results, chart
  css/
    main.css          # layout, cards, sliders
    components.css    # result cards, breakdown rows, warnings
    themes.css        # gold theme
  js/
    app.js            # shipped bundle — everything inlined, no imports (this is what index.html loads)
    xp-calculator.js  # modular XP engine (level curve + per-source calculators)
    utils.js          # fmtK, clamp, sanitizeHTML, generateId, deepClone, …
    presets.js        # localStorage presets (max 50, 5 MB cap), export/import
    chart.js          # Chart.js wrapper (init / update / export)
```

`app.js` duplicates the modular sources so the page works over `file://`. If you edit `xp-calculator.js` / `utils.js` / `presets.js` / `chart.js`, re-bundle the changed logic into `app.js`.

## Presets

- Stored under `localStorage` key `xp-simulator-presets` (max 50 presets, 5 MB cap, duplicate names rejected).
- Export writes `xp-simulator-presets-<timestamp>.json`; import merges by `id`, skipping duplicates.
- Results export writes `xp-simulator-results-<timestamp>.json` (`{ state, timestamp }`).

## Tech

- Vanilla HTML + CSS + JS, no framework, no build step
- [Chart.js 4.4.1](https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js) via CDN (optional — app runs without it)
- Fonts: Inter + Cinzel via Google Fonts (optional — falls back to system fonts offline)
- PWA: `manifest.json` + `sw.js` (cache `coc-xp-v1`) + `offline.html` — installable when served over HTTP; `file://` use unaffected
- Design tokens in `XPC/css/themes.css` (`--space-*`, `--radius-*`, `--font-body`, `--text-*`)

## Limitations

- XP rates/level curve are approximations for planning — verify against in-game values for your Town Hall / Clan Perks / events.
- Donation caps noted in the UI (100k troop spaces, 10k spell spaces, 1k sieges/day) are display hints, not enforced.
- Presets live in the browser that saved them — use Export/Import to move them between devices.
- Service worker requires HTTP(S) — it is skipped automatically on `file://`.
- Sora/Chart.js load from CDN with system-font/no-chart fallback offline.
