import { inventory, addItem, removeItem, hasItem, getInventory, addLoot, addMoney } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateCharacterUI, updateStoryUI, updateInventoryBar } from './ui.js';
import { updateSecondaryStats, handleBoosts, regenMp, syncManaProperties } from './character.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { loadItems, items } from './items.js';
import { loadLoot } from './loot.js';
import { loadStatuses } from './status.js';
import { loadAbilities } from './abilities.js';
import { executeDiceRoll, processChoice, handlePlayerDeath } from './utils.js';
import { checkForRandomEncounter, triggerForcedBattle } from './encounters.js';
import { showMerchantInterface } from './merchant.js';
import { loadNpcs, showNpcInterface } from './npcs.js';


let stories = [];
let storyData = {};
let currentNode = "";
let playerPath = [];

let selectedStory = null;
let selectedCharacterModule = null;
let player = null;

let applyAttributes;

let pendingNodeEffect = null;
let pendingDiceResult = "";

let battleJustHappened = false;

// --- Character selection and story loading ---
async function showStorySelection() {
  document.getElementById("current-character").style.display = "none";
  document.getElementById("inventory-modal").style.display = "none";
  document.querySelector(".story-container").style.display = "none";
  document.getElementById("gameover-container").style.display = "none";
  document.getElementById("character-selection").style.display = "none";
  const list = document.getElementById("story-list");
  list.innerHTML = "";

  // Add cache-busting query param
  stories = await fetch("../story-content/_stories.json?v=" + Date.now()).then(r => r.json());

  stories.forEach(story => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = story.name;
    btn.onclick = () => showCharacterSelection(story);
    li.appendChild(btn);
    list.appendChild(li);
  });
  document.getElementById("story-selection").style.display = "";
}

// --- Load the story data ---
async function loadStory(file) {
  if (!player) {
    console.error("Player not set before loading story!");
    return;
  }
  // Don't reset here - player was already reset during character selection
  // player.reset();
  playerPath = [];
  historyLog.length = 0;
  document.getElementById("current-character").style.display = "";
  document.getElementById("inventory-modal").style.display = "none";
  document.getElementById("gameover-container").style.display = "none";
  document.getElementById("attributes-bar-container").style.display = "";
  
  // Load statuses for this story
  const statusManifest = await fetch('../story-content/story01-battle-st/statuses/_status.json?v=' + Date.now()).then(res => res.json());
  //console.log("Loaded status manifest:", statusManifest);
  await loadStatuses(statusManifest, '../story-content/story01-battle-st/statuses/');
  
  // Load abilities for this story
  const abilityManifest = await fetch('../story-content/story01-battle-st/abilities/_abilities.json').then(res => res.json());
  await loadAbilities(abilityManifest, '../story-content/story01-battle-st/abilities/');
  
  // Load NPCs for this story
  await loadNpcs('story01-battle-st');
  

  // Add cache-busting query param
  //console.log("Loading story from file:", file);
  const response = await fetch(file + "?v=" + Date.now());
  storyData = await response.json();
  //console.log("Story data loaded:", storyData);
  if (storyData.start) {
    currentNode = "start";
  } else if (storyData.story) {
    currentNode = "story";
  }
  //console.log("Setting story-container to display block");
  const storyContainer = document.querySelector(".story-container");
  //console.log("Story container element:", storyContainer);
  storyContainer.style.display = "block";
  //console.log("Story container display style:", storyContainer.style.display);
  updateSecondaryStats(player);
  updateCharacterUI();
  updateStoryUI();
  showNode(currentNode);
}

