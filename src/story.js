import { inventory, addItem, removeItem, hasItem, getInventory, addLoot, addMoney } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateCharacterUI, updateStoryUI, updateInventoryBar } from './ui.js';
import { updateSecondaryStats, regenMp, syncManaProperties } from './character.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { loadItems, items } from './items.js';
import { loadLoot } from './loot.js';
import { loadStatuses, updateStatuses, BuffRegistry } from './status.js';
import { loadAbilities } from './abilities.js';
import { executeDiceRoll, processChoice, handlePlayerDeath } from './utils.js';
import { checkForRandomEncounter, triggerForcedBattle } from './encounters.js';
import { showMerchantInterface } from './merchant.js';
import { loadNpcs, showNpcInterface } from './npcs.js';
import { downloadSave, handleSaveFileUpload, addSaveButton } from './save-load.js';
import { loadRaces, getAllRaces, getAvailableRacesForCharacter, getAvailableTypesForRace, getTypeDescriptions, canRaceUseType } from './race.js';
import { loadTypes } from './types.js';


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

// Make variables available globally for save/load system
window.stories = stories;
window.storyData = storyData;
window.currentNode = currentNode;
window.playerPath = playerPath;
window.selectedStory = selectedStory;
window.selectedCharacterModule = selectedCharacterModule;
window.player = player;
window.applyAttributes = applyAttributes;
window.pendingNodeEffect = pendingNodeEffect;
window.pendingDiceResult = pendingDiceResult;
window.battleJustHappened = battleJustHappened;

// Function to set player for save loading
export function setPlayer(playerObj) {
  player = playerObj;
  window.player = player;
}

// Function to restore all story state for save loading
export function restoreStoryState(saveData, characterModule) {
  // Restore local variables
  currentNode = saveData.progress.currentNode;
  playerPath = [...saveData.progress.playerPath];
  selectedStory = saveData.story;
  selectedCharacterModule = characterModule;
  applyAttributes = characterModule.applyAttributes;
  battleJustHappened = saveData.gameState.battleJustHappened;
  storyData = window.storyData; // Use the already loaded story data

  // Update global references
  window.currentNode = currentNode;
  window.playerPath = playerPath;
  window.selectedStory = selectedStory;
  window.selectedCharacterModule = selectedCharacterModule;
  window.applyAttributes = applyAttributes;
  window.battleJustHappened = battleJustHappened;
  window.storyData = storyData;
  window.visitedNodes = [...(saveData.progress.visitedNodes || [])];
}

// --- Character selection and story loading ---
async function showStorySelection() {
  document.getElementById("inventory-modal").style.display = "none";
  document.querySelector(".story-container").style.display = "none";
  document.getElementById("gameover-container").style.display = "none";
  document.getElementById("character-selection").style.display = "none";
  document.getElementById("game-mode-selection").style.display = "none";
  const list = document.getElementById("story-list");
  list.innerHTML = "";

  // Add cache-busting query param
  stories = await fetch("../story-content/_stories.json?v=" + Date.now()).then(r => r.json());

  stories.forEach(story => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = story.name;
    btn.onclick = () => showGameModeSelection(story);
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
  document.getElementById("inventory-modal").style.display = "none";
  document.getElementById("gameover-container").style.display = "none";
  document.getElementById("attributes-bar-container").style.display = "";

  // Load statuses for this story
  const statusManifest = await fetch('../story-content/story01-battle-st/statuses/_status.json?v=' + Date.now()).then(res => res.json());
  await loadStatuses(statusManifest, '../story-content/story01-battle-st/statuses/');

  // Load abilities for this story
  const abilityManifest = await fetch('../story-content/story01-battle-st/abilities/_abilities.json').then(res => res.json());
  await loadAbilities(abilityManifest, '../story-content/story01-battle-st/abilities/');

  // Load NPCs for this story
  await loadNpcs('story01-battle-st');

  // Load races for this story
  await loadRaces('story01-battle-st');

  // Load types for this story
  await loadTypes('story01-battle-st');


  // Add cache-busting query param
  const response = await fetch(file + "?v=" + Date.now());
  storyData = await response.json();
  if (storyData.start) {
    currentNode = "start";
  } else if (storyData.story) {
    currentNode = "story";
  }

  // Show new story page layout
  const storyPageLayout = document.querySelector(".story-page-layout");
  if (storyPageLayout) {
    storyPageLayout.style.display = "flex";
    // Hide old layout elements
    document.querySelector(".story-container").style.display = "none";
    document.getElementById("status-abilities").style.display = "none";
    document.getElementById("history-toggle-btn").style.display = "none";
  } else {
    // Fallback to old layout (shouldn't happen with new structure)
    const storyContainer = document.querySelector(".story-container");
    storyContainer.style.display = "block";
    document.getElementById("status-abilities").style.display = "block";
    document.getElementById("history-toggle-btn").style.display = "block";
  }

  updateSecondaryStats(player);
  updateCharacterUI();
  updateStoryUI();
  showNode(currentNode);
}

// --- Show game mode selection (New Game vs Load Game) ---
function showGameModeSelection(story) {
  selectedStory = story;
  window.selectedStory = story;

  document.getElementById("story-selection").style.display = "none";
  document.getElementById("character-selection").style.display = "none";
  const gameModeDiv = document.getElementById("game-mode-selection");
  document.getElementById("game-mode-title").textContent = `${story.name} - Choose Game Mode`;

  // Set up event listeners for buttons
  document.getElementById("new-game-btn").onclick = () => showCharacterSelection(story);
  document.getElementById("load-game-btn").onclick = () => {
    document.getElementById("load-file-input").click();
  };
  document.getElementById("back-to-stories-btn").onclick = () => {
    showStorySelection();
  };

  // Set up file input handler
  const fileInput = document.getElementById("load-file-input");
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleSaveFileUpload(file);
      // Reset file input for future use
      fileInput.value = '';
    }
  };

  gameModeDiv.style.display = "";
}

