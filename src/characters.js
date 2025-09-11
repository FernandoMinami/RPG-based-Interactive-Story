/**
 * Character Statistics System
 * 
 * This module provides character stat calculations with comprehensive validation.
 * All calculation functions now validate character structure before proceeding.
 * 
 * Key validation features:
 * - Ensures primary attributes exist and are numeric
 * - Validates secondary attributes structure
 * - Repairs broken character structures automatically
 * - Logs detailed error messages for debugging
 * 
 * Usage examples:
 * ```javascript
 * // Update a character's stats with validation
 * updateSecondaryStats(character, true); // For players
 * updateSecondaryStats(enemy, false);    // For enemies
 * 
 * // Manual validation
 * if (validateCharacter(character)) {
 *   // Safe to perform operations
 * }
 * 
 * // Repair a broken character
 * character = repairCharacterStructure(character);
 * ```
 */

import { updateMpBar, updateCharacterUI, updateLifeBar } from './ui.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { addItemPhysicalDefense, addItemMagicDefense, applyAllEquipmentBonuses } from './items.js';
import { 
  validateCharacter, 
  validatePrimaryAttributes, 
  validateSecondaryAttributes,
  initializeCharacterStructure,
  repairCharacterStructure 
} from './character-validation.js';

// player is set globally in story.js, so you can use it directly


// maxlife is based on constitution, but can be adjusted as needed
function calculateMaxLife(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate max life: invalid character structure');
    return 0;
  }
  
  character.secondary.maxLife = character.primary.constitution * 10;
  if (character.secondary.maxLife < 10) character.secondary.maxLife = 10; // Ensure player at least has some max life
  return character.secondary.maxLife;
}

// lifeRegen is based on constitution, but can be adjusted as needed
function calculateLifeRegen(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate life regen: invalid character structure');
    return 0;
  }
  
  character.secondary.lifeRegen = Math.floor(character.primary.constitution / 3) - 1;
  if (character.secondary.lifeRegen < 0) character.secondary.lifeRegen = 0; // Ensure no negative regen
  return character.secondary.lifeRegen;
}

// Max MP based on intelligence
function calculateMaxMp(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate max MP: invalid character structure');
    return 0;
  }
  
  character.secondary.maxMp = character.primary.intelligence * 10;
  if (character.secondary.maxMp < 0) character.secondary.maxMp = 0; // Ensure no negative max MP
  return character.secondary.maxMp;
}

// MP regeneration based on intelligence
function calculateMpRegen(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate MP regen: invalid character structure');
    return 0;
  }
  
  character.secondary.mpRegen = Math.floor(character.primary.intelligence / 2) - 1;
  if (character.secondary.mpRegen < 0) character.secondary.mpRegen = 0; // Ensure no negative regen
  return character.secondary.mpRegen;
}

// Speed based on dexterity, but can be adjusted as needed
function calculateSpeed(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate speed: invalid character structure');
    return 0;
  }
  
  character.secondary.speed = Math.floor(character.primary.dexterity / 1.5) - 5;
  if (character.secondary.speed < 0) character.secondary.speed = 0; // Ensure no negative speed
  return character.secondary.speed;
}

// Max Stamina based on constitution
function calculateMaxStamina(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate max stamina: invalid character structure');
    return 0;
  }
  
  character.secondary.maxStamina = character.primary.constitution * 10;
  return character.secondary.maxStamina;
}

// calculate accuracy based on dexterity, but can be adjusted as needed
function calculateAccuracy(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate accuracy: invalid character structure');
    return 0;
  }
  
  character.secondary.accuracy = Math.floor(character.primary.dexterity / 2) - 5;
  if (character.secondary.accuracy < 0) character.secondary.accuracy = 0; // Ensure no negative accuracy
  return character.secondary.accuracy;
}

