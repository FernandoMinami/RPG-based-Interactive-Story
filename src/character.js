import { updateManaBar, updateCharacterUI } from './ui.js';
import { historyLog } from './history.js';

// player is set globally in story.js, so you can use it directly

// Helper function to keep mana properties synchronized
function syncManaProperties(player) {
  // Initialize mp properties if they don't exist
  if (player.mp === undefined && player.mana !== undefined) {
    player.mp = player.mana;
  }
  if (player.mana === undefined && player.mp !== undefined) {
    player.mana = player.mp;
  }
  if (player.maxMp === undefined && player.maxMana !== undefined) {
    player.maxMp = player.maxMana;
  }
  if (player.maxMana === undefined && player.maxMp !== undefined) {
    player.maxMana = player.maxMp;
  }
  
  // Use the higher value if both exist (prefer non-zero values)
  if (player.mp !== undefined && player.mana !== undefined) {
    const currentMp = Math.max(player.mp || 0, player.mana || 0);
    player.mp = currentMp;
    player.mana = currentMp; // Keep for compatibility
  }
  
  if (player.maxMp !== undefined && player.maxMana !== undefined) {
    const maxMp = Math.max(player.maxMp || 0, player.maxMana || 0);
    player.maxMp = maxMp;
    player.maxMana = maxMp; // Keep for compatibility
  }
}

// --- Secondary stats calculation ---
function updateSecondaryStats(player) {
  // maxlife is based on constitution, but can be adjusted as needed
  player.secondary.maxLife = player.attributes.constitution * 10;
  if (player.secondary.maxLife < 0) player.secondary.maxLife = 0; // Ensure no negative max life
  // Update player's max life
  player.maxLife = player.secondary.maxLife;
  
  // Ensure life is set if it's not already set or if it's 0
  if (!player.life || player.life === 0) {
    player.life = player.maxLife;
  }
  // If current life exceeds new maxLife, adjust it
  if (player.life > player.maxLife) {
    player.life = player.maxLife;
  }

  // Update max MP based on intelligence
  player.secondary.maxMp = player.attributes.intelligence * 10;
  player.maxMp = player.secondary.maxMp;
  if (player.maxMp < 0) player.maxMp = 0; // Ensure no negative max MP
  
  // Also update maxMana for compatibility with existing code
  player.maxMana = player.maxMp;
  
  // Ensure mp is set if it's not already set or if it's 0
  if (!player.mp || player.mp === 0) {
    player.mp = player.maxMp;
  }
  // If current mp exceeds new maxMp, adjust it
  if (player.mp > player.maxMp) {
    player.mp = player.maxMp;
  }
  
  // Ensure mp properties are synchronized
  syncManaProperties(player);
  
  // Optionally, restore MP when max MP increases
  if (player.mp > player.maxMp) player.mp = player.maxMp;
  if (player.mana > player.maxMana) player.mana = player.maxMana;

  // Mana Regen is based on intelligence, but can be adjusted as needed
  player.secondary.mpRegen = Math.floor(player.attributes.intelligence / 2) - 1;
  if (player.secondary.mpRegen < 0) player.secondary.mpRegen = 0; // Ensure no negative regen
  
  // Keep manaRegen for compatibility
  player.secondary.manaRegen = player.secondary.mpRegen;

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
  player.mp += Math.floor(player.secondary.mpRegen || player.secondary.manaRegen || 0);
  if (player.mp > player.maxMp) player.mp = player.maxMp;
  
  // Sync mana property for compatibility
  player.mana = player.mp;
  
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
      player.mp = player.mp + 10;
      player.mana = player.mp; // Keep in sync
    }
    document.getElementById("show-character-stats-btn").onclick();
    updateCharacterUI && updateCharacterUI();
  }
};

export {
  updateSecondaryStats,
  regenMp,
  handleBoosts,
  syncManaProperties
};