// --- Show character selection for a specific story ---
async function showCharacterSelection(story) {
  selectedStory = story;
  window.selectedStory = story;
  document.getElementById("story-selection").style.display = "none";
  document.getElementById("game-mode-selection").style.display = "none";

  // Load races and types before character selection
  await loadRaces(story.folder.replace('./', ''));
  await loadTypes(story.folder.replace('./', ''));

  // Load abilities for this story
  const abilityManifest = await fetch(`../story-content/${story.folder.replace('./', '')}/abilities/_abilities.json?v=${Date.now()}`).then(res => res.json());
  await loadAbilities(abilityManifest, `../story-content/${story.folder.replace('./', '')}/abilities/`);


  const charDiv = document.getElementById("character-selection");
  charDiv.innerHTML = "<h2>Choose Your Character</h2>";
  const manifestUrl = `../story-content/${story.folder.replace('./', '')}/characters/_characters.json`;
  const characters = await fetch(manifestUrl).then(r => r.json());
  characters.forEach(char => {
    const btn = document.createElement("button");
    btn.textContent = char.name;
    btn.onclick = async () => {
      // Load character but don't start game yet - show customization form
      const charPath = `../story-content/${story.folder.replace('./', '')}/characters/${char.file.replace('./', '')}?v=${Date.now()}`;
      selectedCharacterModule = await import(charPath);
      player = selectedCharacterModule.player;
      window.player = player;
      window.selectedCharacterModule = selectedCharacterModule;
      applyAttributes = selectedCharacterModule.applyAttributes;
      window.applyAttributes = applyAttributes;

      // Show character customization form
      showCharacterCustomization(char, story);
    };
    charDiv.appendChild(btn);
  });
  charDiv.style.display = "";
}

// --- Show character customization form ---
function showCharacterCustomization(baseChar, story) {

  function updateTypeOptions(selectedRace) {
    const typeSelect = document.getElementById("char-type");
    const availableTypes = getAvailableTypesForRace(selectedRace);
    const typeDescriptions = getTypeDescriptions();

    typeSelect.innerHTML = "";
    availableTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = typeDescriptions[type];
      option.selected = player.type === type;
      typeSelect.appendChild(option);
    });

    // If current type is not available for the race, reset to neutral
    if (!canRaceUseType(selectedRace, player.type)) {
      player.type = "neutral";
      typeSelect.value = "neutral";
    }
  }

  function buildRaceOptions() {
    const races = getAvailableRacesForCharacter(player);
    let raceOptionsHtml = '';

    Object.values(races).forEach(race => {
      const selected = player.race === race.id ? 'selected' : '';
      const typeCount = race.availableTypes.length;
      raceOptionsHtml += `<option value="${race.id}" ${selected}>${race.name} - ${race.description} (${typeCount} types)</option>`;
    });

    return raceOptionsHtml;
  }

  const charDiv = document.getElementById("character-selection");
  charDiv.innerHTML = `
    <h2>Customize Your Character</h2>
    <div style="max-width: 500px; margin: 0 auto; text-align: left;">
      <h3>Character: ${baseChar.name}</h3>
      
      <div style="margin-bottom: 15px;">
        <label for="char-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Character Name:</label>
        <input type="text" id="char-name" value="${player.name}" 
               style="width: 100%; padding: 8px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px;" 
               maxlength="20" placeholder="Enter your character name">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label for="char-race" style="display: block; margin-bottom: 5px; font-weight: bold;">Race:</label>
        <select id="char-race" style="width: 100%; padding: 8px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px;">
          ${buildRaceOptions()}
        </select>
        <small style="color: #666; font-style: italic;">Race affects available story choices and elemental affinities</small>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="char-type" style="display: block; margin-bottom: 5px; font-weight: bold;">Combat Type:</label>
        <select id="char-type" style="width: 100%; padding: 8px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px;">
        </select>
        <small style="color: #666; font-style: italic;">Type affects combat damage and resistances (changes based on race)</small>
      </div>
      
      <div style="text-align: center;">
        <button id="confirm-character" style="background: #28a745; color: white; border: none; padding: 12px 24px; 
                font-size: 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
          Start Adventure
        </button>
        <button id="back-to-selection" style="background: #6c757d; color: white; border: none; padding: 12px 24px; 
                font-size: 16px; border-radius: 4px; cursor: pointer;">
          Back to Character Selection
        </button>
      </div>
    </div>
  `;

  // Initialize type options based on current race
  updateTypeOptions(player.race);

  // Add race change event listener
  document.getElementById("char-race").onchange = function () {
    updateTypeOptions(this.value);
  };

  // Add event listeners
  document.getElementById("confirm-character").onclick = () => {
    const newName = document.getElementById("char-name").value.trim();
    const newRace = document.getElementById("char-race").value;
    const newType = document.getElementById("char-type").value;

    if (!newName) {
      alert("Please enter a character name!");
      return;
    }

    // Update player with customizations
    player.name = newName;
    player.race = newRace;
    player.type = newType;

    // Start the game
    startGameWithCustomizedCharacter(story);
  };

  document.getElementById("back-to-selection").onclick = () => {
    showCharacterSelection(story);
  };
}

