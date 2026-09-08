export function formatDuration(days) {
  if (days === Infinity) return { short: '—', long: 'No XP gained' };
  const short = days < 365 ? `${days}d` : `${(days / 365).toFixed(1)}y`;
  let long;
  if (days <= 1) long = '1 day';
  else if (days < 7) long = `${days} days`;
  else if (days < 30) long = `${(days / 7).toFixed(1)} weeks`;
  else if (days < 365) long = `${(days / 30).toFixed(1)} months`;
  else long = `${(days / 365).toFixed(1)} years`;
  return { short, long };
}

export function breakdownPct(xp, total) {
  return total > 0 ? Math.round((xp / total) * 100) : 0;
}

export function warnings(hasDailyXP, days) {
  const w = [];
  if (!hasDailyXP) w.push('Set some daily activities to see your farming estimate.');
  if (days !== Infinity && days > 365 * 2) w.push('Target is over 2 years away — try a closer target or increase activity.');
  return w;
}

export function daysToTarget(needed, dailyXP) {
  return dailyXP > 0 ? Math.ceil(needed / dailyXP) : Infinity;
}
