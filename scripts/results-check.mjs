// scripts/results-check.mjs
import assert from 'node:assert/strict';
import { formatDuration, breakdownPct, warnings, daysToTarget } from '../src/lib/results.js';

assert.deepEqual(formatDuration(Infinity), { short: '—', long: 'No XP gained' });
assert.deepEqual(formatDuration(1), { short: '1d', long: '1 day' });
assert.deepEqual(formatDuration(6), { short: '6d', long: '6 days' });
assert.deepEqual(formatDuration(21), { short: '21d', long: '3.0 weeks' });
assert.deepEqual(formatDuration(60), { short: '60d', long: '2.0 months' });
assert.deepEqual(formatDuration(400), { short: '1.1y', long: '1.1 years' });
assert.equal(breakdownPct(462, 924), 50);
assert.equal(breakdownPct(5, 0), 0);
assert.deepEqual(warnings(false, Infinity), ['Set some daily activities to see your farming estimate.']);
assert.deepEqual(warnings(true, 800), ['Target is over 2 years away — try a closer target or increase activity.']);
assert.equal(daysToTarget(430025, 924), 466);
console.log('results OK');
