import './styles.css';
import { calculateXP, totalNeeded, xpForLevel } from './lib/xp-calculator.js';
import { getDefaultState, applyInput, collectParams } from './lib/state.js';
import { fmtK, loc } from './lib/utils.js';
import { formatDuration, breakdownPct, warnings, daysToTarget } from './lib/results.js';
import { getPresets, savePreset, loadPreset, deletePreset, exportPresets, importPresets } from './lib/presets.js';
import { updateChart, ensureChart } from './lib/chart.js';
import { shouldCelebrate, tweenFrames, shareCardText } from './lib/juice.js';

const state = getDefaultState();
const IDS = ['curLvl','xpPct','tgtLvl','atkSlider','starsSlider','troopSlider','spellSlider','siegeSlider','bldSlider','upgSlider','warSlider','warStarsSlider','seasonSlider'];

let latestXpData = null;
let chartOpen = typeof matchMedia === 'function' ? matchMedia('(min-width: 640px)').matches : true;

// --- Juice (Task 6): all motion/sound gated on motionOK ---
const motionOK = typeof matchMedia === 'function' ? !matchMedia('(prefers-reduced-motion: reduce)').matches : true;
let lastNeeded = null;
let celebratePrev = null;
let soundOn = false;
try { soundOn = localStorage.getItem('xp-simulator-sound') === 'on'; } catch (e) { /* storage optional */ }

function fmtNeeded(n) {
  return n >= 1000 ? fmtK(n) : loc(n);
}

let tweenRaf = 0;
let tweenTimer = 0;
let tweenToken = 0;

function tweenXpNeeded(el, from, to) {
  tweenToken += 1;
  const mine = tweenToken;
  if (tweenRaf) cancelAnimationFrame(tweenRaf);
  if (tweenTimer) clearTimeout(tweenTimer);
  tweenRaf = 0;
  tweenTimer = 0;
  if (!motionOK || !el || from === to) return;
  const frames = tweenFrames(from, to);
  const stepMs = 200 / frames.length;
  let i = 0;
  const tick = () => {
    if (mine !== tweenToken) return;
    if (i < frames.length) {
      el.textContent = fmtNeeded(frames[i]);
      i += 1;
      tweenRaf = requestAnimationFrame(() => {
        tweenTimer = setTimeout(tick, stepMs);
      });
    }
  };
  tick();
}

function fireConfetti() {
  if (!motionOK) return;
  const canvas = document.createElement('canvas');
  const N = 60;
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#FFD700', '#FFF066', '#2E86DE', '#00E5FF', '#27AE60', '#E04040', '#B04FFF'];
  const parts = Array.from({ length: N }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -9 - 2,
    s: Math.random() * 7 + 3,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
    life: 1
  }));
  const start = performance.now();
  const DURATION = 1100;
  const frame = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.r += p.vr;
      p.life = 1 - t / DURATION;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    });
    if (t < DURATION) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(frame);
}

function playFanfare() {
  if (!motionOK || !soundOn) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = [523.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + idx * 0.14;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.25);
    });
    setTimeout(() => { try { ctx.close(); } catch (e) { /* noop */ } }, 600);
  } catch (e) { /* audio optional */ }
}

function buzz() {
  if (!motionOK) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(20);
  } catch (e) { /* noop */ }
}

function persistSound() {
  try { localStorage.setItem('xp-simulator-sound', soundOn ? 'on' : 'off'); } catch (e) { /* noop */ }
}

function shareCard() {
  const xpData = latestXpData || calculateXP(collectParams(state));
  const needed = totalNeeded(state.profile.currentLevel, state.profile.xpProgress, state.profile.targetLevel);
  const days = daysToTarget(needed, xpData.total.daily);
  const caption = shareCardText(state.profile.currentLevel, state.profile.targetLevel, days);
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 12;
  ctx.strokeRect(36, 36, S - 72, S - 72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.font = '800 84px Sora, Inter, sans-serif';
  ctx.fillText('CoC XP SIMULATOR', S / 2, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 72px Sora, Inter, sans-serif';
  const lines = [caption];
  lines.forEach((line, i) => ctx.fillText(line, S / 2, 520 + i * 100));
  ctx.fillStyle = '#8899aa';
  ctx.font = '500 44px Inter, sans-serif';
  ctx.fillText('Keep grinding, Chief!', S / 2, 780);
  const done = (blob) => {
    if (!blob) return;
    const file = typeof File !== 'undefined' ? new File([blob], 'coc-xp-share.png', { type: 'image/png' }) : null;
    if (file && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const p = navigator.share({ files: [file], title: 'CoC XP Simulator', text: caption });
        if (p && typeof p.catch === 'function') p.catch(() => downloadBlob(blob));
        return;
      } catch (e) { /* fall through to download */ }
    }
    downloadBlob(blob);
  };
  const downloadBlob = (blob) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'coc-xp-share.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { /* noop */ }
  };
  if (canvas.toBlob) canvas.toBlob(done, 'image/png');
}