// --- Show character selection for a specific story ---
async function showCharacterSelection(story) {
  selectedStory = story;
  document.getElementById("story-selection").style.display = "none";
  const charDiv = document.getElementById("character-selection");
  charDiv.innerHTML = "<h2>Choose Your Character</h2>";
  const manifestUrl = `../story-content/${story.folder.replace('./', '')}/characters/_characters.json`;
  const characters = await fetch(manifestUrl).then(r => r.json());
  characters.forEach(char => {
    const btn = document.createElement("button");
    btn.textContent = char.name;
    btn.onclick = async () => {
      document.getElementById("status-abilities").style.display = "block";
      document.getElementById("history-toggle-btn").style.display = "";
      // Add cache-busting query param to force fresh character load
      const charPath = `../story-content/${story.folder.replace('./', '')}/characters/${char.file.replace('./', '')}?v=${Date.now()}`;
      selectedCharacterModule = await import(charPath);
      player = selectedCharacterModule.player;
      window.player = player; // <-- Add this line
      applyAttributes = selectedCharacterModule.applyAttributes; charDiv.style.display = "none";
      document.getElementById("current-character-name").textContent = char.name;
      document.getElementById("current-character").style.display = "";
      if (typeof player.reset === "function") player.reset();
      
      // Sync mana properties after reset
      syncManaProperties(player);
      
      await loadItems(story.folder.replace('./', ''));
      await loadLoot(story.folder.replace('./', ''));
      updateSecondaryStats(player);
      await loadStory(`../story-content/${story.file.replace('./', '')}`);
      updateCharacterUI();
      updateStoryUI();
    };
    charDiv.appendChild(btn);
  });
  charDiv.style.display = "";
}

// --- Load a specific scenario by ID ---
async function loadScenario(storyFolder, scenarioId) {
  const manifestUrl = `../story-content/${storyFolder}/scenarios/_scenarios.json?v=${Date.now()}`;
  const scenarios = await fetch(manifestUrl).then(r => r.json());
  const scenarioInfo = scenarios.find(s => s.id === scenarioId);
  if (!scenarioInfo) throw new Error("Scenario not found: " + scenarioId);
  const scenarioData = await fetch(`../story-content/${storyFolder}/scenarios/${scenarioInfo.file}?v=${Date.now()}`).then(r => r.json());
  // scenarioData.nodes contains all the nodes for this scenario
  return scenarioData;
}

