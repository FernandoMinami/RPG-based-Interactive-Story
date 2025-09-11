import { updateMpBar, updateCharacterUI, updateLifeBar } from './ui.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { updateSecondaryStats } from './characters.js';
//import { player } from './story.js';
import { updateInventoryBar, updateStoryUI } from './ui.js';
import { validateEquipmentStructure, validatePrimaryAttributes } from './character-validation.js';


export let items = {};

// Debug access to items
window._debugItems = items;

async function loadItems(storyFolder) {
  // Clear the existing items object
  Object.keys(items).forEach(k => delete items[k]);


  const manifestUrl = `../story-content/${storyFolder}/items.json?v=${Date.now()}`;
  const itemList = await fetch(manifestUrl).then(r => r.json());
  
  
  const totalItems = Object.keys(itemList).length;
  let loadedCount = 0;
  let failedCount = 0;

  for (const [id, itemInfo] of Object.entries(itemList)) {
    let itemId = id.toLowerCase();
    if (itemInfo.file) {
      try {
        const itemModule = await import(`../story-content/${storyFolder}/items/${itemInfo.file}?v=${Date.now()}`);
        // Handle both export patterns: export default {...} and export const item = {...}
        const itemData = itemModule.default || itemModule.item;
        if (!itemData) {
          throw new Error(`Item data not found in module. Expected 'default' or 'item' export.`);
        }
        itemId = (itemData.id || id).toLowerCase();
        items[itemId] = itemData;
        loadedCount++;
      } catch (error) {
        console.error(`❌ Failed to load item ${id} from ${itemInfo.file}:`, error);
        failedCount++;
      }
    } else {
      items[itemId] = itemInfo;
      loadedCount++;
    }
  }
}

function addItemPhysicalDefense(character) {
  // Use passed character or fall back to global player
  const char = character || player;
  
  // Validate player structure
  if (!Array.isArray(char.equipment)) {
    console.error('Cannot add item physical defense: character equipment is not an array');
    return;
  }

  // Add physical defense from all equipped items
  char.equipment.forEach(slot => {
    const eq = slot.item;
    if (eq) {
      // Support both old (modifiers) and new (stats) structure
      const equipStats = eq.modifiers || eq.stats;
      if (equipStats && typeof equipStats.physicalDefense === "number") {
        char.secondary.physicalDefense += equipStats.physicalDefense;
      }
    }
  });
}

function addItemMagicDefense(character) {
  // Use passed character or fall back to global player
  const char = character || player;
  
  // Validate player structure
  if (!Array.isArray(char.equipment)) {
    console.error('Cannot add item magic defense: character equipment is not an array');
    return;
  }

  // Add magic defense from all equipped items
  char.equipment.forEach(slot => {
    const eq = slot.item;
    if (eq) {
      // Support both old (modifiers) and new (stats) structure
      const equipStats = eq.modifiers || eq.stats;
      if (equipStats && typeof equipStats.magicDefense === "number") {
        char.secondary.magicDefense += equipStats.magicDefense;
      }
    }
  });
}

/**
 * Apply all equipment bonuses to character stats
 * @param {Object} character - The character to apply bonuses to
 */
function applyAllEquipmentBonuses(character) {
  // Use passed character or fall back to global player
  const char = character || player;
  
  
  // Validate player structure
  if (!Array.isArray(char.equipment)) {
    console.error('❌ Cannot apply equipment bonuses: character equipment is not an array', {
      equipment: char.equipment,
      equipmentType: typeof char.equipment
    });
    return;
  }


  // Store initial stats for comparison
  const initialPrimary = { ...char.primary };
  const initialSecondary = { ...char.secondary };

  let totalBonusesApplied = 0;

  // Apply bonuses from all equipped items
  char.equipment.forEach((slot, index) => {
    
    const eq = slot.item;
    if (eq) {
      
      // Support both old (modifiers) and new (stats) structure
      const equipStats = eq.modifiers || eq.stats;
      
      if (equipStats) {
        
        // Apply primary attribute bonuses
        if (char.primary) {
          Object.keys(equipStats).forEach(stat => {
            if (char.primary.hasOwnProperty(stat) && typeof equipStats[stat] === "number") {
              const oldValue = char.primary[stat];
              char.primary[stat] += equipStats[stat];
              totalBonusesApplied++;
            } else if (char.primary.hasOwnProperty(stat)) {
            } else {
            }
          });
        } else {
          console.error('❌ Character has no primary stats object');
        }
        
        // Apply secondary attribute bonuses
        if (char.secondary) {
          Object.keys(equipStats).forEach(stat => {
            if (char.secondary.hasOwnProperty(stat) && typeof equipStats[stat] === "number") {
              const oldValue = char.secondary[stat];
              char.secondary[stat] += equipStats[stat];
              totalBonusesApplied++;
            } else if (char.secondary.hasOwnProperty(stat)) {
            } else {
            }
          });
        } else {
          console.error('❌ Character has no secondary stats object');
        }
      } else {
      }
    } else {
    }
  });

  
}

