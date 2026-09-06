// XP Farming Simulator - Single bundled file (no ES modules)
(function() {
'use strict';

// ── Utils ──
function fmtK(v) {
  if (v === 0) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return parseFloat((v / 1000).toFixed(1)) + 'k';
  return String(v);
}

function loc(v) {
  return v.toLocaleString();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function sanitizeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── XP Calculator ──
function xpForLevel(level) {
  if (level === 1) return 30;
  if (level <= 200) return (level - 1) * 50;
  if (level <= 299) return (level - 200) * 500 + 9500;
  return (level - 300) * 1000 + 60000;
}

function cumulXP(level) {
  if (level <= 1) return 0;
  if (level <= 201) return (level - 1) * (level - 2) * 25 + 30;
  if (level <= 299) return 250 * Math.pow(level - 200, 2) + 9250 * (level - 200) + 985530;
  return 500 * Math.pow(level - 300, 2) + 59500 * (level - 300) + 4410530;
}

function totalNeeded(currentLevel, currentProgress, targetLevel) {
  var earned = Math.round(xpForLevel(currentLevel) * currentProgress / 100);
  return Math.max(0, cumulXP(targetLevel) - cumulXP(currentLevel) - earned);
}

function calculateAttacks(params) {
  var attacksPerDay = params.attacksPerDay;
  var avgStars = params.avgStars;
  var dailyXP = attacksPerDay * avgStars * 1;
  return { daily: attacksPerDay, xp: dailyXP };
}

function calculateDonations(params) {
  var troopXP = params.troopSpaces * 1;
  var spellXP = params.spellSpaces * 5;
  var siegeXP = params.siegeMachines * 30;
  return {
    daily: params.troopSpaces + params.spellSpaces + params.siegeMachines,
    xp: troopXP + spellXP + siegeXP,
    breakdown: { troops: troopXP, spells: spellXP, siege: siegeXP }
  };
}

function calculateBuilders(params) {
  var upgradeTimeSeconds = params.upgradeTimeDays * 86400;
  var xpPerBuilder = params.upgradeTimeDays > 0 ? Math.sqrt(upgradeTimeSeconds) : 0;
  var totalXP = Math.round(params.builderCount * xpPerBuilder);
  return { active: params.builderCount, xp: totalXP };
}

function calculateWars(params) {
  var weeklyStars = clamp(params.warAttacksPerWeek * params.avgWarStars, 0, 14);
  var dailyXP = Math.round(weeklyStars * 5 / 7 * 100) / 100;
  return { weekly: weeklyStars, daily: dailyXP, xp: dailyXP };
}

function calculateSeason(params) {
  return { daily: params.seasonalBonusPerDay, xp: params.seasonalBonusPerDay };
}

function calculateXP(params) {
  var attacks = calculateAttacks({ attacksPerDay: params.atk, avgStars: params.stars });
  var donations = calculateDonations({ troopSpaces: params.troopSV * 500, spellSpaces: params.spellSV * 50, siegeMachines: params.siegeSV * 5 });
  var builders = calculateBuilders({ builderCount: params.bld, upgradeTimeDays: params.upg });
  var wars = calculateWars({ warAttacksPerWeek: params.war, avgWarStars: params.warStars });
  var season = calculateSeason({ seasonalBonusPerDay: params.season });
  var totalDailyXP = attacks.xp + donations.xp + builders.xp + wars.xp + season.xp;
  return {
    attacks: attacks, donations: donations, builders: builders,
    wars: wars, season: season,
    total: { daily: totalDailyXP, weekly: Math.round(totalDailyXP * 7) }
  };
}

// ── Presets ──
var STORAGE_KEY = 'xp-simulator-presets';
var MAX_PRESETS = 50;
var MAX_STORAGE_SIZE = 5 * 1024 * 1024;

function getPresets() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function savePreset(name, state) {
  var presets = getPresets();
  if (presets.length >= MAX_PRESETS) return { success: false, error: 'Max presets reached' };
  var sanitizedName = sanitizeHTML(name.trim());
  if (!sanitizedName) return { success: false, error: 'Name cannot be empty' };
  if (presets.some(function(p) { return p.name === sanitizedName; }))
    return { success: false, error: 'Name already exists' };
  var preset = { id: generateId(), name: sanitizedName, state: deepClone(state), createdAt: new Date().toISOString() };
  var newData = presets.concat([preset]);
  if (new Blob([JSON.stringify(newData)]).size > MAX_STORAGE_SIZE)
    return { success: false, error: 'Storage limit reached' };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); return { success: true, preset: preset }; }
  catch (e) { return { success: false, error: 'Failed to save' }; }
}

function loadPreset(id) {
  var presets = getPresets();
  var preset = presets.find(function(p) { return p.id === id; });
  if (!preset) return { success: false, error: 'Not found' };
  return { success: true, state: deepClone(preset.state) };
}

function deletePreset(id) {
  var presets = getPresets();
  var idx = presets.findIndex(function(p) { return p.id === id; });
  if (idx === -1) return { success: false, error: 'Not found' };
  presets.splice(idx, 1);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(presets)); return { success: true }; }
  catch (e) { return { success: false, error: 'Failed to delete' }; }
}

