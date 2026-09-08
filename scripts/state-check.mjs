// scripts/state-check.mjs
import assert from 'node:assert/strict';
import { getDefaultState, applyInput, collectParams } from '../src/lib/state.js';

const s = getDefaultState();
applyInput(s, 'curLvl', '999');
assert.equal(s.profile.currentLevel, 499);
applyInput(s, 'curLvl', '150');
applyInput(s, 'tgtLvl', '100');
assert.equal(s.profile.targetLevel, 151);
applyInput(s, 'upgSlider', '7.5');
assert.equal(s.builders.upgradeTime, 7.5);
applyInput(s, 'seasonSlider', 'abc');
assert.equal(s.war.seasonalBonus, 0);
const p = collectParams(s);
assert.equal(p.troopSV, 0);
console.log('state OK');