function setupJuiceControls() {
  const sheet = document.getElementById('results-sheet');
  if (!sheet) return;
  let soundBtn = document.getElementById('sound-toggle');
  if (!soundBtn) {
    soundBtn = document.createElement('button');
    soundBtn.id = 'sound-toggle';
    soundBtn.type = 'button';
    sheet.appendChild(soundBtn);
  }
  const paintSound = () => {
    soundBtn.textContent = soundOn ? 'Sound On' : 'Sound Off';
    soundBtn.setAttribute('aria-pressed', String(soundOn));
  };
  paintSound();
  soundBtn.onclick = () => { soundOn = !soundOn; persistSound(); paintSound(); };
  let shareBtn = document.getElementById('share-btn');
  if (!shareBtn) {
    shareBtn = document.createElement('button');
    shareBtn.id = 'share-btn';
    shareBtn.type = 'button';
    shareBtn.textContent = 'Share Result';
    sheet.appendChild(shareBtn);
  }
  shareBtn.onclick = shareCard;
}

function setupCelebrate() {
  const ranges = document.querySelectorAll('input[type="range"]');
  ranges.forEach((el) => {
    el.addEventListener('change', () => {
      const before = celebratePrev;
      const res = update();
      const after = daysToTarget(res.needed, res.xpData.total.daily);
      celebratePrev = after;
      if (before !== null && shouldCelebrate(before, after, motionOK)) {
        fireConfetti();
        playFanfare();
        buzz();
      }
    });
  });
}

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
  const prevNeeded = lastNeeded;
  renderAll(xpData, needed);
  if (motionOK && prevNeeded !== null && prevNeeded !== needed) {
    const el = document.querySelector('#results .rcard .rc-val');
    if (el) tweenXpNeeded(el, prevNeeded, needed);
  }
  lastNeeded = needed;
  if (celebratePrev === null) {
    celebratePrev = daysToTarget(needed, xpData.total.daily);
  }
  return { xpData, needed };
}

// ── Preset UI ──
function bindPresetListeners() {
  const saveBtn = document.getElementById('save-preset-btn');
  if (saveBtn) saveBtn.addEventListener('click', showSavePresetModal);
  const loadSelect = document.getElementById('load-preset-select');
  if (loadSelect) loadSelect.addEventListener('change', (e) => { if (e.target.value) loadPresetById(e.target.value); });
  const deleteBtn = document.getElementById('delete-preset-btn');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteCurrentPreset);
  const exportBtn = document.getElementById('export-presets-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportAllPresets);
  const importBtn = document.getElementById('import-presets-btn');
  if (importBtn) importBtn.addEventListener('click', importPresetsFromFile);
  updatePresetList();
}

function showSavePresetModal() {
  openModal({
    title: 'Save Preset',
    bodyHTML: '<input type="text" id="preset-name-input" placeholder="Preset name" maxlength="60">',
    actions: [
      { label: 'Cancel', onClick: () => { closeModal(); } },
      { label: 'Save', primary: true, onClick: (body) => {
        const input = body.querySelector('#preset-name-input');
        const name = input ? input.value : '';
        const result = savePreset(name, state);
        if (result.success) { closeModal(); showToast('Preset saved!'); updatePresetList(); }
        else showToast('Error: ' + result.error);
      } }
    ]
  });
}

function loadPresetById(id) {
  const result = loadPreset(id);
  if (result.success) { Object.assign(state, result.state); updateInputsFromState(); update(); }
  else showToast('Error: ' + result.error);
}