function exportPresets() { return JSON.stringify(getPresets(), null, 2); }

function importPresets(jsonString) {
  try {
    var imported = JSON.parse(jsonString);
    if (!Array.isArray(imported)) return { success: false, error: 'Invalid format' };
    var existing = getPresets();
    var ids = new Set(existing.map(function(p) { return p.id; }));
    var newPresets = imported.filter(function(p) { return p.id && p.name && p.state && !ids.has(p.id); });
    var combined = existing.concat(newPresets);
    if (combined.length > MAX_PRESETS) return { success: false, error: 'Would exceed limit' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    return { success: true, imported: newPresets.length };
  } catch (e) { return { success: false, error: 'Invalid JSON' }; }
}

// ── Chart ──
var chartInstance = null;
var BAR_COLORS = ['#FFD700', '#2E86DE', '#00E5FF', '#E04040', '#B04FFF'];
var LABELS = ['Attacks', 'Builders', 'Donations', 'Wars', 'Season'];

function initChart(canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return null; }
  chartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: LABELS, datasets: [{ label: 'Daily XP', data: [0,0,0,0,0], backgroundColor: BAR_COLORS, borderRadius: 6, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 400, easing: 'easeOutQuart' },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#10161e', borderColor: 'rgba(255,215,0,0.2)', borderWidth: 1, titleColor: '#FFD700', bodyColor: '#8899aa', padding: 10, callbacks: { label: function(c) { return '  ' + loc(c.parsed.y) + ' XP / day'; } } } },
      scales: { x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Barlow' }, color: '#556677' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false }, ticks: { font: { size: 11, family: 'Barlow' }, color: '#556677', callback: function(v) { return fmtK(v) + ' XP'; } } } }
    }
  });
  return chartInstance;
}

function updateChart(xpData) {
  if (!chartInstance) return;
  chartInstance.data.datasets[0].data = [xpData.attacks.xp, xpData.builders.xp, xpData.donations.xp, xpData.wars.xp, xpData.season.xp];
  chartInstance.update('active');
}

// ── App State ──
var state = {
  profile: { currentLevel: 1, xpProgress: 0, targetLevel: 2 },
  activity: { attacks: 0, stars: 0 },
  donations: { troops: 0, spells: 0, siege: 0 },
  builders: { count: 0, upgradeTime: 0 },
  war: { attacks: 0, stars: 0, seasonalBonus: 0 },
  settings: { theme: 'gold' }
};

// ── Init ──
function init() {
  try { initChart('bkChart'); } catch (e) { console.warn('Chart init failed:', e); }
  bindInputListeners();
  bindPresetListeners();
  bindKeyboardShortcuts();
  applyThumbStyles();
  update();
  console.log('XP Farming Simulator initialized');
}

function applyThumbStyles() {
  var styleEl = document.getElementById('dynamic-thumb-styles');
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'dynamic-thumb-styles'; document.head.appendChild(styleEl); }
  var cardColors = [
    { ids: ['xpPct'], color: '#FFD700' },
    { ids: ['atkSlider', 'starsSlider'], color: '#FF6B35' },
    { ids: ['troopSlider', 'spellSlider', 'siegeSlider'], color: '#00E5FF' },
    { ids: ['bldSlider', 'upgSlider'], color: '#4CAF50' },
    { ids: ['warSlider', 'warStarsSlider', 'seasonSlider'], color: '#B04FFF' }
  ];
  var css = '';
  cardColors.forEach(function(c) {
    c.ids.forEach(function(id) {
      css += '#' + id + '::-webkit-slider-thumb{background:radial-gradient(circle at 35% 35%,' + c.color + 'dd,' + c.color + ');box-shadow:0 0 8px ' + c.color + '88;}';
      css += '#' + id + '::-moz-range-thumb{background:' + c.color + ';}';
    });
  });
  styleEl.textContent = css;
}

// ── Input Binding ──
function bindInput(id, callback) {
  var element = document.getElementById(id);
  if (!element) return;
  element.addEventListener('input', function() { callback(element.value); update(); });
}