function equipableItems() {
  // Validate player structure before equipment operations
  if (!validateEquipmentStructure(player) || !validatePrimaryAttributes(player)) {
    console.error('Cannot perform equipment operation: invalid player structure');
    return false;
  }

  // Unequip any item in this slot first
  const current = player.equipment[this.slot];
  if (current && current !== this) {
    // Remove modifiers of currently equipped item
    for (const [attr, mod] of Object.entries(current.modifiers)) {
      if (player.primary[attr] !== undefined) {
        player.primary[attr] -= mod;
      }
    }
    current.equipped = false;
  }

  if (!this.equipped) {
    // Equip: apply modifiers
    for (const [attr, mod] of Object.entries(this.modifiers)) {
      if (player.primary[attr] !== undefined) {
        player.primary[attr] += mod;
      }
      if (attr === "physicalDefense" || attr === "magicDefense") {
        player.secondary[attr] += mod; // Update secondary stats
      }
    }
    this.equipped = true;
    player.equipment[this.slot] = this;
    return true;
  } else {
    // Unequip: remove modifiers
    for (const [attr, mod] of Object.entries(this.modifiers)) {
      if (player.primary[attr] !== undefined) {
        player.primary[attr] -= mod;
      }
      if (attr === "physicalDefense" || attr === "magicDefense") {
        player.secondary[attr] -= mod; // Update secondary stats
      }
    }
    this.equipped = false;
    player.equipment[this.slot] = null;
    return true;
  }
  updateInventoryBar();
  updateStoryUI();
}

export {
  loadItems,
  equipableItems,
  addItemPhysicalDefense,
  addItemMagicDefense,
  applyAllEquipmentBonuses
}

// Debug function to test equipment bonuses
window.debugTestEquipmentBonuses = function() {
  
  if (!window.player) {
    console.error('❌ No player found');
    return;
  }
  
  // Test the function
  applyAllEquipmentBonuses(window.player);
  
};

// Debug function to completely reset character stats
window.debugResetCharacterStats = function() {
  
  if (!window.player) {
    console.error('❌ No player found');
    return;
  }
  
  // Reset to base primary attributes
  window.player.primary = {
    strength: 5,
    dexterity: 5,
    constitution: 5,
    intelligence: 5,
    charisma: 5,
    wisdom: 5
  };
  
  // Store base primary for future use
  window.player.basePrimary = { ...window.player.primary };
  
  // Update secondary stats properly
  if (window.updateSecondaryStats) {
    window.updateSecondaryStats(window.player, true);
  }
};

// Simple debug function to test basic equip operations
window.debugTestEquipmentSystem = function() {
  
  if (!window.player) {
    console.error('❌ No player found');
    return;
  }
  
  // Test equipment structure validation
  if (window.validateEquipmentStructure) {
    const isValidEquipment = window.validateEquipmentStructure(window.player);
  }
  
  if (window.validatePrimaryAttributes) {
    const isValidPrimary = window.validatePrimaryAttributes(window.player);
  }
  
};

// Quick test for leather helmet equip/unequip
window.debugTestLeatherHelmet = function() {
  
  // Reset character first
  window.debugResetCharacterStats();
  
  // Try to use the leather helmet
  const useItemBtn = document.querySelector('[data-item-id="leather-helmet"]');
  if (useItemBtn) {
    useItemBtn.click();
    
    setTimeout(() => {
      // Test unequipping
      useItemBtn.click();
      
      setTimeout(() => {
      }, 100);
    }, 100);
  } else {
    console.error('❌ Leather helmet item button not found');
  }
};