// Main Application Logic for XP Farming Simulator
import { fmtK, loc, debounce, sanitizeHTML } from './utils.js';
import { xpForLevel, totalNeeded, calculateXP } from './xp-calculator.js';
import { savePreset, loadPreset, deletePreset, getPresets, exportPresets, importPresets } from './presets.js';
import { initChart, updateChart, destroyChart } from './chart.js';

// Application State
const state = {
  profile: {
    currentLevel: 1,
    xpProgress: 0,
    targetLevel: 2
  },
  activity: {
    attacks: 0,
    stars: 0
  },
  donations: {
    troops: 0,
    spells: 0,
    siege: 0
  },
  builders: {
    count: 0,
    upgradeTime: 0
  },
  war: {
    attacks: 0,
    stars: 0,
    seasonalBonus: 0
  },
  settings: {
    theme: 'gold'
  }
};

// Event Emitter
const events = {};

function emit(eventName, data) {
  if (events[eventName]) {
    events[eventName].forEach(callback => callback(data));
  }
}

function on(eventName, callback) {
  if (!events[eventName]) {
    events[eventName] = [];
  }
  events[eventName].push(callback);
}

// Initialize Application
export function init() {
  // Initialize chart (non-critical)
  try {
    initChart('bkChart');
  } catch (e) {
    console.warn('Chart init failed:', e);
  }
  
  // Bind event listeners
  bindInputListeners();
  bindPresetListeners();
  bindKeyboardShortcuts();
  
  // Apply thumb styles
  applyThumbStyles();
  
  // Initial calculation
  update();
  
  console.log('XP Farming Simulator initialized');
}

function applyThumbStyles() {
  const styleEl = document.getElementById('dynamic-thumb-styles') || createDynamicStyles();
  
  const cardColors = [
    { ids: ['xpPct'], color: '#FFD700' },
    { ids: ['atkSlider', 'starsSlider'], color: '#FF6B35' },
    { ids: ['troopSlider', 'spellSlider', 'siegeSlider'], color: '#00E5FF' },
    { ids: ['bldSlider', 'upgSlider'], color: '#4CAF50' },
    { ids: ['warSlider', 'warStarsSlider', 'seasonSlider'], color: '#B04FFF' }
  ];
  
  let css = '';
  cardColors.forEach(({ ids, color }) => {
    ids.forEach(id => {
      css += `#${id}::-webkit-slider-thumb{background:radial-gradient(circle at 35% 35%,${color}dd,${color});box-shadow:0 0 8px ${color}88;}`;
      css += `#${id}::-moz-range-thumb{background:${color};}`;
    });
  });
  
  styleEl.textContent = css;
}

function createDynamicStyles() {
  const style = document.createElement('style');
  style.id = 'dynamic-thumb-styles';
  document.head.appendChild(style);
  return style;
}

// Input Binding
function bindInputListeners() {
  // Profile inputs
  bindInput('curLvl', (value) => {
    state.profile.currentLevel = Math.max(1, Math.min(499, parseInt(value) || 1));
  });
  
  bindInput('xpPct', (value) => {
    state.profile.xpProgress = parseInt(value) || 0;
  });
  
  bindInput('tgtLvl', (value) => {
    state.profile.targetLevel = Math.max(state.profile.currentLevel + 1, Math.min(500, parseInt(value) || state.profile.currentLevel + 1));
  });
  
  // Activity inputs
  bindInput('atkSlider', (value) => {
    state.activity.attacks = parseInt(value) || 0;
  });
  
  bindInput('starsSlider', (value) => {
    state.activity.stars = parseInt(value) || 0;
  });
  
  // Donation inputs
  bindInput('troopSlider', (value) => {
    state.donations.troops = parseInt(value) || 0;
  });
  
  bindInput('spellSlider', (value) => {
    state.donations.spells = parseInt(value) || 0;
  });
  
  bindInput('siegeSlider', (value) => {
    state.donations.siege = parseInt(value) || 0;
  });
  
  // Builder inputs
  bindInput('bldSlider', (value) => {
    state.builders.count = parseInt(value) || 0;
  });
  
  bindInput('upgSlider', (value) => {
    state.builders.upgradeTime = parseFloat(value) || 0;
  });
  
  // War inputs
  bindInput('warSlider', (value) => {
    state.war.attacks = parseInt(value) || 0;
  });
  
  bindInput('warStarsSlider', (value) => {
    state.war.stars = parseInt(value) || 0;
  });
  
  bindInput('seasonSlider', (value) => {
    state.war.seasonalBonus = parseInt(value) || 0;
  });
}

