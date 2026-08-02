// XP Calculation Engine for Clash of Clans Simulator
import { clamp } from './utils.js';

/**
 * Calculate XP required for a specific level
 * @param {number} level - Target level
 * @returns {number} XP required for that level
 */
export function xpForLevel(level) {
  if (level === 1) return 30;
  if (level <= 200) return (level - 1) * 50;
  if (level <= 299) return (level - 200) * 500 + 9500;
  return (level - 300) * 1000 + 60000;
}

/**
 * Calculate cumulative XP to reach a level from level 1
 * @param {number} level - Target level
 * @returns {number} Total cumulative XP
 */
export function cumulXP(level) {
  if (level <= 1) return 0;
  if (level <= 201) return (level - 1) * (level - 2) * 25 + 30;
  if (level <= 299) return 250 * Math.pow(level - 200, 2) + 9250 * (level - 200) + 985530;
  return 500 * Math.pow(level - 300, 2) + 59500 * (level - 300) + 4410530;
}

/**
 * Calculate total XP needed to reach target from current level
 * @param {number} currentLevel - Current XP level
 * @param {number} currentProgress - Percentage progress in current level (0-99)
 * @param {number} targetLevel - Target XP level
 * @returns {number} XP needed
 */
export function totalNeeded(currentLevel, currentProgress, targetLevel) {
  const earned = Math.round(xpForLevel(currentLevel) * currentProgress / 100);
  return Math.max(0, cumulXP(targetLevel) - cumulXP(currentLevel) - earned);
}

/**
 * Calculate XP from multiplayer attacks
 * @param {Object} params - Attack parameters
 * @returns {Object} Attack XP breakdown
 */
export function calculateAttacks(params) {
  const { attacksPerDay, avgStars } = params;
  
  // XP per star: 1 XP per star (1-3 XP per attack)
  const xpPerStar = 1;
  const dailyXP = attacksPerDay * avgStars * xpPerStar;
  
  return {
    daily: attacksPerDay,
    xp: dailyXP,
    breakdown: {
      oneStar: Math.floor(attacksPerDay * (avgStars >= 1 ? 1 : avgStars)),
      twoStar: Math.floor(attacksPerDay * (avgStars >= 2 ? 1 : avgStars - 1)),
      threeStar: Math.floor(attacksPerDay * (avgStars >= 3 ? 1 : avgStars - 2))
    }
  };
}

/**
 * Calculate XP from donations
 * @param {Object} params - Donation parameters
 * @returns {Object} Donation XP breakdown
 */
export function calculateDonations(params) {
  const { troopSpaces, spellSpaces, siegeMachines } = params;
  
  // XP rates: 1 per troop space, 5 per spell space, 30 per siege machine
  const troopXP = troopSpaces * 1;
  const spellXP = spellSpaces * 5;
  const siegeXP = siegeMachines * 30;
  const totalXP = troopXP + spellXP + siegeXP;
  
  return {
    daily: troopSpaces + spellSpaces + siegeMachines,
    xp: totalXP,
    breakdown: {
      troops: troopXP,
      spells: spellXP,
      siege: siegeXP
    }
  };
}

/**
 * Calculate XP from builder upgrades
 * @param {Object} params - Builder parameters
 * @returns {Object} Builder XP breakdown
 */
export function calculateBuilders(params) {
  const { builderCount, upgradeTimeDays } = params;
  
  // XP = sqrt(upgrade duration in seconds) per builder
  const upgradeTimeSeconds = upgradeTimeDays * 86400;
  const xpPerBuilder = upgradeTimeDays > 0 ? Math.sqrt(upgradeTimeSeconds) : 0;
  const totalXP = Math.round(builderCount * xpPerBuilder);
  
  return {
    active: builderCount,
    xp: totalXP,
    breakdown: {
      perBuilder: Math.round(xpPerBuilder),
      total: totalXP
    }
  };
}

/**
 * Calculate XP from clan wars
 * @param {Object} params - War parameters
 * @returns {Object} War XP breakdown
 */
export function calculateWars(params) {
  const { warAttacksPerWeek, avgWarStars } = params;
  
  // 5 XP per war star, weekly cap of 14 stars
  const weeklyStars = clamp(warAttacksPerWeek * avgWarStars, 0, 14);
  const weeklyXP = weeklyStars * 5;
  const dailyXP = Math.round(weeklyXP / 7 * 100) / 100;
  
  return {
    weekly: weeklyStars,
    daily: dailyXP,
    xp: dailyXP,
    breakdown: {
      stars: weeklyStars,
      xpPerStar: 5
    }
  };
}

/**
 * Calculate XP from season challenges
 * @param {Object} params - Season parameters
 * @returns {Object} Season XP breakdown
 */
export function calculateSeason(params) {
  const { seasonalBonusPerDay } = params;
  
  return {
    daily: seasonalBonusPerDay,
    xp: seasonalBonusPerDay,
    breakdown: {
      challenges: Math.floor(seasonalBonusPerDay / 25),
      bonus: seasonalBonusPerDay % 25
    }
  };
}

/**
 * Calculate total daily XP from all sources
 * @param {Object} params - All input parameters
 * @returns {Object} Complete XP breakdown
 */
export function calculateXP(params) {
  const attacks = calculateAttacks({
    attacksPerDay: params.atk,
    avgStars: params.stars
  });
  
  const donations = calculateDonations({
    troopSpaces: params.troopSV * 500,
    spellSpaces: params.spellSV * 50,
    siegeMachines: params.siegeSV * 5
  });
  
  const builders = calculateBuilders({
    builderCount: params.bld,
    upgradeTimeDays: params.upg
  });
  
  const wars = calculateWars({
    warAttacksPerWeek: params.war,
    avgWarStars: params.warStars
  });
  
  const season = calculateSeason({
    seasonalBonusPerDay: params.season
  });
  
  const totalDailyXP = attacks.xp + donations.xp + builders.xp + wars.xp + season.xp;
  
  return {
    attacks,
    donations,
    builders,
    wars,
    season,
    total: {
      daily: totalDailyXP,
      weekly: Math.round(totalDailyXP * 7)
    }
  };
}
