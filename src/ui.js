import { inventory, addItem, removeItem, hasItem, getInventory } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateSecondaryStats } from './character.js';
import { updateHistoryPanel, historyLog } from './history.js';
import { loadItems, items } from './items.js';
import { getAbilities, getAbility } from './abilities.js';

// --- Grouped UI update functions ---
function updateCharacterUI() {
  updateSecondaryStats(player);
  updateLifeBar();
  updateManaBar();
  updateAttributesBar();
  createAbilityButtons();
  updateInventoryBar();

  // Level/EXP/Points UI
  document.getElementById("player-level").textContent = `Level: ${player.level}`;
  document.getElementById("player-exp").textContent = `EXP: ${player.exp} / ${getExpForLevel(player.level + 1)}`;
  document.getElementById("player-attribute-points").textContent = `Attribute Points: ${player.attributePoints}`;
}

function updateStoryUI() {
  updateInventoryBar();
  updateHistoryPanel();
}

function updateManaBar() {
  const manaBar = document.getElementById("mana-bar");
  const mana = Number(player.mana) || 0;
  const maxMana = Number(player.maxMana) || 1;  // Avoid zero max

  manaBar.value = Math.max(0, Math.min(mana, maxMana));
  manaBar.max = maxMana;

  document.getElementById("mp-value").textContent = mana;
  document.getElementById("max-mp-value").textContent = maxMana;
}

function updateLifeBar() {
  const lifeBar = document.getElementById("life-bar");
  const life = Number(player.life) || 0;
  const maxLife = Number(player.secondary.maxLife) || 1;  // Avoid zero max

  lifeBar.value = Math.max(0, Math.min(life, maxLife));
  lifeBar.max = maxLife;

  document.getElementById("life-value").textContent = life;
  document.getElementById("max-life-value").textContent = maxLife;
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
              if (player.attributes[attr] !== undefined) {
                player.attributes[attr] -= mod;
              }
            }
            current.equipped = false;
            player.equipment[item.slot] = null;
          }
          if (!item.equipped) {
            for (const [attr, mod] of Object.entries(item.modifiers)) {
              if (player.attributes[attr] !== undefined) {
                player.attributes[attr] += mod;
              }
            }
            item.equipped = true;
            player.equipment[item.slot] = item;
            historyLog.push({ action: `Equipped: ${item.name}` });
          } else {
            for (const [attr, mod] of Object.entries(item.modifiers)) {
              if (player.attributes[attr] !== undefined) {
                player.attributes[attr] -= mod;
              }
            }
            item.equipped = false;
            player.equipment[item.slot] = null;
            historyLog.push({ action: `Unequipped: ${item.name}` });
          }
          updateSecondaryStats(player);
          updateCharacterUI();
          updateStoryUI();
        } else {
          const used = item.use(player);
          if (used) {
            removeItem(itemId, 1);
            updateSecondaryStats(player);
            updateCharacterUI();
            updateStoryUI();
            historyLog.push({ action: `Used item: ${item.name}` });
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
  let buffs = [];
  for (const [attr, boost] of Object.entries(player.activeBoosts)) {
    if (boost && boost.turns > 0) {
      buffs.push(`<span style="color:blue; font-weight:bold; margin-right:10px;">
        +${boost.amount} ${attr} (${boost.turns} turn${boost.turns > 1 ? "s" : ""} left)
      </span>`);
    }
  }
  if (buffs.length === 0) {
    attrDiv.style.display = "none";
    attrDiv.innerHTML = "";
  } else {
    attrDiv.style.display = "";
    attrDiv.innerHTML = buffs.join("");
  }
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

    let buffActive = false;
    if (
      ability.type === "buff" &&
      ability.attribute &&
      player.activeBoosts[ability.attribute] &&
      player.activeBoosts[ability.attribute].turns > 0
    ) {
      buffActive = true;
    }
    btn.disabled = player.mana < (ability.mpCost || 0) || buffActive;
    if (btn.disabled) {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    } else {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    }

    btn.onclick = function () {
      if (btn.disabled) return;
      player.mana -= ability.mpCost || 0;
      updateCharacterUI();
      if (ability.type === "buff" && ability.attribute) {
        player.attributes[ability.attribute] += ability.amount;
        player.activeBoosts[ability.attribute] = {
          amount: ability.amount,
          turns: ability.turns
        };
        updateSecondaryStats(player);
        historyLog.push({
          action: `${ability.name} activated! +${ability.amount} ${ability.attribute} for ${ability.turns} turns.`
        });
        updateCharacterUI();
        updateStoryUI();
        btn.disabled = true;
        setTimeout(() => {
          btn.disabled = false;
        }, 1000);
      } else if (ability.type === "heal") {
        if (player.life > 0 && player.life < player.maxLife) {
          player.life += ability.amount;
          if (player.life > player.maxLife) player.life = player.maxLife;
          historyLog.push({ action: `Used ${ability.name}: +${ability.amount} HP` });
          updateCharacterUI();
          updateStoryUI();
        }
      }
      createAbilityButtons();
    };
    container.appendChild(btn);
  }
}

export {
  updateCharacterUI,
  updateStoryUI,
  updateManaBar,
  updateLifeBar,
  updateInventoryBar,
  updateAttributesBar,
  createAbilityButtons
};