// --- Start game with customized character ---
async function startGameWithCustomizedCharacter(story) {
  // Initialize new story page layout
  initializeStoryPageLayout();

  const charDiv = document.getElementById("character-selection");
  charDiv.style.display = "none";
  // Update story layout character name
  const characterNameStory = document.getElementById("current-character-name-story");
  if (characterNameStory) {
    characterNameStory.textContent = player.name;
  }

  if (typeof player.reset === "function") player.reset();

  // Sync mana properties after reset
  syncManaProperties(player);

  await loadItems(story.folder.replace('./', ''));
  await loadLoot(story.folder.replace('./', ''));
  updateSecondaryStats(player);
  await loadStory(`../story-content/${story.file.replace('./', '')}`);

  // Add save button to UI
  addSaveButton();

  updateCharacterUI();
  updateStoryUI();
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
export async function showNode(nodeKey) {

  if (!player || !player.id) {
    console.error("Player not loaded or missing id!", player);
    return;
  }

  // Update global currentNode for save system
  currentNode = nodeKey;
  window.currentNode = nodeKey;

  // Legacy handleBoosts removed - buff expiration now handled by turn management system
  regenMp && regenMp();
  updateSecondaryStats(player);
  updateCharacterUI && updateCharacterUI();

  const gameoverContainer = document.getElementById("gameover-container");
  gameoverContainer.style.display = "none";
  playerPath.push(nodeKey);
  window.playerPath = playerPath;

  let node = storyData[nodeKey];

  if (!node && storyData.nextScenes && storyData.nextScenes[nodeKey]) {
    node = storyData.nextScenes[nodeKey];
  }
  if (!node && nodeKey === "story") {
    node = storyData.story;
  }

  if (!node) {
    console.error("Node not found:", nodeKey, "Available keys:", Object.keys(storyData));
    return;
  }

  // --- Grant items when entering a node ---
  if (node.items) {
    for (const [itemId, amount] of Object.entries(node.items)) {
      addItem(itemId, amount);
    }
    updateStoryUI && updateStoryUI();
  }

  document.getElementById("story-title").textContent = node.title || "";
  updateStoryTitle(node.title || "");

  // Show environmental effects based on scenario or node settings
  const getEnvironmentalInfo = () => {
    // Check for node-specific environment first (support multiple formats)
    if (node.environment) {
      return {
        type: node.environment.type || node.environment,
        intensity: node.environment.intensity || 1
      };
    }
    
    // Check for environmentalCheck format (alternative format)
    if (node.environmentalCheck) {
      return {
        type: node.environmentalCheck.type,
        intensity: node.environmentalCheck.intensity || 1
      };
    }
    
    // Check for scenario-level environment (from loaded story data)
    if (storyData.environment) {
      return {
        type: storyData.environment,
        intensity: 1 // Default intensity for scenario
      };
    }
    
    return null;
  };

  const environmentInfo = getEnvironmentalInfo();
  
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

  // Add environmental effects display
  if (environmentInfo) {
    const envType = environmentInfo.type;
    const envIntensity = environmentInfo.intensity;
    
    
    // Load environmental data and display effects
    import('./environmental.js').then(async ({ loadStoryEnvironments }) => {
      try {
        const environments = await loadStoryEnvironments(selectedStory.folder.replace('./', ''));
        const envData = environments[envType];
        // Find the intensity range that contains our intensity value
        let intensityData = null;
        let matchedRange = null;
        
        if (envData && envData.intensityLevels) {
          for (const [range, data] of Object.entries(envData.intensityLevels)) {
            if (range.includes('-')) {
              // Handle range format like "1-3", "4-6", etc.
              const [min, max] = range.split('-').map(Number);
              if (envIntensity >= min && envIntensity <= max) {
                intensityData = data;
                matchedRange = range;
                break;
              }
            } else {
              // Handle exact match format like "1", "2", etc. (backward compatibility)
              if (parseInt(range) === envIntensity) {
                intensityData = data;
                matchedRange = range;
                break;
              }
            }
          }
        }
        
        
        if (intensityData) {
          
          // Create intensity indicator based on danger level
          let intensityColor = "#4a90e2"; // Default blue
          let dangerIcon = "🌍";
          
          if (envIntensity >= 10) {
            intensityColor = "#dc3545"; // Red - extreme danger
            dangerIcon = "⚠️";
          } else if (envIntensity >= 7) {
            intensityColor = "#fd7e14"; // Orange - high danger  
            dangerIcon = "🔥";
          } else if (envIntensity >= 4) {
            intensityColor = "#ffc107"; // Yellow - moderate danger
            dangerIcon = "⚡";
          }
          
          const envMessage = `<div style="color:${intensityColor}; font-style:italic; margin-top:5px; padding:5px; background:rgba(74,144,226,0.1); border-radius:4px;">
            ${dangerIcon} <strong>${envData.name}</strong> (${intensityData.name} - Intensity ${envIntensity})<br>
            <small>${intensityData.effects.message || intensityData.description}</small>
          </div>`;
          
          // Update the effect display with environmental info
          const currentEffectHtml = effectHtml + envMessage;
          updateElementContent("node-effect", currentEffectHtml);
        } else {
          // Still update with base effects if environmental data incomplete
          updateElementContent("node-effect", effectHtml);
        }
      } catch (error) {
        console.error('Failed to load environmental effects:', error);
        // Still update with base effects if environmental loading fails
        updateElementContent("node-effect", effectHtml);
      }
    }).catch(error => {
      console.error('Failed to import environmental.js:', error);
      updateElementContent("node-effect", effectHtml);
    });
  } else {
    // No environmental effects, just update with base effects
    updateElementContent("node-effect", effectHtml);
  }
  pendingNodeEffect = null;
  pendingDiceResult = "";

  const storyText = Array.isArray(node.content) ? node.content.join(" ") : node.text;
  updateElementContent("story-text", storyText);

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

  // Update history panels
  if (typeof updateHistoryPanel === 'function') {
    updateHistoryPanel();
  }

  updateStoryUI && updateStoryUI();
  updateCharacterUI && updateCharacterUI();

  const choicesContainer = document.getElementById("choices-container");
  const choicesContainerMain = document.getElementById("choices-container-main");

  if (choicesContainer) choicesContainer.style.display = ""; // <-- Always reset to visible!
  if (choicesContainerMain) choicesContainerMain.style.display = "";

  // Clear both containers
  if (choicesContainer) choicesContainer.innerHTML = "";
  if (choicesContainerMain) choicesContainerMain.innerHTML = "";

  // Use the main container if available, otherwise use the old one
  const activeChoicesContainer = choicesContainerMain || choicesContainer;

  if (player.life <= 0) {
    if (activeChoicesContainer) activeChoicesContainer.innerHTML = ""; // Hide all choices

    // Show death message and respawn button
    const deathMsg = document.createElement("div");
    deathMsg.innerHTML = `<div style="color:red;font-weight:bold;margin:10px 0;">You died!</div>`;
    if (activeChoicesContainer) activeChoicesContainer.appendChild(deathMsg);

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
    if (activeChoicesContainer) activeChoicesContainer.appendChild(respawnBtn);

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
    .filter(choice => {
      // Check character filter
      if (choice.character && choice.character !== player.id) return false;
      // Check race filter
      if (choice.requiredRace && choice.requiredRace !== player.race) return false;
      return true;
    })
    .forEach(choice => {
      const choiceDiv = document.createElement("div");
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

          // --- Determine next node based on race ---
          let nextNode = choice.next;
          if (choice.raceNext && choice.raceNext[player.race]) {
            nextNode = choice.raceNext[player.race];
          }

          showNode(nextNode);
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

            // Only tick buffs on significant story progression (not every choice)
            // Track story turns to prevent buffs from expiring too quickly
            if (!window.storyTurnCounter) window.storyTurnCounter = 0;
            window.storyTurnCounter++;

            // Tick buffs every 1 choices (representing a "story turn")
            if (window.storyTurnCounter % 1 === 0) {
              updateStatuses(player, (message) => {
              });
            }

            if (nextNode) {
              showNode(nextNode);
            } else {
              showNode(nodeKey);
            }
          });
        } else {
          pendingNodeEffect = processChoice(choice, player, applyAttributes);

          // Only tick buffs on significant story progression (not every choice)
          // Track story turns to prevent buffs from expiring too quickly
          if (!window.storyTurnCounter) window.storyTurnCounter = 0;
          window.storyTurnCounter++;

          // Tick buffs every 1 choices (representing a "story turn")
          if (window.storyTurnCounter % 1 === 0) {
            updateStatuses(player, (message) => {
            });
          }

          // --- If player died from this choice, handle respawn ---
          if (handlePlayerDeath(player, storyData, showNode, updateSecondaryStats)) {
            return;
          }

          // --- Determine next node based on race ---
          let nextNode = choice.next;
          if (choice.raceNext && choice.raceNext[player.race]) {
            nextNode = choice.raceNext[player.race];
          }

          showNode(nextNode);
        }
      };

      choiceDiv.appendChild(btn);
      if (activeChoicesContainer) activeChoicesContainer.appendChild(choiceDiv);
    });

  // --- NPC Interaction buttons ---
  if (node.npc) {
    // Add Shop button for merchant NPCs
    const shopBtnDiv = document.createElement("div");
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

    shopBtnDiv.appendChild(shopBtn);
    if (activeChoicesContainer) activeChoicesContainer.appendChild(shopBtnDiv);
  }
}

