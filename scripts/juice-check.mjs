// scripts/juice-check.mjs
import assert from 'node:assert/strict';
import { shouldCelebrate, tweenFrames, shareCardText } from '../src/lib/juice.js';

assert.equal(shouldCelebrate(466, 400, true), true);
assert.equal(shouldCelebrate(400, 466, true), false);
assert.equal(shouldCelebrate(466, 400, false), false);
assert.equal(shouldCelebrate(466, Infinity, true), false);
assert.deepEqual(tweenFrames(0, 100, 4), [25, 50, 75, 100]);
assert.equal(shareCardText(120, 150, 87), 'Lvl 120 → 150 in 87 days — CoC XP Sim');
assert.equal(shareCardText(1, 2, 1), 'Lvl 1 → 2 in 1 day — CoC XP Sim');
console.log('juice OK');