function bindInputListeners() {
  bindInput('curLvl', function(v) { state.profile.currentLevel = Math.max(1, Math.min(499, parseInt(v) || 1)); });
  bindInput('xpPct', function(v) { state.profile.xpProgress = parseInt(v) || 0; });
  bindInput('tgtLvl', function(v) { state.profile.targetLevel = Math.max(state.profile.currentLevel + 1, Math.min(500, parseInt(v) || state.profile.currentLevel + 1)); });
  bindInput('atkSlider', function(v) { state.activity.attacks = parseInt(v) || 0; });
  bindInput('starsSlider', function(v) { state.activity.stars = parseInt(v) || 0; });
  bindInput('troopSlider', function(v) { state.donations.troops = parseInt(v) || 0; });
  bindInput('spellSlider', function(v) { state.donations.spells = parseInt(v) || 0; });
  bindInput('siegeSlider', function(v) { state.donations.siege = parseInt(v) || 0; });
  bindInput('bldSlider', function(v) { state.builders.count = parseInt(v) || 0; });
  bindInput('upgSlider', function(v) { state.builders.upgradeTime = parseFloat(v) || 0; });
  bindInput('warSlider', function(v) { state.war.attacks = parseInt(v) || 0; });
  bindInput('warStarsSlider', function(v) { state.war.stars = parseInt(v) || 0; });
  bindInput('seasonSlider', function(v) { state.war.seasonalBonus = parseInt(v) || 0; });
}

// ── Preset UI ──
function bindPresetListeners() {
  var saveBtn = document.getElementById('save-preset-btn');
  if (saveBtn) saveBtn.addEventListener('click', showSavePresetModal);
  var loadSelect = document.getElementById('load-preset-select');
  if (loadSelect) loadSelect.addEventListener('change', function(e) { if (e.target.value) loadPresetById(e.target.value); });
  var deleteBtn = document.getElementById('delete-preset-btn');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteCurrentPreset);
  var exportBtn = document.getElementById('export-presets-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportAllPresets);
  var importBtn = document.getElementById('import-presets-btn');
  if (importBtn) importBtn.addEventListener('click', importPresetsFromFile);
  updatePresetList();
}

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

function loadPresetById(id) {
  var result = loadPreset(id);
  if (result.success) { Object.assign(state, result.state); updateInputsFromState(); update(); }
  else showToast('Error: ' + result.error);
}

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

function updatePresetList() {
  var select = document.getElementById('load-preset-select');
  if (!select) return;
  var presets = getPresets();
  select.innerHTML = '<option value="">Select a preset...</option>';
  presets.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name;
    select.appendChild(opt);
  });
}

function updateInputsFromState() {
  var el;
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
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); showSavePresetModal(); }
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); exportResults(); }
    if (e.key === '?' && !e.ctrlKey && !e.altKey) showHelpModal();
    if (e.key === 'Escape') closeAllModals();
  });
}

// ── Main Update ──
function update() {
  updateDisplayValues();
  var xpData = calculateXP({
    atk: state.activity.attacks, stars: state.activity.stars,
    troopSV: state.donations.troops, spellSV: state.donations.spells, siegeSV: state.donations.siege,
    bld: state.builders.count, upg: state.builders.upgradeTime,
    war: state.war.attacks, warStars: state.war.stars, season: state.war.seasonalBonus
  });
  updateResults(xpData);
  updateChart(xpData);
}

function updateDisplayValues() {
  ['xpPct', 'atkSlider', 'starsSlider', 'troopSlider', 'spellSlider', 'siegeSlider', 'bldSlider', 'upgSlider', 'warSlider', 'warStarsSlider', 'seasonSlider'].forEach(paintSliderFill);
  var el;
  el = document.getElementById('xpPctOut'); if (el) el.textContent = state.profile.xpProgress + '%';
  el = document.getElementById('atkOut'); if (el) el.textContent = state.activity.attacks;
  el = document.getElementById('starsOut'); if (el) el.textContent = state.activity.stars;
  el = document.getElementById('troopOut'); if (el) el.textContent = fmtK(state.donations.troops * 500);
  el = document.getElementById('spellOut'); if (el) el.textContent = fmtK(state.donations.spells * 50);
  el = document.getElementById('siegeOut'); if (el) el.textContent = fmtK(state.donations.siege * 5);
  el = document.getElementById('bldOut'); if (el) el.textContent = state.builders.count;
  el = document.getElementById('upgOut'); if (el) el.textContent = state.builders.upgradeTime + 'd';
  el = document.getElementById('warOut'); if (el) el.textContent = state.war.attacks;
  el = document.getElementById('warStarsOut'); if (el) el.textContent = state.war.stars;
  el = document.getElementById('seasonOut'); if (el) el.textContent = state.war.seasonalBonus;
}

