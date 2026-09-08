// scripts/presets-check.mjs
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
globalThis.document = {
  createElement: () => {
    let v = '';
    return { set textContent(t) { v = String(t); }, get innerHTML() { return v; } };
  }
};

const { savePreset, loadPreset, deletePreset, exportPresets, importPresets, getPresets } = await import('../src/lib/presets.js');
const state = { profile: { currentLevel: 120, xpProgress: 10, targetLevel: 150 } };

const saved = savePreset('push', state);
assert.equal(saved.success, true);
assert.equal(savePreset('push', state).success, false);
const exported = exportPresets();
store.clear();
const imp = importPresets(exported);
assert.equal(imp.success, true);
assert.equal(imp.imported, 1);
const loaded = loadPreset(saved.preset.id);
assert.deepEqual(loaded.state, state);
assert.equal(deletePreset(saved.preset.id).success, true);
assert.deepEqual(getPresets(), []);
assert.equal(importPresets('nope').success, false);
console.log('presets OK');
