import { updateManaBar, updateCharacterUI } from './ui.js';
import { historyLog } from './history.js';

// player is set globally in story.js, so you can use it directly

// --- Secondary stats calculation ---
function updateSecondaryStats(player) {
  // maxlife is based on constitution, but can be adjusted as needed
  player.secondary.maxLife = player.attributes.constitution * 10;
  if (player.secondary.maxLife < 0) player.secondary.maxLife = 0; // Ensure no negative max life
  // Update player's max life
  player.maxLife = player.secondary.maxLife;

  // Update max Mana based on intelligence
  player.maxMana = player.attributes.intelligence * 10;
  if (player.maxMana < 0) player.maxMana = 0; // Ensure no negative max Mana
  // Optionally, restore Mana when max Mana increases
  if (player.mana > player.maxMana) player.mana = player.maxMana;

  // Mana Regen is based on intelligence, but can be adjusted as needed
  player.secondary.manaRegen = Math.floor(player.attributes.intelligence / 2) - 1;
  if (player.secondary.manaRegen < 0) player.secondary.manaRegen = 0; // Ensure no negative regen

  // Speed is based on dexterity, but can be adjusted as needed
  player.secondary.speed = Math.floor(player.attributes.dexterity / 1.5) - 5;
  if (player.secondary.speed < 0) player.secondary.speed = 0; // Ensure no negative speed

  // Physical damage is based on strength, but can be adjusted as needed
  player.secondary.physicDamage = Math.floor(player.attributes.strength * 0.5) - 5;
  if (player.secondary.physicDamage < 0) player.secondary.physicDamage = 0; // Ensure no negative damage

  // Magic damage is based on intelligence, but can be adjusted as needed
  player.secondary.magicDamage = Math.floor(player.attributes.intelligence * 0.5) - 5;
  if (player.secondary.magicDamage < 0) player.secondary.magicDamage = 0; // Ensure no negative damage

  // Physical defense is based on constitution, but can be adjusted as needed
  player.secondary.physicDefense = Math.floor(player.attributes.constitution * 0.5) - 5;
  if (player.secondary.physicDefense < 0) player.secondary.physicDefense = 0; // Ensure no negative defense

  // Magic defense is based on intelligence, but can be adjusted as needed
  player.secondary.magicDefense = Math.floor(player.attributes.intelligence * 0.5) - 5;
  if (player.secondary.magicDefense < 0) player.secondary.magicDefense = 0; // Ensure no negative defense

    // Add physical defense from all equipped items
  for (const slot of Object.keys(player.equipment)) {
    const eq = player.equipment[slot];
    if (eq && eq.modifiers && typeof eq.modifiers.physicDefense === "number") {
      player.secondary.physicDefense += eq.modifiers.physicDefense;
    }
  }

  // Add magic defense from all equipped items
  for (const slot of Object.keys(player.equipment)) {
    const eq = player.equipment[slot];
    if (eq && eq.modifiers && typeof eq.modifiers.magicDefense === "number") {
      player.secondary.magicDefense += eq.modifiers.magicDefense;
    }
  }
}

function regenMp() {
  player.mana += Math.floor(player.secondary.manaRegen);
  if (player.mana > player.maxMana) player.mana = player.maxMana;
  updateManaBar();
}

function handleBoosts() {
  for (const attr in player.activeBoosts) {
    if (player.activeBoosts[attr]) {
      player.activeBoosts[attr].turns--;
      if (player.activeBoosts[attr].turns <= 0) {
        player.attributes[attr] -= player.activeBoosts[attr].amount;
        historyLog.push({ action: `Boost for ${attr} expired.` });
        player.activeBoosts[attr] = null;
      }
    }
  }
}

// Add this function globally so "+" buttons can call it
window.assignAttributeUI = function (attr) {
  if (player.attributePoints > 0) {
    player.attributes[attr]++;
    player.attributePoints--;
    updateSecondaryStats(player);
    if (attr === "constitution") {
      updateSecondaryStats(player);
      player.life = player.life + 10;
    } else if (attr === "intelligence") {
      updateSecondaryStats(player);
      player.mana = player.mana + 10;
    }
    document.getElementById("show-character-stats-btn").onclick();
    updateCharacterUI && updateCharacterUI();
  }
};

export {
  updateSecondaryStats,
  regenMp,
  handleBoosts
};