function deleteCurrentPreset() {
  const select = document.getElementById('load-preset-select');
  const id = select && select.value;
  if (!id) { showToast('Select a preset to delete'); return; }
  openModal({
    title: 'Delete Preset',
    bodyHTML: '<p class="tip-note">Delete this preset? This cannot be undone.</p>',
    actions: [
      { label: 'Cancel', onClick: () => { closeModal(); } },
      { label: 'Delete', primary: true, onClick: () => {
        const result = deletePreset(id);
        if (result.success) { closeModal(); showToast('Preset deleted'); updatePresetList(); }
        else showToast('Error: ' + result.error);
      } }
    ]
  });
}

function updatePresetList() {
  const select = document.getElementById('load-preset-select');
  if (!select) return;
  const presets = getPresets();
  select.innerHTML = '<option value="">Select a preset...</option>';
  presets.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name;
    select.appendChild(opt);
  });
}

function updateInputsFromState() {
  let el;
  el = document.getElementById('curLvl'); if (el) el.value = state.profile.currentLevel;
  el = document.getElementById('xpPct'); if (el) el.value = state.profile.xpProgress;
  el = document.getElementById('tgtLvl'); if (el) el.value = state.profile.targetLevel;
  el = document.getElementById('atkSlider'); if (el) el.value = state.activity.attacks;
  el = document.getElementById('starsSlider'); if (el) el.value = state.activity.stars;
  el = document.getElementById('troopSlider'); if (el) el.value = state.donations.troops;
  el = document.getElementById('spellSlider'); if (el) el.value = state.donations.spells;
  el = document.getElementById('siegeSlider'); if (el) el.value = state.donations.siege;
  el = document.getElementById('bldSlider'); if (el) el.value = state.builders.count;
  el = document.getElementById('upgSlider'); if (el) el.value = state.builders.upgradeTime;
  el = document.getElementById('warSlider'); if (el) el.value = state.war.attacks;
  el = document.getElementById('warStarsSlider'); if (el) el.value = state.war.stars;
  el = document.getElementById('seasonSlider'); if (el) el.value = state.war.seasonalBonus;
}

// ── Keyboard Shortcuts ──
function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); showSavePresetModal(); }
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); exportResults(); }
    if (e.key === '?' && !e.ctrlKey && !e.altKey) showHelpModal();
    if (e.key === 'Escape') closeAllModals();
  });
}

// ── Export / Import ──
function exportResults() {
  const blob = new Blob([JSON.stringify({ state, timestamp: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'xp-simulator-results-' + Date.now() + '.json'; a.click();
  URL.revokeObjectURL(url);
}

function exportAllPresets() {
  const blob = new Blob([exportPresets()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'xp-simulator-presets-' + Date.now() + '.json'; a.click();
  URL.revokeObjectURL(url);
}

function importPresetsFromFile() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importPresets(ev.target.result);
      if (result.success) { showToast('Imported ' + result.imported + ' presets'); updatePresetList(); }
      else showToast('Import failed: ' + result.error);
    };
    reader.readAsText(file);
  };
  input.click();
}

function showHelpModal() {
  openModal({
    title: 'Keyboard Shortcuts',
    bodyHTML: '<p class="tip-note">Ctrl+S: Save preset<br>Ctrl+E: Export results<br>?: Show this help<br>Esc: Close</p>',
    actions: [{ label: 'Close', primary: true, onClick: () => { closeModal(); } }]
  });
}

function closeAllModals() { closeModal(); }

// ── Toast + Modal (replaces alert/prompt/confirm) ──
function showToast(msg) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.remove(); }, 3000);
}

function openModal(opts) {
  closeModal();
  const root = document.getElementById('modal-root');
  if (!root) return null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  const box = document.createElement('div');
  box.className = 'modal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  const h = document.createElement('h2');
  h.textContent = opts.title;
  box.appendChild(h);
  const body = document.createElement('div');
  body.innerHTML = opts.bodyHTML || '';
  box.appendChild(body);
  const row = document.createElement('div');
  row.className = 'modal-actions';
  (opts.actions || []).forEach((a) => {
    const b = document.createElement('button');
    b.textContent = a.label;
    if (a.primary) b.className = 'primary';
    b.addEventListener('click', () => { if (a.onClick) a.onClick(body); });
    row.appendChild(b);
  });
  box.appendChild(row);
  overlay.appendChild(box);
  root.appendChild(overlay);
  const input = box.querySelector('input');
  if (input) input.focus();
  return box;
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

setupChartToggle();
setupJuiceControls();
setupCelebrate();
bindPresetListeners();
bindKeyboardShortcuts();

IDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => { applyInput(state, id, el.value); update(); });
});
update();
