import assert from 'node:assert/strict';
import * as oldEng from '../XPC/js/xp-calculator.js';
import * as newEng from '../src/lib/xp-calculator.js';

const profiles = [
  { cur: 1, pct: 0, tgt: 2 },
  { cur: 150, pct: 50, tgt: 200 },
  { cur: 299, pct: 99, tgt: 500 }
];
const activities = [
  { atk: 0, stars: 0, troopSV: 0, spellSV: 0, siegeSV: 0, bld: 0, upg: 0, war: 0, warStars: 0, season: 0 },
  { atk: 10, stars: 2, troopSV: 1, spellSV: 0, siegeSV: 0, bld: 1, upg: 1, war: 7, warStars: 2, season: 100 },
  { atk: 20, stars: 3, troopSV: 200, spellSV: 200, siegeSV: 200, bld: 6, upg: 18, war: 14, warStars: 3, season: 200 }
];
for (const p of profiles) {
  assert.equal(
    newEng.totalNeeded(p.cur, p.pct, p.tgt),
    oldEng.totalNeeded(p.cur, p.pct, p.tgt),
    `totalNeeded ${p.cur}/${p.pct}/${p.tgt}`
  );
}
for (const a of activities) {
  assert.deepEqual(newEng.calculateXP(a), oldEng.calculateXP(a), `calculateXP ${JSON.stringify(a)}`);
}
// Hardcoded anchors derived from the current engine formulas:
// totalNeeded(1,0,2) = cumulXP(2) - 0 - 0 = 30
assert.equal(newEng.totalNeeded(1, 0, 2), 30);
// Mid activity: 20 (attacks) + 500 (troops 1*500) + 294 (builder sqrt(86400)) + 10 (wars 14 stars*5/7) + 100 (season) = 924
const mid = newEng.calculateXP({ atk: 10, stars: 2, troopSV: 1, spellSV: 0, siegeSV: 0, bld: 1, upg: 1, war: 7, warStars: 2, season: 100 });
assert.equal(mid.total.daily, 924);
assert.equal(mid.total.weekly, 6468);
// totalNeeded(150,50,200) = 985080 - 551330 - 3725 = 430025
assert.equal(newEng.totalNeeded(150, 50, 200), 430025);
console.log('parity OK: 3 profiles, 3 activities, 3 anchors');