function updateResults(xpData) {
  var needed = totalNeeded(state.profile.currentLevel, state.profile.xpProgress, state.profile.targetLevel);
  var days = xpData.total.daily > 0 ? Math.ceil(needed / xpData.total.daily) : Infinity;
  var timeStr = days === Infinity ? '\u2014' : days < 365 ? days + 'd' : (days / 365).toFixed(1) + 'y';
  var timeLong = days === Infinity ? 'No XP gained' : days <= 1 ? '1 day' : days < 7 ? days + ' days' : days < 30 ? (days / 7).toFixed(1) + ' weeks' : days < 365 ? (days / 30).toFixed(1) + ' months' : (days / 365).toFixed(1) + ' years';
  var xpNow = xpForLevel(state.profile.currentLevel);
  var earned = Math.round(xpNow * state.profile.xpProgress / 100);
  var rc = document.getElementById('results');
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
    generateWarnings(xpData, days);
}

function generateBreakdownRows(xpData) {
  var sources = [
    { name: 'Multiplayer Attacks', xp: xpData.attacks.xp, color: '#FFD700' },
    { name: 'Builder Upgrades', xp: xpData.builders.xp, color: '#2E86DE' },
    { name: 'Donations', xp: xpData.donations.xp, color: '#00E5FF', hasSub: true },
    { name: 'Clan Wars', xp: xpData.wars.xp, color: '#E04040' },
    { name: 'Seasonal / Events', xp: xpData.season.xp, color: '#B04FFF' }
  ];
  return sources.map(function(s) {
    var pct = xpData.total.daily > 0 ? Math.round((s.xp / xpData.total.daily) * 100) : 0;
    var sub = '';
    if (s.hasSub && xpData.donations.xp > 0) {
      sub = '<div class="sub-row"><span class="sub-name">\u2503 Troops (' + fmtK(xpData.donations.breakdown.troops) + ' XP)</span><span class="sub-detail">\u00d7 1 XP / space</span><span class="sub-xp">' + loc(xpData.donations.breakdown.troops) + ' XP</span></div>' +
        '<div class="sub-row"><span class="sub-name">\u2503 Spells (' + fmtK(xpData.donations.breakdown.spells) + ' XP)</span><span class="sub-detail">\u00d7 5 XP / space</span><span class="sub-xp">' + loc(xpData.donations.breakdown.spells) + ' XP</span></div>' +
        '<div class="sub-row"><span class="sub-name">\u2503 Siege Machines (' + fmtK(xpData.donations.breakdown.siege) + ' XP)</span><span class="sub-detail">\u00d7 30 XP each</span><span class="sub-xp">' + loc(xpData.donations.breakdown.siege) + ' XP</span></div>';
    }
    return '<div class="bk-row"><span class="bk-dot" style="background:' + s.color + '"></span><span class="bk-name">' + s.name + '</span><div class="bk-bar"><div class="bk-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div><span class="bk-xp">' + loc(s.xp) + '</span><span class="bk-pct">' + pct + '%</span></div>' + sub;
  }).join('');
}

function generateWarnings(xpData, days) {
  var w = [];
  if (xpData.total.daily === 0) w.push('Set some daily activities to see your farming estimate.');
  if (days !== Infinity && days > 365 * 2) w.push('Target is over 2 years away \u2014 try a closer target or increase activity.');
  return w.map(function(m) { return '<div class="warn">\u26a0\ufe0f ' + m + '</div>'; }).join('');
}

// ── Export / Import ──
function exportResults() {
  var blob = new Blob([JSON.stringify({ state: state, timestamp: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'xp-simulator-results-' + Date.now() + '.json'; a.click();
  URL.revokeObjectURL(url);
}

function exportAllPresets() {
  var blob = new Blob([exportPresets()], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'xp-simulator-presets-' + Date.now() + '.json'; a.click();
  URL.revokeObjectURL(url);
}

function importPresetsFromFile() {
  var input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var result = importPresets(ev.target.result);
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
    actions: [{ label: 'Close', primary: true, onClick: function() { closeModal(); } }]
  });
}

function closeAllModals() { closeModal(); }

// ── Toast + Modal (replaces alert/prompt/confirm) ──
function paintSliderFill(id) {
  var el = document.getElementById(id);
  if (!el || el.type !== 'range') return;
  var min = parseFloat(el.min) || 0;
  var max = parseFloat(el.max) || 100;
  var v = parseFloat(el.value) || 0;
  var pct = max > min ? Math.round(((v - min) / (max - min)) * 100) : 0;
  el.style.setProperty('--fill', pct + '%');
}

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

// ── Boot ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