// --- Main story node function ---
async function showNode(nodeKey) {
  //console.log("showNode called with nodeKey:", nodeKey);
  if (!player || !player.id) {
    console.error("Player not loaded or missing id!", player);
    return;
  }
  handleBoosts && handleBoosts();
  regenMp && regenMp();
  updateSecondaryStats(player);
  updateCharacterUI && updateCharacterUI();

  const gameoverContainer = document.getElementById("gameover-container");
  gameoverContainer.style.display = "none";
  playerPath.push(nodeKey);

  let node = storyData[nodeKey];
  if (!node && storyData.nextScenes && storyData.nextScenes[nodeKey]) {
    node = storyData.nextScenes[nodeKey];
  }
  if (!node && nodeKey === "story") {
    node = storyData.story;
  }
  if (!node) return;

  // --- Grant items when entering a node ---
  if (node.items) {
    for (const [itemId, amount] of Object.entries(node.items)) {
      addItem(itemId, amount);
    }
    updateStoryUI && updateStoryUI();
  }

  document.getElementById("story-title").textContent = node.title || "";

  // Show dice roll and effect from previous choice
  let effectHtml = "";
  if (pendingDiceResult) {
    effectHtml += `<div style="color:#333;">${pendingDiceResult}</div>`;
  }
  if (pendingNodeEffect !== null && pendingNodeEffect !== 0) {
    if (pendingNodeEffect < 0) {
      effectHtml += `<div style="color:red;font-weight:bold;">Damage: ${-pendingNodeEffect}</div>`;
    } else {
      effectHtml += `<div style="color:green;font-weight:bold;">Healed: +${pendingNodeEffect}</div>`;
    }
  }
  document.getElementById("node-effect").innerHTML = effectHtml;
  pendingNodeEffect = null;
  pendingDiceResult = "";

  const storyText = Array.isArray(node.content) ? node.content.join(" ") : node.text;
  document.getElementById("story-text").innerHTML = storyText;

  // Handle special merchant node
  if (node.special === "merchant") {
    showMerchantInterface();
  }

  // Add to history (with effect)
  historyLog.push({
    title: node.title || "",
    effect: effectHtml,
    text: storyText
  });
  updateStoryUI && updateStoryUI();
  updateCharacterUI && updateCharacterUI();

  const choicesContainer = document.getElementById("choices-container");
  choicesContainer.style.display = ""; // <-- Always reset to visible!
  choicesContainer.innerHTML = "";

  if (player.life <= 0) {
    choicesContainer.innerHTML = ""; // Hide all choices

    // Show death message and respawn button
    const deathMsg = document.createElement("div");
    deathMsg.innerHTML = `<div style="color:red;font-weight:bold;margin:10px 0;">You died!</div>`;
    choicesContainer.appendChild(deathMsg);

    const respawnBtn = document.createElement("button");
    respawnBtn.textContent = "Respawn";
    respawnBtn.onclick = () => {
      const respawnNodes = storyData.respawn || [];
      let respawnNode = "start";
      if (respawnNodes.length > 0) {
        respawnNode = respawnNodes[Math.floor(Math.random() * respawnNodes.length)];
      }
      player.life = Math.floor(player.maxLife / 2);
      updateSecondaryStats(player);
      showNode(respawnNode);
    };
    choicesContainer.appendChild(respawnBtn);

    return;
  }

  // --- Random encounter check ---
  if (checkForRandomEncounter({
    battleJustHappened,
    node,
    storyData,
    player,
    selectedStory,
    nodeKey,
    onBattleEnd: (targetNode) => {
      battleJustHappened = true; // Keep flag set to prevent immediate re-encounter
      showNode(targetNode);
    }
  })) {
    return; // Don't reset flag here, battle will handle it
  }
  
  // Only reset flag if no battle occurred
  battleJustHappened = false;

  // --- Choices ---
  (node.choices || [])
    .filter(choice => !choice.character || choice.character === player.id)
    .forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice.text + (choice.dice ? " 🎲" : "");
      btn.onclick = async () => {
        battleJustHappened = false; // Reset when player makes a choice
        pendingNodeEffect = null;
        pendingDiceResult = "";

        // --- Forced battle support (works for any choice) ---
        if (choice.battle) {
          await triggerForcedBattle(choice, selectedStory, player, (targetNode) => {
            battleJustHappened = true; // Keep flag set to prevent immediate re-encounter
            showNode(targetNode);
          });
          return;
        }

        // --- Scenario transition support ---
        if (choice.scenario) {
          const scenarioData = await loadScenario(selectedStory.folder.replace('./', ''), choice.scenario);
          storyData = scenarioData.nodes || scenarioData;
          if (scenarioData.respawn) storyData.respawn = scenarioData.respawn;
          showNode(choice.next);
          return;
        }

        // --- EXP from choices ---
        if (choice.exp) {
          const leveledUp = addExp(player, choice.exp);
          updateCharacterUI();
          if (leveledUp) {
            // Show level up message if you want
          }
        }

        if (choice.dice) {
          executeDiceRoll(choice, player, applyAttributes, (nextNode, nodeEffect, diceResult) => {
            if (nodeEffect !== null) pendingNodeEffect = nodeEffect;
            if (diceResult) pendingDiceResult = diceResult;
            
            if (nextNode) {
              showNode(nextNode);
            } else {
              showNode(nodeKey);
            }
          });
        } else {
          pendingNodeEffect = processChoice(choice, player, applyAttributes);

          // --- If player died from this choice, handle respawn ---
          if (handlePlayerDeath(player, storyData, showNode, updateSecondaryStats)) {
            return;
          }

          showNode(choice.next);
        }
      };
      choicesContainer.appendChild(btn);
    });

  // --- NPC Interaction buttons ---
  if (node.npc) {
    // Add Shop button for merchant NPCs
    const shopBtn = document.createElement("button");
    shopBtn.textContent = `Shop at ${node.npc.name || 'NPC'}`;
    shopBtn.style.marginTop = "10px";
    shopBtn.style.backgroundColor = "#17a2b8";
    shopBtn.style.color = "white";
    shopBtn.style.border = "none";
    shopBtn.style.padding = "10px 15px";
    shopBtn.style.borderRadius = "3px";
    shopBtn.onclick = () => {
      showNpcShopInterface(node.npc.id, selectedStory.folder.replace('./', ''), player);
    };
    choicesContainer.appendChild(shopBtn);
  }
}