// --- Modal open/close handlers ---
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

// --- Show character stats modal function (used by new layout buttons) ---
function showCharacterStatsModal() {
  // Ensure secondary stats are up to date before displaying
  updateSecondaryStats(player);
  const modal = document.getElementById("character-stats-modal");
  const title = document.getElementById("character-stats-title");
  const content = document.getElementById("character-stats-content");

  // Get character name from story layout
  const characterNameStory = document.getElementById("current-character-name-story");
  const characterName = characterNameStory ? characterNameStory.textContent : player.name;
  title.textContent = characterName + " Stats";

  const mainAttributes = ["strength", "dexterity", "constitution", "charisma", "wisdom", "intelligence"];
  const secondaryStats = ["speed", "physicDamage", "magicDamage", "physicDefense", "magicDefense"];

  let html = "";

  // Attributes Accordion
  html += `
    <div class="accordion-header" onclick="toggleAccordion('attributes')">
      <span><strong>Attributes</strong></span>
      <span id="arrow-attributes" class="accordion-arrow">▶</span>
    </div>
    <div id="content-attributes" class="accordion-content">
      <div id="attribute-points-display" style="margin-bottom: 10px;"><b>Attribute Points Left:</b> ${player.attributePoints}</div>
      <ul style='list-style:none;padding-left:0;margin:0;'>`;

  mainAttributes.forEach(attr => {
    html += `<li style="margin-bottom:6px; display: flex; justify-content: space-between; align-items: center;">
      <span>${attr.charAt(0).toUpperCase() + attr.slice(1)}:</span>
      <div>
        <span id="attribute-${attr}" style="margin-right: 10px;">${player.attributes[attr]}</span>
        ${player.attributePoints > 0
        ? `<button style="padding: 2px 8px; font-size: 12px;" onclick="event.stopPropagation(); window.assignAttributeUI && assignAttributeUI('${attr}')">+</button>`
        : ""
      }
      </div>
    </li>`;
  });
  html += "</ul></div>";

  // Secondary Stats Accordion
  html += `
    <div class="accordion-header" onclick="toggleAccordion('secondary')">
      <span><strong>Secondary Stats</strong></span>
      <span id="arrow-secondary" class="accordion-arrow">▶</span>
    </div>
    <div id="content-secondary" class="accordion-content">
      <ul style='list-style:none;padding-left:0;margin:0;'>`;

  secondaryStats.forEach(stat => {
    html += `<li style="margin-bottom:6px; display: flex; justify-content: space-between;">
      <span>${stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
      <span id="secondary-${stat}">${player.secondary[stat]}</span>
    </li>`;
  });
  html += "</ul></div>";

  // Equipment Accordion
  html += `
    <div class="accordion-header" onclick="toggleAccordion('equipment')">
      <span><strong>Equipment</strong></span>
      <span id="arrow-equipment" class="accordion-arrow">▶</span>
    </div>
    <div id="content-equipment" class="accordion-content">
      <ul style='list-style:none;padding-left:0;margin:0;'>`;

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
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <span style="font-weight: 600;">${slotName}:</span>
          <div style="text-align: right;">
            <div style="color:#87CEEB;">${equippedItem.name}</div>
            <div style="color:#a0a0a0; font-size:0.9em;">${modifiersText}</div>
          </div>
        </div>
      </li>`;
    } else {
      html += `<li style="margin-bottom:6px; display: flex; justify-content: space-between;">
        <span style="font-weight: 600;">${slotName}:</span>
        <span style="color:#808080;">None</span>
      </li>`;
    }
  });
  html += "</ul></div>";

  content.innerHTML = html;
  modal.style.display = "block";
}

// Function to update character stats modal content without rebuilding everything
function refreshCharacterStatsModal() {
  if (document.getElementById("character-stats-modal").style.display === "block") {
    const mainAttributes = ["strength", "dexterity", "constitution", "charisma", "wisdom", "intelligence"];
    const secondaryStats = ["speed", "physicDamage", "magicDamage", "physicDefense", "magicDefense"];

    // Update attribute points display
    const pointsElement = document.getElementById("attribute-points-display");
    if (pointsElement) {
      pointsElement.innerHTML = `<b>Attribute Points Left:</b> ${player.attributePoints}`;
    }

    // Update attribute values and button visibility
    mainAttributes.forEach(attr => {
      const element = document.getElementById(`attribute-${attr}`);
      if (element) {
        element.textContent = player.attributes[attr];
      }

      // Update or remove + buttons based on available points
      const buttonElement = element?.parentElement?.querySelector('button');
      if (player.attributePoints > 0) {
        if (!buttonElement) {
          // Add button if it doesn't exist
          const button = document.createElement('button');
          button.style.padding = '2px 8px';
          button.style.fontSize = '12px';
          button.style.marginLeft = '8px';
          button.textContent = '+';
          button.onclick = function (event) {
            event.stopPropagation();
            window.assignAttributeUI && assignAttributeUI(attr);
          };
          element.parentElement.appendChild(button);
        }
      } else {
        // Remove button if no points left
        if (buttonElement) {
          buttonElement.remove();
        }
      }
    });

    // Update secondary stats
    secondaryStats.forEach(stat => {
      const element = document.getElementById(`secondary-${stat}`);
      if (element) {
        element.textContent = player.secondary[stat];
      }
    });
  }
}

// Make it globally available
window.refreshCharacterStatsModal = refreshCharacterStatsModal;

// --- Initialize New Story Page Layout ---
function initializeStoryPageLayout() {
  // Move character info to the new layout
  setupCharacterInfoSection();

  // Setup story log functionality
  setupStoryLogSection();

  // Setup buffs section
  setupBuffsSection();

  // Initialize story content area
  setupStoryContentArea();
}

function setupCharacterInfoSection() {
  const characterStorySection = document.getElementById("current-character-story");
  const characterInfoStatus = document.getElementById("current-character-status");

  if (characterStorySection) {
    // Create the new character info layout
    characterStorySection.innerHTML = `
      <div class="character-basic-info">
        <div style="font-size: 1.3em; font-weight: bold; color: #e0e0e0;">
          <strong>Character:</strong> <span id="current-character-name-story">${player.name || ''}</span>
        </div>
        <div style="display: flex; gap: 15px; color: #a0a0a0; font-size: 0.95em;">
          <span id="character-race-story">${player.race || ''}</span>
          <span id="character-type-story">${player.type || ''}</span>
        </div>
        <div id="player-level-story" style="color: #d0d0d0; font-weight: 600;"></div>
        <div id="player-exp-story" style="color: #b0b0b0; font-size: 0.9em;"></div>
      </div>
      
      <div class="character-stats-area">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="color: #e0e0e0; min-width: 40px;">Life:</label>
            <progress id="life-bar-story" value="100" max="100" style="width:120px;"></progress>
            <span style="color: #e0e0e0; font-size: 0.9em;">
              <span id="life-value-story">0</span>/<span id="max-life-value-story">0</span>
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="color: #e0e0e0; min-width: 40px;">MP:</label>
            <progress id="mana-bar-story" value="0" max="0" style="width:120px;"></progress>
            <span style="color: #e0e0e0; font-size: 0.9em;">
              <span id="mp-value-story">0</span>/<span id="max-mp-value-story">0</span>
            </span>
          </div>
        </div>
        <div id="player-attribute-points-story" style="color: #f0c040; font-weight: bold; font-style: italic;"></div>
      </div>
      
      <div class="character-actions-area">
        <button id="show-character-stats-btn-story" style="padding: 8px 16px; font-size: 14px;">Show Stats</button>
        <button id="show-inventory-btn-story" style="padding: 8px 16px; font-size: 14px;">Inventory</button>
      </div>

    `;

    if (characterInfoStatus) {
      // Create the new character info layout
      characterInfoStatus.innerHTML = `
      <div class="character-status-area">
        <div style="color: #e0e0e0; font-weight: bold; margin-bottom: 5px;">Status:</div>
        <div id="character-status-story" style="color: #b0b0b0; font-size: 0.9em; min-height: 20px; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 4px;">
          No status effects
        </div>
      </div>
    `;
    }

    // Set up event listeners for the new buttons (directly assign handlers)
    document.getElementById("show-character-stats-btn-story").onclick = function () {
      // Show character stats modal (copied from original handler)
      showCharacterStatsModal();
    };

    document.getElementById("show-inventory-btn-story").onclick = function () {
      // Show inventory modal using the rebuild function
      const modal = document.getElementById("inventory-modal");
      rebuildInventoryModal();
      modal.style.display = "flex";
    };

    // Update the character info with current values
    if (typeof updateCharacterUI === 'function') {
      updateCharacterUI();
    }
  }
}

function setupStoryLogSection() {
  const historyBtn = document.getElementById("history-toggle-btn-story");
  const historyPanel = document.getElementById("history-panel-story");

  if (historyBtn && historyPanel) {
    historyBtn.onclick = function () {
      if (historyPanel.style.display === "none" || !historyPanel.style.display) {
        historyPanel.style.display = "block";
        historyBtn.textContent = "Hide Story Log";
        // Update the history panel with current content
        if (typeof updateHistoryPanel === 'function') {
          updateHistoryPanel();
        }
      } else {
        historyPanel.style.display = "none";
        historyBtn.textContent = "Story Log";
      }
    };
  }
}

function setupBuffsSection() {
  const buffsArea = document.getElementById("ability-btns-story");
  
  if (buffsArea) {
    // Set up a function to create working ability buttons for story layout
    window.syncBuffsToNewLayout = function () {
      createStoryAbilityButtons();
    };
    
    // Initial setup
    createStoryAbilityButtons();
  }
}

// Flag to prevent multiple simultaneous button creation calls
let creatingStoryButtons = false;

function createStoryAbilityButtons() {
  const container = document.getElementById("ability-btns-story");
  if (!container || !window.player || creatingStoryButtons) return;
  
  creatingStoryButtons = true;
  
  // Clear existing buttons to prevent duplication
  container.innerHTML = "";
  
  // Import abilities module to get player abilities
  import('./abilities.js').then(({ getAbilities }) => {
    const playerAbilities = getAbilities(window.player.abilityIds || []);
    const player = window.player;
    
    
    for (const [key, ability] of Object.entries(playerAbilities)) {
      if (ability.type !== "buff" && ability.type !== "heal") continue; // Only buffs and heals
      
      const btn = document.createElement("button");
      btn.textContent = (ability.name || key) + (ability.mpCost ? ` (MP: ${ability.mpCost})` : "");
      
      // Check if buff is already active using BuffRegistry
      let buffActive = false;
      if (ability.type === "buff" && ability.statusTag) {
        // Check if this buff is already active in BuffRegistry
        buffActive = BuffRegistry && BuffRegistry.isBuffActive(player, ability.statusTag);
      }
      
      btn.disabled = player.mp < (ability.mpCost || 0) || buffActive;
      if (btn.disabled) {
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      } else {
        btn.style.opacity = "1";
        btn.style.cursor = "";
      }
      
      btn.onclick = function () {
        if (btn.disabled) return;
        
        // Re-check conditions before using ability
        const mpCost = ability.mpCost || 0;
        if (player.mp < mpCost) {
          return;
        }
        
        // Check if buff is already active (for buffs only)
        if (ability.type === "buff" && ability.statusTag) {
          if (BuffRegistry && BuffRegistry.isBuffActive(player, ability.statusTag)) {
            return;
          }
        }
        
        
        // Deduct MP cost only after validation
        player.mp -= mpCost;
        player.mana = player.mp; // Keep in sync
        
        try {
          if (ability.type === "buff" && ability.apply) {
            // Use ability's apply function for buffs
            ability.apply(player, player, (message) => {
            });
          } else if (ability.type === "heal") {
            // Handle heal abilities
            if (player.life > 0 && player.life < player.maxLife) {
              player.life += ability.amount;
              if (player.life > player.maxLife) player.life = player.maxLife;
            }
          } else {
            console.warn(`Story layout: Ability ${ability.name} type ${ability.type} not handled`);
          }
          
          // Update UI after ability use
          if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI();
          }
          if (typeof window.updateStoryUI === 'function') {
            window.updateStoryUI();
          }
          
          // Refresh ability buttons to update their state (mana, buff status)
          setTimeout(() => {
            if (!creatingStoryButtons) {
              createStoryAbilityButtons(); // Refresh all buttons to update states
            }
          }, 100);
          
        } catch (error) {
          console.error(`Error using ability ${ability.name}:`, error);
          // Refund MP on error
          player.mp += mpCost;
          player.mana = player.mp;
          if (typeof window.updateCharacterUI === 'function') {
            window.updateCharacterUI();
          }
        }
      };
      
      container.appendChild(btn);
    }
    
    // Reset the flag when done
    creatingStoryButtons = false;
  }).catch(error => {
    console.error("Failed to create story ability buttons:", error);
    creatingStoryButtons = false; // Reset flag on error too
  });
}

function setupStoryContentArea() {
  // The story content will be updated through the modified showNode function
  // Initialize with empty content
  const titleElement = document.getElementById("story-title-main");
  const textElement = document.getElementById("story-text-main");
  const choicesElement = document.getElementById("choices-container-main");

  if (titleElement) titleElement.textContent = "";
  if (textElement) textElement.innerHTML = "";
  if (choicesElement) choicesElement.innerHTML = "";
}

// Helper function to update content in both old and new layouts
function updateElementContent(elementBaseName, content) {
  // Update old layout
  const oldElement = document.getElementById(elementBaseName);
  if (oldElement) {
    oldElement.innerHTML = content;
  }

  // Update new layout
  const newElement = document.getElementById(elementBaseName + "-main");
  if (newElement) {
    newElement.innerHTML = content;
  }
}

// Helper function to update story title
function updateStoryTitle(title) {
  const oldTitle = document.getElementById("story-title");
  const newTitle = document.getElementById("story-title-main");

  if (oldTitle) oldTitle.textContent = title;
  if (newTitle) newTitle.textContent = title;
}

// Helper function to update choices
function updateChoicesContainer(choicesHtml) {
  const oldChoices = document.getElementById("choices-container");
  const newChoices = document.getElementById("choices-container-main");

  if (oldChoices) oldChoices.innerHTML = choicesHtml;
  if (newChoices) newChoices.innerHTML = choicesHtml;
}

/**
 * Rebuild the inventory modal content
 */
function rebuildInventoryModal() {
  const modal = document.getElementById("inventory-modal");
  const title = modal.querySelector(".modal-header h2");
  const content = modal.querySelector(".modal-content > div:last-child");

  if (!content) {
    return;
  }

  // Capture current accordion states before rebuilding
  const accordionStates = {};
  const categoryOrder = ['loot', 'consumables', 'head', 'body', 'legs', 'foot', 'hand', 'weapon'];
  categoryOrder.forEach(categoryKey => {
    const contentElement = document.getElementById(`content-${categoryKey}`);
    accordionStates[categoryKey] = contentElement && contentElement.classList.contains('active');
  });

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
        loot: [],
        consumables: [],
        head: [],
        body: [],
        legs: [],
        foot: [],
        hand: [],
        weapon: []
      };

      // Process regular items
      itemIds.forEach(itemId => {
        const quantity = inventory[itemId];
        const item = items[itemId];

        if (item) {
          // Handle both old and new item structures
          const isEquipable = (item.type === "equipable" && item.slot) || (item.type === "armor" && item.category);
          const itemSlot = item.slot || item.category;
          
          if (isEquipable) {
            // Keep items in their equipment category regardless of equipped status
            categories[itemSlot].push({ id: itemId, item, quantity, isItem: true });
          } else {
            categories.consumables.push({ id: itemId, item, quantity, isItem: true });
          }
        }
      });

      // Process loot items
      lootIds.forEach(lootId => {
        const quantity = lootInventory[lootId];
        const loot = getLootById(lootId);

        if (loot) {
          categories.loot.push({ id: lootId, item: loot, quantity, isItem: false });
        }
      });

      // Build accordion structure
      const categoryOrder = ['loot', 'consumables', 'head', 'body', 'legs', 'foot', 'hand', 'weapon'];
      const categoryLabels = {
        loot: 'Monster Loot',
        consumables: 'Consumables', 
        head: 'Head Equipment',
        body: 'Body Equipment',
        legs: 'Legs Equipment',
        foot: 'Foot Equipment',
        hand: 'Hand Equipment',
        weapon: 'Weapon Equipment'
      };

      categoryOrder.forEach(categoryKey => {
        const categoryItems = categories[categoryKey];
        const itemCount = categoryItems.length;
        const categoryLabel = categoryLabels[categoryKey];

        html += `
          <div class="accordion-header" onclick="toggleAccordion('${categoryKey}')">
            <span>${categoryLabel} (${itemCount})</span>
            <span class="accordion-arrow" id="arrow-${categoryKey}">▶</span>
          </div>
          <div class="accordion-content" id="content-${categoryKey}">`;

        if (itemCount > 0) {
          categoryItems.forEach(({ id, item, quantity, isItem }) => {
            // Handle both old and new item structures
            const isEquipable = (item.type === "equipable" && item.slot) || (item.type === "armor" && item.category);
            const itemSlot = item.slot || item.category;
            
            // Check if this specific item is currently equipped
            const isEquipped = isEquipable && window.player.equipment && window.player.equipment[itemSlot] && window.player.equipment[itemSlot].id === id;
            
            const btnLabel = isEquipable 
              ? (isEquipped ? "Unequip" : "Equip")
              : (categoryKey === 'loot' ? "Sell" : "Use");
            const equippedLabel = isEquipped ? " <span style=\"color:#28a745; font-weight:bold;\">(Equipped)</span>" : "";

            html += `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong> x${quantity}${equippedLabel}<br>
                  <small style="color: #666;">${item.description || ''}</small>
                </div>
                <button onclick="handleInventoryItemAction('${id}', '${categoryKey}')" 
                        style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                  ${btnLabel}
                </button>
              </div>`;
          });
        } else {
          html += `<div class="item-row"><span style="color: #666;">No items in this category</span></div>`;
        }

        html += `</div>`;
      });

      content.innerHTML = html;
      
      // Restore accordion states after rebuilding
      categoryOrder.forEach(categoryKey => {
        if (accordionStates[categoryKey]) {
          const contentElement = document.getElementById(`content-${categoryKey}`);
          const arrowElement = document.getElementById(`arrow-${categoryKey}`);
          const headerElement = arrowElement ? arrowElement.parentElement : null;
          
          if (contentElement && arrowElement && headerElement) {
            contentElement.classList.add('active');
            arrowElement.classList.add('active');
            headerElement.classList.add('active');
          }
        }
      });
      
    });
  });
}

/**
 * Handle use/equip/unequip actions from the inventory modal
 */
window.handleInventoryItemAction = function (itemId, categoryKey) {
  import('./items.js').then(({ items }) => {
    import('./inventory.js').then(({ removeItem }) => {
      import('./character.js').then(({ updateSecondaryStats }) => {
        const item = items[itemId];
        if (!item) {
          console.error('Item not found:', itemId);
          return;
        }

        // Handle both old and new item structures
        const isEquipable = (item.type === "equipable" && item.slot) || (item.type === "armor" && item.category);
        const itemSlot = item.slot || item.category;
        const itemStats = item.modifiers || item.stats; // Support both old and new stat structure

        if (isEquipable) {
          // Handle equipment
          const currentEquip = window.player.equipment[itemSlot];
          const isCurrentlyEquipped = currentEquip && currentEquip.id === itemId;

          if (isCurrentlyEquipped) {
            // Unequip
            if (itemStats) {
              for (const [attr, mod] of Object.entries(itemStats)) {
                if (window.player.attributes[attr] !== undefined) {
                  window.player.attributes[attr] -= mod;
                }
                if (attr === "physicDefense" || attr === "magicDefense") {
                  window.player.secondary[attr] -= mod;
                }
              }
            }
            window.player.equipment[itemSlot] = null;
            if (item.equipped !== undefined) item.equipped = false;
          } else {
            // Equip new item (unequip current first if any)
            if (currentEquip) {
              const currentStats = currentEquip.modifiers || currentEquip.stats;
              if (currentStats) {
                for (const [attr, mod] of Object.entries(currentStats)) {
                  if (window.player.attributes[attr] !== undefined) {
                    window.player.attributes[attr] -= mod;
                  }
                  if (attr === "physicDefense" || attr === "magicDefense") {
                    window.player.secondary[attr] -= mod;
                  }
                }
              }
            }

            // Equip the new item
            window.player.equipment[itemSlot] = { id: itemId, name: item.name, ...item };
            if (item.equipped !== undefined) item.equipped = true;
            if (itemStats) {
              for (const [attr, mod] of Object.entries(itemStats)) {
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

        // Force refresh character stats modal if it's open
        if (document.getElementById("character-stats-modal").style.display === "block") {
          showCharacterStatsModal();
        }

        // Force rebuild the entire inventory modal content
        const modal = document.getElementById("inventory-modal");
        if (modal.style.display === "block" || modal.style.display === "flex") {
          // Rebuild the inventory modal content
          rebuildInventoryModal();
        }
        
      });
    });
  });
};

/**
 * Toggle accordion sections in modals
 */
window.toggleAccordion = function (categoryKey) {
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
window.updateInventoryModal = function () {
  const modal = document.getElementById("inventory-modal");
  const title = modal.querySelector(".modal-header h2");

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