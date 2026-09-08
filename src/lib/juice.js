export function shouldCelebrate(prevDays, nextDays, motionOK) {
  return motionOK && prevDays !== nextDays && nextDays !== Infinity && nextDays <= prevDays;
}

export function tweenFrames(from, to, steps = 12) {
  const out = [];
  for (let i = 1; i <= steps; i++) out.push(Math.round(from + ((to - from) * i) / steps));
  return out;
}

export function shareCardText(cur, tgt, days) {
  return `Lvl ${cur} → ${tgt} in ${days} day${days === 1 ? '' : 's'} — CoC XP Sim`;
}