// Physical damage based on strength, but can be adjusted as needed
function calculatePhysicalDamage(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate physical damage: invalid character structure');
    return 0;
  }
  
  const baseDamage = Math.floor(character.primary.strength * 0.5) - 5;
  character.secondary.physicalDamage = baseDamage < 0 ? 0 : baseDamage;
  return character.secondary.physicalDamage;
}

// Magic damage based on intelligence, but can be adjusted as needed
function calculateMagicDamage(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate magic damage: invalid character structure');
    return 0;
  }
  
  character.secondary.magicDamage = Math.floor(character.primary.intelligence * 0.5) - 5;
  if (character.secondary.magicDamage < 0) character.secondary.magicDamage = 0; // Ensure no negative damage
  return character.secondary.magicDamage;
}

// calculate physical defense based on constitution, but can be adjusted as needed
function calculatePhysicalDefense(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate physical defense: invalid character structure');
    return 0;
  }
  
  const baseDefense = Math.floor(character.primary.constitution * 0.5) - 5;
  character.secondary.physicalDefense = baseDefense < 0 ? 0 : baseDefense;
  return character.secondary.physicalDefense;
}

// calculate magic defense based on intelligence, but can be adjusted as needed
function calculateMagicDefense(character) {
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot calculate magic defense: invalid character structure');
    return 0;
  }
  
  character.secondary.magicDefense = Math.floor(character.primary.intelligence * 0.5) - 5;
  if (character.secondary.magicDefense < 0) character.secondary.magicDefense = 0; // Ensure no negative defense
  return character.secondary.magicDefense;
}

function lifeChecks(character) {
  if (!validateSecondaryAttributes(character)) {
    console.error('Cannot perform life checks: invalid secondary attributes');
    return;
  }
  
  // Ensure life is set if it's not already set or if it's 0
  if (!character.secondary.life || character.secondary.life === 0) {
    character.secondary.life = character.secondary.maxLife;
  }
  // If current life exceeds new maxLife, adjust it
  if (character.secondary.life > character.secondary.maxLife) {
    character.secondary.life = character.secondary.maxLife;
  }
}

function mpChecks(character) {
  if (!validateSecondaryAttributes(character)) {
    console.error('Cannot perform MP checks: invalid secondary attributes');
    return;
  }
  
  // Ensure mp is set if it's not already set or if it's 0
  if (!character.secondary.mp || character.secondary.mp === 0) {
    character.secondary.mp = character.secondary.maxMp;
  }
  // If current mp exceeds new maxMp, adjust it
  if (character.secondary.mp > character.secondary.maxMp) {
    character.secondary.mp = character.secondary.maxMp;
  }
}

function staminaChecks(character) {
  if (!validateSecondaryAttributes(character)) {
    console.error('Cannot perform stamina checks: invalid secondary attributes');
    return;
  }
  
  // Ensure stamina is set if it's not already set or if it's 0
  if (!character.secondary.stamina || character.secondary.stamina === 0) {
    character.secondary.stamina = character.secondary.maxStamina;
  }
  // If current stamina exceeds new maxStamina, adjust it
  if (character.secondary.stamina > character.secondary.maxStamina) {
    character.secondary.stamina = character.secondary.maxStamina;
  }
}

