import { inventory, addItem, removeItem, hasItem, getInventory } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateSecondaryStats } from './characters.js';
import { updateHistoryPanel, historyLog } from './history.js';
import { loadItems, items } from './items.js';
import { getAbilities, getAbility } from './abilities.js';
import { statusSummary } from './status.js';
import { formatElementalAlignments, formatRaces } from './element-helpers.js';

// --- Grouped UI update functions ---
function updateCharacterUI() {
  if (!window.player) {
    console.error("Player not available in updateCharacterUI");
    return;
  }
  
  updateSecondaryStats(window.player, true);
  updateLifeBar();
  updateMpBar();
  updateAttributesBar();
  createAbilityButtons();
  updateStatusDisplay();
  // updateInventoryBar(); // Commented out - using modal inventory system instead
  
  // Also update story layout buttons if they exist
  if (typeof window.syncBuffsToNewLayout === 'function') {
    window.syncBuffsToNewLayout();
  }

  // Level/EXP/Points UI - Story layout only (old elements removed)
  const playerLevelStory = document.getElementById("player-level-story");
  const playerExpStory = document.getElementById("player-exp-story");
  const playerAttributePointsStory = document.getElementById("player-attribute-points-story");
  
  if (playerLevelStory) {
    playerLevelStory.textContent = `Level: ${window.player.level}`;
  }
  if (playerExpStory) {
    playerExpStory.textContent = `EXP: ${window.player.exp} / ${getExpForLevel(window.player.level + 1)}`;
  }
  if (playerAttributePointsStory) {
    playerAttributePointsStory.textContent = `Attribute Points: ${window.player.attributePoints}`;
  }
  
  // Update race and type display - Story layout only (old elements removed)
  const raceElementStory = document.getElementById("character-race-story");
  const elementalAlignmentsStory = document.getElementById("character-elementalAlignment-story");
  if (raceElementStory && window.player.misc?.races) {
    const raceText = formatRaces(window.player);
    raceElementStory.textContent = `Race: ${raceText}`;
  }
  if (elementalAlignmentsStory && window.player.misc?.elementalAlignments) {
    const typeText = formatElementalAlignments(window.player);
    elementalAlignmentsStory.textContent = `Type: ${typeText}`;
  }
}

function updateStoryUI() {
  // updateInventoryBar(); // Commented out - using modal inventory system instead
  updateHistoryPanel();
}

function updateMpBar() {
  const player = window.player;
  if (!player) {
    console.error("Player not available in updateMpBar");
    return;
  }
  const mp = Number(player.secondary.mp) || 0;
  const maxMp = Number(player.maxMp) || Number(player.secondary?.maxMp) || 1;

  // Update story layout mp bar only (old elements removed)
  const mpBarStory = document.getElementById("mp-bar-story");
  const mpValueStory = document.getElementById("mp-value-story");
  const maxMpValueStory = document.getElementById("max-mp-value-story");

  if (mpBarStory) {
    mpBarStory.value = Math.max(0, Math.min(mp, maxMp));
    mpBarStory.max = maxMp;
  }
  if (mpValueStory) {
    mpValueStory.textContent = mp;
  }
  if (maxMpValueStory) {
    maxMpValueStory.textContent = maxMp;
  }
}

function updateLifeBar() {
  const player = window.player;
  if (!player) {
    console.error("Player not available in updateLifeBar");
    return;
  }
  
  const life = Number(player.secondary.life) || 0;
  const maxLife = Number(player.maxLife) || Number(player.secondary?.maxLife) || 1;  // Check direct property first

  // Update story layout life bar only (old elements removed)
  const lifeBarStory = document.getElementById("life-bar-story");
  const lifeValueStory = document.getElementById("life-value-story");
  const maxLifeValueStory = document.getElementById("max-life-value-story");
  
  if (lifeBarStory) {
    lifeBarStory.value = Math.max(0, Math.min(life, maxLife));
    lifeBarStory.max = maxLife;
  }
  if (lifeValueStory) {
    lifeValueStory.textContent = life;
  }
  if (maxLifeValueStory) {
    maxLifeValueStory.textContent = maxLife;
  }
}


