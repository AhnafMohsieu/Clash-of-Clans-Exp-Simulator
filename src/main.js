import './styles.css';
import { calculateXP, totalNeeded } from './lib/xp-calculator.js';
import { getDefaultState, applyInput, collectParams } from './lib/state.js';

const state = getDefaultState();
const IDS = ['curLvl','xpPct','tgtLvl','atkSlider','starsSlider','troopSlider','spellSlider','siegeSlider','bldSlider','upgSlider','warSlider','warStarsSlider','seasonSlider'];

export function update() {
  const xpData = calculateXP(collectParams(state));
  const needed = totalNeeded(state.profile.currentLevel, state.profile.xpProgress, state.profile.targetLevel);
  return { xpData, needed };
}

IDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => { applyInput(state, id, el.value); update(); });
});
update();
