export const LEVEL_EXP_BASE = 100;
export const LEVEL_EXP_MULT = 1.5;

export function getExpForLevel(level) {
  return Math.floor(LEVEL_EXP_BASE * Math.pow(LEVEL_EXP_MULT, level - 1));
}

export function initLeveling(player) {
  player.level = 1;
  player.exp = 0;
  player.attributePoints = 30; // Starting points for customization
}

export function addExp(player, amount) {
  player.exp += amount;
  let leveledUp = false;
  while (player.exp >= getExpForLevel(player.level + 1)) {
    player.level++;
    player.attributePoints += 5; // Points per level up
    leveledUp = true;
  }
  return leveledUp;
}