function updateInventoryBar() {
  const itemsDiv = document.getElementById("items-bar-container");
  if (itemsDiv) {
    itemsDiv.innerHTML = "";
    const inv = getInventory();
    Object.keys(inv).forEach(itemId => {
      itemId = itemId.toLowerCase();  // standardize casing
      if (!items[itemId]) {
        console.warn(`Missing item definition: ${itemId}`);
        return;
      } else if (items[itemId]) {
        const item = items[itemId];
        const isEquipable = item.type === "equipable" && item.slot;
        let equipped = false;
        if (isEquipable && player.equipment && player.equipment[item.slot] === item) {
          equipped = true;
        }
        const btnLabel = isEquipable
          ? (equipped ? "Unequip" : "Equip")
          : "Use";
        const slotLabel = isEquipable ? ` <span style="color:#888;">[${item.slot}]</span>` : "";
        const itemRow = document.createElement("div");
        itemRow.innerHTML = `<strong>${item.name}</strong> x${inv[itemId]} 
          <button data-item="${itemId}">${btnLabel}</button>
          ${slotLabel}
          <span style="color:#888;">${item.description || ""}</span>`;
        itemsDiv.appendChild(itemRow);
      }
    });
    itemsDiv.querySelectorAll("button[data-item]").forEach(btn => {
      btn.onclick = function () {
        const itemId = btn.getAttribute("data-item");
        const item = items[itemId];
        if (!item || !hasItem(itemId)) return;
        if (item.type === "equipable" && item.slot) {
          const current = player.equipment[item.slot];
          if (current && current !== item) {
            for (const [attr, mod] of Object.entries(current.modifiers)) {
              if (player.primary[attr] !== undefined) {
                player.primary[attr] -= mod;
              }
            }
            current.equipped = false;
            player.equipment[item.slot] = null;
          }
          if (!item.equipped) {
            for (const [attr, mod] of Object.entries(item.modifiers)) {
              if (player.primary[attr] !== undefined) {
                player.primary[attr] += mod;
              }
            }
            item.equipped = true;
            player.equipment[item.slot] = item;
            historyLog.push({ action: `Equipped: ${item.name}` });
            if (typeof updateHistoryPanel === 'function') {
              updateHistoryPanel();
            }
          } else {
            for (const [attr, mod] of Object.entries(item.modifiers)) {
              if (player.primary[attr] !== undefined) {
                player.primary[attr] -= mod;
              }
            }
            item.equipped = false;
            player.equipment[item.slot] = null;
            historyLog.push({ action: `Unequipped: ${item.name}` });
            if (typeof updateHistoryPanel === 'function') {
              updateHistoryPanel();
            }
          }
          updateSecondaryStats(player, true);
          updateCharacterUI();
          updateStoryUI();
        } else {
          const used = item.use(player);
          if (used) {
            removeItem(itemId, 1);
            updateSecondaryStats(player, true);
            updateCharacterUI();
            updateStoryUI();
            historyLog.push({ action: `Used item: ${item.name}` });
            if (typeof updateHistoryPanel === 'function') {
              updateHistoryPanel();
            }
            updateStoryUI();
          }
        }
      };
    });
  }
}

