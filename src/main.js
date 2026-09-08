import './styles.css';
import { calculateXP, totalNeeded, xpForLevel } from './lib/xp-calculator.js';
import { getDefaultState, applyInput, collectParams } from './lib/state.js';
import { fmtK, loc } from './lib/utils.js';
import { formatDuration, breakdownPct, warnings, daysToTarget } from './lib/results.js';
import { updateChart, ensureChart } from './lib/chart.js';

const state = getDefaultState();
const IDS = ['curLvl','xpPct','tgtLvl','atkSlider','starsSlider','troopSlider','spellSlider','siegeSlider','bldSlider','upgSlider','warSlider','warStarsSlider','seasonSlider'];

let latestXpData = null;
let chartOpen = typeof matchMedia === 'function' ? matchMedia('(min-width: 640px)').matches : true;

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderBadges() {
  setText('xpPctOut', state.profile.xpProgress + '%');
  setText('atkOut', state.activity.attacks);
  setText('starsOut', state.activity.stars);
  setText('troopOut', fmtK(state.donations.troops * 500));
  setText('spellOut', fmtK(state.donations.spells * 50));
  setText('siegeOut', fmtK(state.donations.siege * 5));
  setText('bldOut', state.builders.count);
  setText('upgOut', state.builders.upgradeTime + 'd');
  setText('warOut', state.war.attacks);
  setText('warStarsOut', state.war.stars);
  setText('seasonOut', state.war.seasonalBonus);
}

function renderHUD(xpData, needed) {
  const days = daysToTarget(needed, xpData.total.daily);
  const xpNow = xpForLevel(state.profile.currentLevel);
  const earned = Math.round(xpNow * state.profile.xpProgress / 100);
  setText('hud-level', 'Level ' + state.profile.currentLevel);
  const fill = document.getElementById('hud-xp-fill');
  if (fill) fill.style.width = state.profile.xpProgress + '%';
  setText('hud-xp-label', state.profile.xpProgress + '% \u00b7 ' + earned.toLocaleString() + ' / ' + xpNow.toLocaleString() + ' XP');
  setText('hud-days', formatDuration(days).short);
  const bar = fill ? fill.parentElement : null;
  if (bar && bar.getAttribute('role') === 'progressbar') bar.setAttribute('aria-valuenow', String(state.profile.xpProgress));
}

function generateBreakdownRows(xpData) {
  const sources = [
    { name: 'Multiplayer Attacks', xp: xpData.attacks.xp, color: '#FFD700' },
    { name: 'Builder Upgrades', xp: xpData.builders.xp, color: '#2E86DE' },
    { name: 'Donations', xp: xpData.donations.xp, color: '#00E5FF', hasSub: true },
    { name: 'Clan Wars', xp: xpData.wars.xp, color: '#E04040' },
    { name: 'Seasonal / Events', xp: xpData.season.xp, color: '#B04FFF' }
  ];
  return sources.map(function(s) {
    const pct = breakdownPct(s.xp, xpData.total.daily);
    let sub = '';
    if (s.hasSub && xpData.donations.xp > 0) {
      sub = '<div class="sub-row"><span class="sub-name">\u2503 Troops (' + fmtK(xpData.donations.breakdown.troops) + ' XP)</span><span class="sub-detail">\u00d7 1 XP / space</span><span class="sub-xp">' + loc(xpData.donations.breakdown.troops) + ' XP</span></div>' +
        '<div class="sub-row"><span class="sub-name">\u2503 Spells (' + fmtK(xpData.donations.breakdown.spells) + ' XP)</span><span class="sub-detail">\u00d7 5 XP / space</span><span class="sub-xp">' + loc(xpData.donations.breakdown.spells) + ' XP</span></div>' +
        '<div class="sub-row"><span class="sub-name">\u2503 Siege Machines (' + fmtK(xpData.donations.breakdown.siege) + ' XP)</span><span class="sub-detail">\u00d7 30 XP each</span><span class="sub-xp">' + loc(xpData.donations.breakdown.siege) + ' XP</span></div>';
    }
    return '<div class="bk-row"><span class="bk-dot" style="background:' + s.color + '"></span><span class="bk-name">' + s.name + '</span><div class="bk-bar"><div class="bk-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div><span class="bk-xp">' + loc(s.xp) + '</span><span class="bk-pct">' + pct + '%</span></div>' + sub;
  }).join('');
}

function generateWarningsMarkup(xpData, days) {
  return warnings(xpData.total.daily > 0, days).map(function(m) { return '<div class="warn">\u26a0\ufe0f ' + m + '</div>'; }).join('');
}