function bindInput(id, callback) {
  const element = document.getElementById(id);
  if (!element) return;
  
  element.addEventListener('input', () => {
    callback(element.value);
    update();
  });
}

// Preset Listeners
function bindPresetListeners() {
  // Save preset button
  const saveBtn = document.getElementById('save-preset-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', showSavePresetModal);
  }
  
  // Load preset dropdown
  const loadSelect = document.getElementById('load-preset-select');
  if (loadSelect) {
    loadSelect.addEventListener('change', (e) => {
      const presetId = e.target.value;
      if (presetId) {
        loadPresetById(presetId);
      }
    });
  }
  
  // Delete preset button
  const deleteBtn = document.getElementById('delete-preset-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteCurrentPreset);
  }
  
  // Export presets button
  const exportBtn = document.getElementById('export-presets-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportAllPresets);
  }
  
  // Import presets button
  const importBtn = document.getElementById('import-presets-btn');
  if (importBtn) {
    importBtn.addEventListener('click', importPresetsFromFile);
  }
  
  // Update preset list on load
  updatePresetList();
}

// Keyboard Shortcuts
function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+S: Save preset
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      showSavePresetModal();
    }
    
    // Ctrl+E: Export results
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      exportResults();
    }
    
    // Ctrl+Z: Undo (placeholder for future implementation)
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      console.log('Undo functionality coming soon');
    }
    
    // ?: Show help
    if (e.key === '?' && !e.ctrlKey && !e.altKey) {
      showHelpModal();
    }
    
    // Esc: Close modals
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// Main Update Function
function update() {
  // Update display values
  updateDisplayValues();
  
  // Calculate XP
  const xpData = calculateXP({
    atk: state.activity.attacks,
    stars: state.activity.stars,
    troopSV: state.donations.troops,
    spellSV: state.donations.spells,
    siegeSV: state.donations.siege,
    bld: state.builders.count,
    upg: state.builders.upgradeTime,
    war: state.war.attacks,
    warStars: state.war.stars,
    season: state.war.seasonalBonus
  });
  
  // Update results
  updateResults(xpData);
  
  // Update chart
  updateChart(xpData);
  
  // Emit update event
  emit('stateChanged', { state, xpData });
}

function updateDisplayValues() {
  // Profile
  document.getElementById('xpPctOut').textContent = state.profile.xpProgress + '%';
  
  // Activity
  document.getElementById('atkOut').textContent = state.activity.attacks;
  document.getElementById('starsOut').textContent = state.activity.stars;
  
  // Donations
  document.getElementById('troopOut').textContent = fmtK(state.donations.troops * 500);
  document.getElementById('spellOut').textContent = fmtK(state.donations.spells * 50);
  document.getElementById('siegeOut').textContent = fmtK(state.donations.siege * 5);
  
  // Builders
  document.getElementById('bldOut').textContent = state.builders.count;
  document.getElementById('upgOut').textContent = state.builders.upgradeTime + 'd';
  
  // War
  document.getElementById('warOut').textContent = state.war.attacks;
  document.getElementById('warStarsOut').textContent = state.war.stars;
  document.getElementById('seasonOut').textContent = state.war.seasonalBonus;
}