// --- Modal open/close handlers ---
// Show inventory modal
document.getElementById("show-inventory-btn").onclick = function () {
  const modal = document.getElementById("inventory-modal");
  const title = modal.querySelector("h2");
  const content = modal.querySelector(".modal-content > div");
  
  // Set the correct title
  title.textContent = "Inventory";
  
  // Import necessary functions and build inventory content
  import('./inventory.js').then(({ getInventory, getLootInventory, getMoney }) => {
    import('./loot.js').then(({ getLootById }) => {
      const inventory = getInventory();
      const lootInventory = getLootInventory();
      const itemIds = Object.keys(inventory);
      const lootIds = Object.keys(lootInventory);
      
      let html = `<div style="margin-bottom: 15px; text-align: center; font-weight: bold; color: gold;">
                    Gold: ${getMoney()}
                  </div>`;
      
      // Organize items by category
      const categories = {
        consumables: [],
        head: [],
        body: [],
        legs: [],
        foot: [],
        hand: [],
        weapon: []
      };
      
      itemIds.forEach(itemId => {
        const quantity = inventory[itemId];
        const item = items[itemId];
        
        if (item) {
          if (item.type === "equipable" && item.slot) {
            categories[item.slot].push({ id: itemId, item, quantity });
          } else {
            categories.consumables.push({ id: itemId, item, quantity });
          }
        }
      });
      
      // Helper function to create accordion section
      const createAccordionSection = (title, items, categoryKey) => {
        const hasItems = items.length > 0;
        const itemCount = hasItems ? items.length : 0;
        
        html += `
          <div class="accordion-header" onclick="toggleAccordion('${categoryKey}')">
            <span>${title} ${hasItems ? `(${itemCount})` : '(0)'}</span>
            <span class="accordion-arrow" id="arrow-${categoryKey}">▶</span>
          </div>
          <div class="accordion-content" id="content-${categoryKey}">
        `;
        
        if (hasItems) {
          items.forEach(({ id, item, quantity }) => {
            const isEquipable = item.type === "equipable" && item.slot;
            let equipped = false;
            if (isEquipable && window.player.equipment && window.player.equipment[item.slot] === item) {
              equipped = true;
            }
            const btnLabel = isEquipable
              ? (equipped ? "Unequip" : "Equip")
              : "Use";
            const equippedLabel = equipped ? " <span style=\"color:#28a745; font-weight:bold;\">(Equipped)</span>" : "";
            
            html += `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong> x${quantity}${equippedLabel}<br>
                  <small style="color: #666;">${item.description || ''}</small>
                </div>
                <button onclick="handleInventoryItemAction('${id}')" 
                        style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                  ${btnLabel}
                </button>
              </div>
            `;
          });
        } else {
          html += `<div class="item-row"><span style="color: #666;">No items in this category</span></div>`;
        }
        
        html += "</div>";
      };
      
      // Create accordion sections
      createAccordionSection("Consumables", categories.consumables, "consumables");
      createAccordionSection("Head Equipment", categories.head, "head");
      createAccordionSection("Body Equipment", categories.body, "body");
      createAccordionSection("Legs Equipment", categories.legs, "legs");
      createAccordionSection("Foot Equipment", categories.foot, "foot");
      createAccordionSection("Hand Equipment", categories.hand, "hand");
      createAccordionSection("Weapon Equipment", categories.weapon, "weapon");
      
      // Monster parts section
      const monsterPartsCount = lootIds.length;
      html += `
        <div class="accordion-header" onclick="toggleAccordion('monster-parts')">
          <span>Monster Parts (${monsterPartsCount})</span>
          <span class="accordion-arrow" id="arrow-monster-parts">▶</span>
        </div>
        <div class="accordion-content" id="content-monster-parts">
      `;
      
      if (lootIds.length > 0) {
        lootIds.forEach(lootId => {
          const quantity = lootInventory[lootId];
          const lootItem = getLootById(lootId);
          
          if (lootItem) {
            html += `
              <div class="item-row">
                <div>
                  <strong>${lootItem.name}</strong> x${quantity}<br>
                  <small style="color: #666;">${lootItem.description}</small><br>
                  <small style="color: #999;">Value: ${lootItem.value} gold each</small>
                </div>
              </div>
            `;
          }
        });
      } else {
        html += `<div class="item-row"><span style="color: #666;">No monster parts collected</span></div>`;
      }
      
      html += "</div>";
      
      content.innerHTML = html;
      modal.style.display = "block";
    });
  });
};
document.getElementById("close-inventory-modal").onclick = function () {
  document.getElementById("inventory-modal").style.display = "none";
};
document.getElementById("close-character-stats-modal").onclick = function () {
  document.getElementById("character-stats-modal").style.display = "none";
};
window.onclick = function (event) {
  const inventoryModal = document.getElementById("inventory-modal");
  const statsModal = document.getElementById("character-stats-modal");
  if (event.target === inventoryModal) inventoryModal.style.display = "none";
  if (event.target === statsModal) statsModal.style.display = "none";
};

