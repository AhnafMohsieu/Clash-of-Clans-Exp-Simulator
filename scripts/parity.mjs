import assert from 'node:assert/strict';
import * as eng from '../src/lib/xp-calculator.js';

// Migration parity was proven against the legacy XPC engine before deletion
// (git history + tag legacy-static). These anchors guard the frozen math.
assert.equal(eng.totalNeeded(1, 0, 2), 30);
assert.equal(eng.totalNeeded(150, 50, 200), 430025);
const mid = eng.calculateXP({ atk: 10, stars: 2, troopSV: 1, spellSV: 0, siegeSV: 0, bld: 1, upg: 1, war: 7, warStars: 2, season: 100 });
assert.equal(mid.total.daily, 924);
assert.equal(mid.total.weekly, 6468);
console.log('parity OK: anchors hold');