// --- primary stats calculation ---
function updateAttributesBar() {
  const attrDiv = document.getElementById("attributes-bar-container");
  if (!attrDiv) return;
  
  // Use new status system instead of legacy activeBoosts
  import('./status.js').then(({ getActiveStatuses, StatusRegistry }) => {
    const activeStatuses = getActiveStatuses(window.player);
    const buffStatuses = activeStatuses.filter(statusData => {
      const status = StatusRegistry[statusData.statusId];
      return status && (status.increaseAtributes || status.increaseSecondary);
    });
    
    if (buffStatuses.length === 0) {
      attrDiv.style.display = "none";
      attrDiv.innerHTML = "";
    } else {
      attrDiv.style.display = "";
      const buffElements = buffStatuses.map(statusData => {
        const status = StatusRegistry[statusData.statusId];
        const name = status ? status.name : statusData.statusId;
        const turnsText = statusData.turns > 0 ? ` (${statusData.turns})` : "";
        return `<span style="color:blue; font-weight:bold; margin-right:10px;">${name}${turnsText}</span>`;
      });
      attrDiv.innerHTML = buffElements.join("");
    }
  }).catch(() => {
    // Fallback if import fails
    attrDiv.style.display = "none";
    attrDiv.innerHTML = "";
  });
}

function createAbilityButtons() {
  const container = document.getElementById("ability-btns");
  if (!container) return;
  container.innerHTML = "";

  // Get player abilities using the new system
  const playerAbilities = getAbilities(player.abilityIds || []);
  
  for (const [key, ability] of Object.entries(playerAbilities)) {
    if (ability.type !== "buff" && ability.type !== "heal") continue; // Only buffs and heals

    const btn = document.createElement("button");
    btn.textContent = (ability.name || key) + (ability.mpCost ? ` (MP: ${ability.mpCost})` : "");

    // Check if buff is already active - simplified check using statusEffects array
    let buffActive = false;
    if (ability.type === "buff" && ability.statusTag) {
      buffActive = player.statusEffects && player.statusEffects.some(effect => effect.statusTag === ability.statusTag);
    }
    
    btn.disabled = player.secondary.mp < (ability.mpCost || 0) || buffActive;
    if (btn.disabled) {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    } else {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    }

    btn.onclick = function () {
      if (btn.disabled) return;
      
      
      // Deduct MP cost
      player.secondary.mp -= ability.mpCost || 0;
      
      try {
        if (ability.type === "buff" && ability.apply) {
          // Use ability's apply function for buffs
          ability.apply(player, player, (message) => {
          });
        } else if (ability.type === "heal") {
          // Handle heal abilities
          if (player.secondary.life > 0 && player.secondary.life < player.maxLife) {
            player.secondary.life += ability.amount;
            if (player.secondary.life > player.maxLife) player.secondary.life = player.maxLife;
          }
        } else {
          console.warn(`Story UI: Ability ${ability.name} type ${ability.type} not handled`);
        }
        
        // Update UI after ability use
        updateCharacterUI();
        updateStoryUI();
        
        // Update dice choice texts to reflect any attribute changes from buffs
        if (typeof window.updateDiceChoiceTexts === 'function') {
          window.updateDiceChoiceTexts();
        }
        
        // Temporarily disable button and refresh after delay
        btn.disabled = true;
        setTimeout(() => {
          createAbilityButtons(); // Refresh all buttons
        }, 1000);
        
      } catch (error) {
        console.error(`Error using ability ${ability.name}:`, error);
        // Refund MP on error
        player.secondary.mp += ability.mpCost || 0;
        updateCharacterUI();
      }
    };
    
    container.appendChild(btn);
  }
}

// Update status display in story layout
function updateStatusDisplay() {
  const statusElement = document.getElementById("character-status-story");
  
  if (statusElement && window.player) {
    const statusText = statusSummary(window.player);
    statusElement.textContent = statusText;
    
    // Add visual styling based on status
    if (statusText === 'No status effects') {
      statusElement.style.color = '#888';
      statusElement.style.fontStyle = 'italic';
    } else {
      statusElement.style.color = '#b0b0b0';
      statusElement.style.fontStyle = 'normal';
    }
  }
}

export {
  updateCharacterUI,
  updateStoryUI,
  updateMpBar,
  updateLifeBar,
  updateInventoryBar,
  updateAttributesBar,
  createAbilityButtons
};