function updateResults(xpData) {
  const needed = totalNeeded(
    state.profile.currentLevel,
    state.profile.xpProgress,
    state.profile.targetLevel
  );
  
  const days = xpData.total.daily > 0 ? Math.ceil(needed / xpData.total.daily) : Infinity;
  
  const timeStr = days === Infinity ? '—' : 
    days < 365 ? days + 'd' : (days / 365).toFixed(1) + 'y';
  
  const timeLong = days === Infinity ? 'No XP gained' :
    days <= 1 ? '1 day' :
    days < 7 ? days + ' days' :
    days < 30 ? (days / 7).toFixed(1) + ' weeks' :
    days < 365 ? (days / 30).toFixed(1) + ' months' :
    (days / 365).toFixed(1) + ' years';
  
  const xpNow = xpForLevel(state.profile.currentLevel);
  const earned = Math.round(xpNow * state.profile.xpProgress / 100);
  
  // Update result cards
  const resultsContainer = document.getElementById('results');
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="rcards">
        <div class="rcard" style="border:1px solid rgba(255,255,255,0.06);">
          <div class="rc-top" style="background:linear-gradient(90deg,#AA7700,#FFD700)"></div>
          <div class="rc-lbl">XP Needed</div>
          <div class="rc-val" style="color:#FFD700">${needed >= 1000 ? fmtK(needed) : loc(needed)}</div>
          <div class="rc-sub">to reach lvl ${state.profile.targetLevel}</div>
        </div>
        <div class="rcard" style="border:1px solid rgba(255,255,255,0.06);">
          <div class="rc-top" style="background:linear-gradient(90deg,#1A5276,#2E86DE)"></div>
          <div class="rc-lbl">Daily XP</div>
          <div class="rc-val" style="color:#ccd6e0">${fmtK(xpData.total.daily)}</div>
          <div class="rc-sub">at current pace</div>
        </div>
        <div class="rcard" style="border:1px solid rgba(255,255,255,0.06);">
          <div class="rc-top" style="background:linear-gradient(90deg,#AA7700,#FFD700,#FFF066)"></div>
          <div class="rc-lbl">Time to Target</div>
          <div class="rc-val" style="color:#FFD700;text-shadow:0 0 20px rgba(255,215,0,0.4)">${timeStr}</div>
          <div class="rc-sub">${timeLong}</div>
        </div>
        <div class="rcard" style="border:1px solid rgba(255,255,255,0.06);">
          <div class="rc-top" style="background:linear-gradient(90deg,#1D6A35,#27AE60)"></div>
          <div class="rc-lbl">Levels to Climb</div>
          <div class="rc-val" style="color:#ccd6e0">${state.profile.targetLevel - state.profile.currentLevel}</div>
          <div class="rc-sub">lvl ${state.profile.currentLevel} → ${state.profile.targetLevel}</div>
        </div>
      </div>
      
      <div class="prog-wrap" style="border:1px solid rgba(255,255,255,0.05)">
        <div class="prog-hdr">
          <span class="prog-lbl">Level ${state.profile.currentLevel} Progress</span>
          <span class="prog-val">${state.profile.xpProgress}% · ${earned.toLocaleString()} / ${xpNow.toLocaleString()} XP</span>
        </div>
        <div class="prog-track"><div class="prog-fill" style="width:${state.profile.xpProgress}%"></div></div>
      </div>
      
      <div class="bk-wrap" style="border:1px solid rgba(255,255,255,0.05)">
        <p class="bk-title"><span>⚡</span>Daily XP Breakdown</p>
        ${generateBreakdownRows(xpData)}
        <div style="display:flex;justify-content:flex-end;padding-top:8px;font-size:12px;color:#8899aa;">
          Total: <strong style="color:var(--acc)">${loc(xpData.total.daily)} XP / day</strong>
        </div>
      </div>
      
      ${generateWarnings(xpData, days)}
    `;
  }
}

function generateBreakdownRows(xpData) {
  const sources = [
    { name: 'Multiplayer Attacks', xp: xpData.attacks.xp, color: '#FFD700' },
    { name: 'Builder Upgrades', xp: xpData.builders.xp, color: '#2E86DE' },
    { name: 'Donations', xp: xpData.donations.xp, color: '#00E5FF', hasSub: true },
    { name: 'Clan Wars', xp: xpData.wars.xp, color: '#E04040' },
    { name: 'Seasonal / Events', xp: xpData.season.xp, color: '#B04FFF' }
  ];
  
  return sources.map(source => {
    const pct = xpData.total.daily > 0 ? 
      Math.round((source.xp / xpData.total.daily) * 100) : 0;
    
    let subRows = '';
    if (source.hasSub && xpData.donations.xp > 0) {
      subRows = `
        <div class="sub-row">
          <span class="sub-name">↳ Troops (${fmtK(xpData.donations.breakdown.troops)} XP)</span>
          <span class="sub-detail">× 1 XP / space</span>
          <span class="sub-xp">${loc(xpData.donations.breakdown.troops)} XP</span>
        </div>
        <div class="sub-row">
          <span class="sub-name">↳ Spells (${fmtK(xpData.donations.breakdown.spells)} XP)</span>
          <span class="sub-detail">× 5 XP / space</span>
          <span class="sub-xp">${loc(xpData.donations.breakdown.spells)} XP</span>
        </div>
        <div class="sub-row">
          <span class="sub-name">↳ Siege Machines (${fmtK(xpData.donations.breakdown.siege)} XP)</span>
          <span class="sub-detail">× 30 XP each</span>
          <span class="sub-xp">${loc(xpData.donations.breakdown.siege)} XP</span>
        </div>`;
    }
    
    return `
      <div class="bk-row">
        <span class="bk-dot" style="background:${source.color}"></span>
        <span class="bk-name">${source.name}</span>
        <div class="bk-bar"><div class="bk-fill" style="width:${pct}%;background:${source.color}"></div></div>
        <span class="bk-xp">${loc(source.xp)}</span>
        <span class="bk-pct">${pct}%</span>
      </div>
      ${subRows}
    `;
  }).join('');
}

function generateWarnings(xpData, days) {
  const warnings = [];
  
  if (xpData.total.daily === 0) {
    warnings.push('Set some daily activities to see your farming estimate.');
  }
  
  if (days > 365 * 2) {
    warnings.push('Target is over 2 years away — try a closer target or increase activity.');
  }
  
  return warnings.map(w => `<div class="warn">⚠️ ${w}</div>`).join('');
}

// Preset Functions
function showSavePresetModal() {
  const name = prompt('Enter preset name:');
  if (name) {
    const result = savePreset(name, state);
    if (result.success) {
      alert('Preset saved successfully!');
      updatePresetList();
    } else {
      alert('Error: ' + result.error);
    }
  }
}

function loadPresetById(id) {
  const result = loadPreset(id);
  if (result.success) {
    Object.assign(state, result.state);
    updateInputsFromState();
    update();
  } else {
    alert('Error: ' + result.error);
  }
}

function deleteCurrentPreset() {
  const select = document.getElementById('load-preset-select');
  const id = select?.value;
  
  if (!id) {
    alert('Please select a preset to delete');
    return;
  }
  
  if (confirm('Are you sure you want to delete this preset?')) {
    const result = deletePreset(id);
    if (result.success) {
      alert('Preset deleted');
      updatePresetList();
    } else {
      alert('Error: ' + result.error);
    }
  }
}

function updatePresetList() {
  const select = document.getElementById('load-preset-select');
  if (!select) return;
  
  const presets = getPresets();
  select.innerHTML = '<option value="">Select a preset...</option>';
  
  presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    select.appendChild(option);
  });
}

function updateInputsFromState() {
  // Profile
  document.getElementById('curLvl').value = state.profile.currentLevel;
  document.getElementById('xpPct').value = state.profile.xpProgress;
  document.getElementById('tgtLvl').value = state.profile.targetLevel;
  
  // Activity
  document.getElementById('atkSlider').value = state.activity.attacks;
  document.getElementById('starsSlider').value = state.activity.stars;
  
  // Donations
  document.getElementById('troopSlider').value = state.donations.troops;
  document.getElementById('spellSlider').value = state.donations.spells;
  document.getElementById('siegeSlider').value = state.donations.siege;
  
  // Builders
  document.getElementById('bldSlider').value = state.builders.count;
  document.getElementById('upgSlider').value = state.builders.upgradeTime;
  
  // War
  document.getElementById('warSlider').value = state.war.attacks;
  document.getElementById('warStarsSlider').value = state.war.stars;
  document.getElementById('seasonSlider').value = state.war.seasonalBonus;
}

// Export Functions
function exportResults() {
  const results = {
    state,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `xp-simulator-results-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function exportAllPresets() {
  const data = exportPresets();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `xp-simulator-presets-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function importPresetsFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importPresets(event.target.result);
      if (result.success) {
        alert(`Imported ${result.imported} presets`);
        updatePresetList();
      } else {
        alert('Import failed: ' + result.error);
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
}

// Modal Functions
function showHelpModal() {
  alert('Keyboard Shortcuts:\n\n' +
    'Ctrl+S: Save preset\n' +
    'Ctrl+E: Export results\n' +
    '?: Show this help\n' +
    'Esc: Close modals');
}

function closeAllModals() {
  // Placeholder for future modal implementation
  console.log('Closing modals');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