// Unified function to update secondary stats for any character (player, enemy, NPC)
function updateSecondaryStats(character, isPlayer = false) {
  // Comprehensive validation and repair
  if (!validateCharacter(character, { 
    requirePrimary: true, 
    requireSecondary: true, 
    requireEquipment: isPlayer 
  })) {
    console.error(`Failed to validate character structure for ${character?.name || 'Unknown character'}`);
    
    // Attempt to repair the character structure
    character = repairCharacterStructure(character);
    
    if (!character) {
      console.error('Character repair failed - cannot update secondary stats');
      return;
    }
    
  }

  
  // Reset primary attributes to base values before applying equipment bonuses
  // This ensures that unequipping items properly removes their bonuses
  if (isPlayer && character.basePrimary) {
    Object.keys(character.basePrimary).forEach(attr => {
      if (character.primary.hasOwnProperty(attr)) {
        character.primary[attr] = character.basePrimary[attr];
      }
    });
  } else if (isPlayer) {
    // If no basePrimary stored, use default base values for customCharacter
    const defaultBase = {
      strength: 5,
      dexterity: 5,
      constitution: 5,
      intelligence: 5,
      charisma: 5,
      wisdom: 5
    };
    Object.keys(defaultBase).forEach(attr => {
      if (character.primary.hasOwnProperty(attr)) {
        character.primary[attr] = defaultBase[attr];
      }
    });
    
    // Store the base values for future use
    character.basePrimary = { ...defaultBase };
  }

  // Perform calculations
  calculateMaxLife(character);
  lifeChecks(character);
  calculateLifeRegen(character);

  calculateMaxMp(character);
  mpChecks(character);
  calculateMpRegen(character);

  calculateMaxStamina(character);
  staminaChecks(character);

  calculateSpeed(character);
  calculateAccuracy(character);

  calculatePhysicalDamage(character);
  calculateMagicDamage(character);

  calculatePhysicalDefense(character);
  calculateMagicDefense(character);

  // Only add item bonuses for players (enemies don't have equipment system)
  // IMPORTANT: Apply equipment bonuses AFTER all base calculations are done
  // so they don't get overwritten by the calculation functions above
  if (isPlayer) {
    // Use the comprehensive equipment bonus function
    applyAllEquipmentBonuses(character);
  }
}

// Legacy functions for backward compatibility
function updatePlayerSecondaryStats(player) {
  updateSecondaryStats(player, true);
}

function updateEnemySecondaryStats(enemy) {
  updateSecondaryStats(enemy, false);
}


function regenMp() {
  player.secondary.mp += Math.floor(player.secondary.mpRegen || 0);
  if (player.secondary.mp > player.secondary.maxMp) player.secondary.mp = player.secondary.maxMp;

  updateMpBar();
}

function regenLife(bonusRegeneration = 0) {
  const totalRegen = Math.floor(player.secondary.lifeRegen || 0) + bonusRegeneration;
  player.secondary.life += totalRegen;
  if (player.secondary.life > player.secondary.maxLife) player.secondary.life = player.secondary.maxLife;

  updateLifeBar();

  return totalRegen; // Return the amount regenerated for logging
}

// Fully restore MP
function fullMpRestore() {
  player.secondary.mp = player.secondary.maxMp;
  updateMpBar();
  historyLog("Your magical energy is fully restored.");
  updateHistoryPanel();
}

// Fully restore life
function fullLifeRestore() {
  player.secondary.life = player.secondary.maxLife;
  updateLifeBar();
  historyLog("You feel completely rejuvenated.");
  updateHistoryPanel();
}

// Legacy handleBoosts function removed - now using BuffRegistry system in status.js
// Buff expiration is handled by the turn management system

// Add this function globally so "+" buttons can call it
window.assignAttributeUI = function (attr) {
  if (player.attributePoints > 0) {
    player.primary[attr]++;
    player.attributePoints--;
    updateSecondaryStats(player, true);
    if (attr === "constitution") {
      player.secondary.life = player.secondary.life + 10;
    } else if (attr === "intelligence") {
      player.secondary.mp = player.secondary.mp + 10;
    }
    // Refresh the modal content without rebuilding
    if (window.refreshCharacterStatsModal) {
      window.refreshCharacterStatsModal();
    }
    updateCharacterUI && updateCharacterUI();

    // Update dice choice texts to reflect the new attribute values
    if (typeof window.updateDiceChoiceTexts === 'function') {
      window.updateDiceChoiceTexts();
    }
  }
}

export {
  updateSecondaryStats,
  updatePlayerSecondaryStats,
  updateEnemySecondaryStats,
  regenMp,
  regenLife,
  fullMpRestore,
  fullLifeRestore,
  // Export validation functions for use in other modules
  validateCharacter,
  validatePrimaryAttributes,
  validateSecondaryAttributes,
  initializeCharacterStructure,
  repairCharacterStructure
};