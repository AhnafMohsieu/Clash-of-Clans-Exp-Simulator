export function getDefaultState() {
  return {
    profile: { currentLevel: 1, xpProgress: 0, targetLevel: 2 },
    activity: { attacks: 0, stars: 0 },
    donations: { troops: 0, spells: 0, siege: 0 },
    builders: { count: 0, upgradeTime: 0 },
    war: { attacks: 0, stars: 0, seasonalBonus: 0 },
    settings: { theme: 'gold' }
  };
}

const INT = (v, fb) => { const n = parseInt(v); return Number.isNaN(n) ? fb : n; };

export function applyInput(state, id, value) {
  switch (id) {
    case 'curLvl': state.profile.currentLevel = Math.max(1, Math.min(499, INT(value, 1))); break;
    case 'xpPct': state.profile.xpProgress = INT(value, 0); break;
    case 'tgtLvl': state.profile.targetLevel = Math.max(state.profile.currentLevel + 1, Math.min(500, INT(value, state.profile.currentLevel + 1))); break;
    case 'atkSlider': state.activity.attacks = INT(value, 0); break;
    case 'starsSlider': state.activity.stars = INT(value, 0); break;
    case 'troopSlider': state.donations.troops = INT(value, 0); break;
    case 'spellSlider': state.donations.spells = INT(value, 0); break;
    case 'siegeSlider': state.donations.siege = INT(value, 0); break;
    case 'bldSlider': state.builders.count = INT(value, 0); break;
    case 'upgSlider': { const n = parseFloat(value); state.builders.upgradeTime = Number.isNaN(n) ? 0 : n; break; }
    case 'warSlider': state.war.attacks = INT(value, 0); break;
    case 'warStarsSlider': state.war.stars = INT(value, 0); break;
    case 'seasonSlider': state.war.seasonalBonus = INT(value, 0); break;
  }
  return state;
}

export function collectParams(state) {
  return {
    atk: state.activity.attacks, stars: state.activity.stars,
    troopSV: state.donations.troops, spellSV: state.donations.spells, siegeSV: state.donations.siege,
    bld: state.builders.count, upg: state.builders.upgradeTime,
    war: state.war.attacks, warStars: state.war.stars, season: state.war.seasonalBonus
  };
}