// Toggle history panel visibility
document.getElementById("history-toggle-btn").onclick = function () {
  const panel = document.getElementById("history-panel");
  if (panel.style.display === "none") {
    panel.style.display = "block";
    this.textContent = "Hide History";
  } else {
    panel.style.display = "none";
    this.textContent = "Show History";
  }
};

// --- Character stats modal with attribute assignment ---
document.getElementById("show-character-stats-btn").onclick = function () {
  // Ensure secondary stats are up to date before displaying
  updateSecondaryStats(player);
  // print secondary stats in console
  //console.log("Secondary Stats:", player.secondary);
  const modal = document.getElementById("character-stats-modal");
  const title = document.getElementById("character-stats-title");
  const content = document.getElementById("character-stats-content");
  title.textContent = document.getElementById("current-character-name").textContent + " Stats";

  const mainAttributes = ["strength", "dexterity", "constitution", "charisma", "wisdom", "intelligence"];
  const secondaryStats = ["speed", "physicDamage", "magicDamage", "physicDefense", "magicDefense"];

  let html = "<strong>Attributes:</strong><br>";
  html += `<div id="attribute-points-remaining"><b>Attribute Points Left:</b> ${player.attributePoints}</div>`;
  html += "<ul style='list-style:none;padding-left:0;'>";
  mainAttributes.forEach(attr => {
    html += `<li style="margin-bottom:6px;">
      <span style="display:inline-block;width:110px;">${attr.charAt(0).toUpperCase() + attr.slice(1)}:</span>
      <span id="attr-${attr}">${player.attributes[attr]}</span>
      ${player.attributePoints > 0
        ? `<button style="margin-left:10px;" onclick="window.assignAttributeUI && assignAttributeUI('${attr}')">+</button>`
        : ""
      }
    </li>`;
  });
  html += "</ul>";

  html += "<strong>Secondary Stats:</strong><br><ul style='list-style:none;padding-left:0;'>";
  secondaryStats.forEach(stat => {
    html += `<li style="margin-bottom:6px;">
    <span style="">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
    <span id="secondary-${stat}">${player.secondary[stat]}</span>
  </li>`;
  });
  html += "</ul>";

  // Add equipment section
  html += "<strong>Equipment:</strong><br><ul style='list-style:none;padding-left:0;'>";
  const equipmentSlots = ["head", "body", "legs", "foot", "hand", "weapon"];
  equipmentSlots.forEach(slot => {
    const equippedItem = player.equipment[slot];
    const slotName = slot.charAt(0).toUpperCase() + slot.slice(1);
    if (equippedItem) {
      let modifiersText = "";
      if (equippedItem.modifiers) {
        const modifiersList = Object.entries(equippedItem.modifiers)
          .map(([attr, value]) => `${value > 0 ? '+' : ''}${value} ${attr}`)
          .join(', ');
        modifiersText = ` (${modifiersList})`;
      }
      html += `<li style="margin-bottom:6px;">
        <span style="display:inline-block;width:80px;">${slotName}:</span>
        <span style="color:#0066cc;">${equippedItem.name}</span>
        <span style="color:#666; font-size:0.9em;">${modifiersText}</span>
      </li>`;
    } else {
      html += `<li style="margin-bottom:6px;">
        <span style="display:inline-block;width:80px;">${slotName}:</span>
        <span style="color:#999;">None</span>
      </li>`;
    }
  });
  html += "</ul>";

  content.innerHTML = html;
  modal.style.display = "block";
}