function renderResults(xpData, needed) {
  const days = daysToTarget(needed, xpData.total.daily);
  const time = formatDuration(days);
  const timeStr = time.short;
  const timeLong = time.long;
  const xpNow = xpForLevel(state.profile.currentLevel);
  const earned = Math.round(xpNow * state.profile.xpProgress / 100);
  const rc = document.getElementById('results');
  if (!rc) return;
  rc.innerHTML =
    '<div class="rcards">' +
      '<div class="rcard" style="border:1px solid rgba(255,255,255,0.06)"><div class="rc-top" style="background:linear-gradient(90deg,#AA7700,#FFD700)"></div><div class="rc-lbl">XP Needed</div><div class="rc-val" style="color:#FFD700">' + (needed >= 1000 ? fmtK(needed) : loc(needed)) + '</div><div class="rc-sub">to reach lvl ' + state.profile.targetLevel + '</div></div>' +
      '<div class="rcard" style="border:1px solid rgba(255,255,255,0.06)"><div class="rc-top" style="background:linear-gradient(90deg,#1A5276,#2E86DE)"></div><div class="rc-lbl">Daily XP</div><div class="rc-val" style="color:#ccd6e0">' + fmtK(xpData.total.daily) + '</div><div class="rc-sub">at current pace</div></div>' +
      '<div class="rcard" style="border:1px solid rgba(255,255,255,0.06)"><div class="rc-top" style="background:linear-gradient(90deg,#AA7700,#FFD700,#FFF066)"></div><div class="rc-lbl">Time to Target</div><div class="rc-val" style="color:#FFD700;text-shadow:0 0 20px rgba(255,215,0,0.4)">' + timeStr + '</div><div class="rc-sub">' + timeLong + '</div></div>' +
      '<div class="rcard" style="border:1px solid rgba(255,255,255,0.06)"><div class="rc-top" style="background:linear-gradient(90deg,#1D6A35,#27AE60)"></div><div class="rc-lbl">Levels to Climb</div><div class="rc-val" style="color:#ccd6e0">' + (state.profile.targetLevel - state.profile.currentLevel) + '</div><div class="rc-sub">lvl ' + state.profile.currentLevel + ' \u2192 ' + state.profile.targetLevel + '</div></div>' +
    '</div>' +
    '<div class="prog-wrap" style="border:1px solid rgba(255,255,255,0.05)"><div class="prog-hdr"><span class="prog-lbl">Level ' + state.profile.currentLevel + ' Progress</span><span class="prog-val">' + state.profile.xpProgress + '% \u00b7 ' + earned.toLocaleString() + ' / ' + xpNow.toLocaleString() + ' XP</span></div><div class="prog-track"><div class="prog-fill" style="width:' + state.profile.xpProgress + '%"></div></div></div>' +
    '<div class="bk-wrap" style="border:1px solid rgba(255,255,255,0.05)"><p class="bk-title"><span>\u26a1</span>Daily XP Breakdown</p>' + generateBreakdownRows(xpData) + '<div style="display:flex;justify-content:flex-end;padding-top:8px;font-size:12px;color:#8899aa;">Total: <strong style="color:var(--acc)">' + loc(xpData.total.daily) + ' XP / day</strong></div></div>' +
    generateWarningsMarkup(xpData, days);
}

export function renderAll(xpData, needed) {
  renderBadges();
  renderHUD(xpData, needed);
  renderResults(xpData, needed);
  try { updateChart(xpData); } catch (e) { /* chart optional — silent degradation */ }
}

function setupChartToggle() {
  const sheet = document.getElementById('results-sheet');
  const canvas = document.getElementById('bkChart');
  if (!sheet || !canvas) return;
  let toggle = document.getElementById('chart-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = 'chart-toggle';
    toggle.type = 'button';
    toggle.textContent = 'Daily XP Chart';
    canvas.before(toggle);
  }
  let fallback = sheet.querySelector('.chart-fallback');
  if (!fallback) {
    fallback = document.createElement('p');
    fallback.className = 'chart-fallback tip-note';
    fallback.textContent = 'Daily XP chart appears here when the chart library loads; the breakdown above always shows the same values.';
    canvas.after(fallback);
  }
  const apply = () => {
    toggle.setAttribute('aria-expanded', String(chartOpen));
    canvas.style.display = chartOpen ? '' : 'none';
    if (!chartOpen) return;
    Promise.resolve()
      .then(() => ensureChart('bkChart'))
      .then((inst) => {
        if (inst) {
          fallback.style.display = 'none';
          if (latestXpData) { try { updateChart(latestXpData); } catch (e) { /* silent */ } }
        } else {
          fallback.style.display = '';
        }
      })
      .catch(() => { fallback.style.display = ''; });
  };
  toggle.addEventListener('click', () => { chartOpen = !chartOpen; apply(); });
  apply();
}

export function update() {
  const xpData = calculateXP(collectParams(state));
  const needed = totalNeeded(state.profile.currentLevel, state.profile.xpProgress, state.profile.targetLevel);
  latestXpData = xpData;
  renderAll(xpData, needed);
  return { xpData, needed };
}

setupChartToggle();

IDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => { applyInput(state, id, el.value); update(); });
});
update();