/**
 * Handle use/equip/unequip actions from the inventory modal
 */
window.handleInventoryItemAction = function(itemId) {
  import('./items.js').then(({ items }) => {
    import('./inventory.js').then(({ removeItem }) => {
      import('./character.js').then(({ updateSecondaryStats }) => {
        const item = items[itemId];
        if (!item) return;
        
        if (item.type === "equipable" && item.slot) {
          // Handle equipment
          const currentEquip = window.player.equipment[item.slot];
          const isCurrentlyEquipped = currentEquip && currentEquip.id === itemId;
          
          if (isCurrentlyEquipped) {
            // Unequip
            if (currentEquip.modifiers) {
              for (const [attr, mod] of Object.entries(currentEquip.modifiers)) {
                if (window.player.attributes[attr] !== undefined) {
                  window.player.attributes[attr] -= mod;
                }
                if (attr === "physicDefense" || attr === "magicDefense") {
                  window.player.secondary[attr] -= mod;
                }
              }
            }
            window.player.equipment[item.slot] = null;
            currentEquip.equipped = false;
          } else {
            // Equip new item (unequip current first if any)
            if (currentEquip && currentEquip.modifiers) {
              for (const [attr, mod] of Object.entries(currentEquip.modifiers)) {
                if (window.player.attributes[attr] !== undefined) {
                  window.player.attributes[attr] -= mod;
                }
                if (attr === "physicDefense" || attr === "magicDefense") {
                  window.player.secondary[attr] -= mod;
                }
              }
            }
            
            // Equip the new item
            window.player.equipment[item.slot] = item;
            item.equipped = true;
            if (item.modifiers) {
              for (const [attr, mod] of Object.entries(item.modifiers)) {
                if (window.player.attributes[attr] !== undefined) {
                  window.player.attributes[attr] += mod;
                }
                if (attr === "physicDefense" || attr === "magicDefense") {
                  window.player.secondary[attr] += mod;
                }
              }
            }
          }
        } else {
          // Handle consumable use
          let consumed = false;
          
          // Try to use the item's use() function first
          if (typeof item.use === 'function') {
            consumed = item.use(window.player);
          } else if (item.effect) {
            // Fallback to effect-based system
            if (item.effect.heal) {
              window.player.life = Math.min(window.player.life + item.effect.heal, window.player.maxLife);
            }
            if (item.effect.mana) {
              window.player.mp = Math.min(window.player.mp + item.effect.mana, window.player.maxMp);
              window.player.mana = window.player.mp; // Keep in sync
            }
            consumed = true;
          }
          
          // Remove one instance of the item only if it was consumed
          if (consumed) {
            removeItem(itemId, 1);
          }
        }
        
        // Update UI
        updateSecondaryStats(window.player);
        updateCharacterUI();
        
        // Update the inventory modal content without closing it
        updateInventoryModal();
      });
    });
  });
};

/**
 * Toggle accordion sections in modals
 */
window.toggleAccordion = function(categoryKey) {
  const content = document.getElementById('content-' + categoryKey);
  const arrow = document.getElementById('arrow-' + categoryKey);
  const header = arrow.parentElement;
  
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    arrow.classList.remove('active');
    header.classList.remove('active');
  } else {
    content.classList.add('active');
    arrow.classList.add('active');
    header.classList.add('active');
  }
};

/**
 * Update inventory modal content without closing/reopening
 */
window.updateInventoryModal = function() {
  const modal = document.getElementById("inventory-modal");
  const title = modal.querySelector("h2");
  
  // Only update if the modal is open and showing inventory (not selling)
  if (modal.style.display === "block" && title.textContent === "Inventory") {
    // Update gold amount
    import('./inventory.js').then(({ getInventory, getLootInventory, getMoney }) => {
      import('./loot.js').then(({ getLootById }) => {
        // Update gold display
        const goldDiv = modal.querySelector('div[style*="color: gold"]');
        if (goldDiv) {
          goldDiv.innerHTML = `Gold: ${getMoney()}`;
        }
        
        // Update each accordion section's content
        const inventory = getInventory();
        const lootInventory = getLootInventory();
        const itemIds = Object.keys(inventory);
        const lootIds = Object.keys(lootInventory);
        
        // Organize items by category
        const categories = {
          consumables: [],
          head: [],
          body: [],
          legs: [],
          foot: [],
          hand: [],
          weapon: []
        };
        
        itemIds.forEach(itemId => {
          const quantity = inventory[itemId];
          const item = items[itemId];
          
          if (item) {
            if (item.type === "equipable" && item.slot) {
              categories[item.slot].push({ id: itemId, item, quantity });
            } else {
              categories.consumables.push({ id: itemId, item, quantity });
            }
          }
        });
        
        // Update each category
        const updateCategoryContent = (categoryKey, items) => {
          const contentDiv = document.getElementById(`content-${categoryKey}`);
          const arrowElement = document.querySelector(`#arrow-${categoryKey}`);
          
          if (contentDiv && arrowElement && arrowElement.parentElement) {
            const headerSpan = arrowElement.parentElement.querySelector('span');
            
            if (headerSpan) {
              // Update header count
              const itemCount = items.length;
              const categoryName = headerSpan.textContent.split('(')[0].trim();
              headerSpan.textContent = `${categoryName} (${itemCount})`;
            }
            
            // Update content
            let html = '';
            if (items.length > 0) {
              items.forEach(({ id, item, quantity }) => {
                const isEquipable = item.type === "equipable" && item.slot;
                let equipped = false;
                if (isEquipable && window.player.equipment && window.player.equipment[item.slot] === item) {
                  equipped = true;
                }
                const btnLabel = isEquipable
                  ? (equipped ? "Unequip" : "Equip")
                  : "Use";
                const equippedLabel = equipped ? " <span style=\"color:#28a745; font-weight:bold;\">(Equipped)</span>" : "";
                
                html += `
                  <div class="item-row">
                    <div>
                      <strong>${item.name}</strong> x${quantity}${equippedLabel}<br>
                      <small style="color: #666;">${item.description || ''}</small>
                    </div>
                    <button onclick="handleInventoryItemAction('${id}')" 
                            style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                      ${btnLabel}
                    </button>
                  </div>
                `;
              });
            } else {
              html = `<div class="item-row"><span style="color: #666;">No items in this category</span></div>`;
            }
            contentDiv.innerHTML = html;
          }
        };
        
        // Update all categories
        updateCategoryContent('consumables', categories.consumables);
        updateCategoryContent('head', categories.head);
        updateCategoryContent('body', categories.body);
        updateCategoryContent('legs', categories.legs);
        updateCategoryContent('foot', categories.foot);
        updateCategoryContent('hand', categories.hand);
        updateCategoryContent('weapon', categories.weapon);
        
        // Update monster parts
        const monsterPartsContent = document.getElementById('content-monster-parts');
        const monsterPartsArrow = document.querySelector('#arrow-monster-parts');
        
        if (monsterPartsContent && monsterPartsArrow && monsterPartsArrow.parentElement) {
          const monsterPartsHeader = monsterPartsArrow.parentElement.querySelector('span');
          
          if (monsterPartsHeader) {
            monsterPartsHeader.textContent = `Monster Parts (${lootIds.length})`;
          }
          
          let html = '';
          if (lootIds.length > 0) {
            lootIds.forEach(lootId => {
              const quantity = lootInventory[lootId];
              const lootItem = getLootById(lootId);
              
              if (lootItem) {
                html += `
                  <div class="item-row">
                    <div>
                      <strong>${lootItem.name}</strong> x${quantity}<br>
                      <small style="color: #666;">${lootItem.description}</small><br>
                      <small style="color: #999;">Value: ${lootItem.value} gold each</small>
                    </div>
                  </div>
                `;
              }
            });
          } else {
            html = `<div class="item-row"><span style="color: #666;">No monster parts collected</span></div>`;
          }
          monsterPartsContent.innerHTML = html;
        }
      });
    });
  }
};


window.onload = showStorySelection;
window.updateCharacterUI = updateCharacterUI;