import { inventory, addItem, removeItem, hasItem, getInventory, addLoot, addMoney } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateCharacterUI, updateStoryUI, updateInventoryBar } from './ui.js';
import { updateSecondaryStats, regenMp, regenLife } from './characters.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { loadItems, items } from './items.js';
import { loadLoot } from './loot.js';
import { loadStatuses, updateStatuses, StatusRegistry } from './status.js';
import { loadAbilities } from './abilities.js';
import { getPrimaryRace, getWeight, getHeight } from './element-helpers.js';
import { executeDiceRoll, processChoice, handlePlayerDeath } from './utils.js';
import { checkForRandomEncounter, triggerForcedBattle } from './encounters.js';
import { showMerchantInterface } from './merchant.js';
import { loadNpcs, showNpcInterface } from './npcs.js';
import { downloadSave, handleSaveFileUpload, addSaveButton } from './save-load.js';
import { loadRaces, getAllRaces, getAvailableRacesForCharacter, getAvailableTypesForRace, getTypeDescriptions, canRaceUseType } from './race.js';
import { loadElements } from './elements.js';
import { loadEnvironments } from './environments.js';
import { showCharacterSelection, setCharacterCreatedCallback } from './character-creator.js';
import {
  isChoiceVisible,
  getChoiceRejectionMessage,
  processRandomEncounterNodes,
  startQuest,
  completeQuest
} from './conditional-system.js';
import { initializeModalEvents } from './modal-system.js'; // --- IGNORE ---
import { getEquipmentCategories, findAvailableSlot, isSlotOccupied, getEquippedItem, findEquippedItemSlot, getEquippedItemsByType } from './equipment-utils.js';
import { applyAllEquipmentBonuses } from './items.js';
import { 
  initializeDayNight, 
  advanceTimeForChoice, 
  advanceTimeForBattleRound,
  isChoiceAvailableAtCurrentTime,
  saveDayNightState,
  loadDayNightState,
  reinitializeDayNight
} from './day-night.js';


let stories = [];
let storyData = {};
let currentNode = "";
let playerPath = [];

let selectedStory = null;
let selectedCharacterModule = null;
// Removed global player variable - using window.player instead

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
// window.player is set elsewhere when needed
window.applyAttributes = applyAttributes;
window.pendingNodeEffect = pendingNodeEffect;
window.pendingDiceResult = pendingDiceResult;
window.battleJustHappened = battleJustHappened;

// Function to set player for save loading
export function setPlayer(playerObj) {
  window.player = playerObj;
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
  
  // Restore day-night state
  if (saveData.gameState.dayNight) {
    loadDayNightState(saveData.gameState.dayNight);
  }
}

// --- Character selection and story loading ---
async function showStorySelection() {
  hideAllContainers();
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
  if (!window.player) {
    console.error("Player not set before loading story!");
    return;
  }

  const storyFolder = window.selectedStory?.folder?.replace('./', '');

  // Don't reset here - player was already reset during character selection
  // window.player.reset();
  playerPath = [];
  historyLog.length = 0;
  hideAllContainers();
  document.getElementById("attributes-bar-container").style.display = "";

  // Load statuses for this story
  const statusManifest = await fetch(`../story-content/${storyFolder}/statuses.json?v=` + Date.now()).then(res => res.json());
  await loadStatuses(statusManifest, `../story-content/${storyFolder}/statuses/`);

  // Load abilities for this story
  const abilityManifest = await fetch(`../story-content/${storyFolder}/abilities.json?v=${Date.now()}`).then(res => res.json());
  await loadAbilities(abilityManifest, `../story-content/${storyFolder}/abilities/`);

  // Load NPCs for this story
  await loadNpcs(`${storyFolder}`);

  // Load races for this story
  await loadRaces(`${storyFolder}`);

  // Load types for this story
  await loadElements(`${storyFolder}`);

  // Load environments for this story
  await loadEnvironments(`${storyFolder}`);

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

  updateSecondaryStats(window.player, true);
  updateCharacterUI();
  updateStoryUI();
  showNode(currentNode);
}

// --- Show game mode selection (New Game vs Load Game) ---
function showGameModeSelection(story) {
  selectedStory = story;
  window.selectedStory = story;

  showContainer("game-mode-selection");
  document.getElementById("game-mode-title").textContent = `${story.name} - Choose Game Mode`;

  // Set up event listeners for buttons
  document.getElementById("new-game-btn").onclick = () => {
    // Set up character creation callback before showing character selection
    setCharacterCreatedCallback((player, story) => {
      startGameWithCustomizedCharacter(player, story);
    });
    showContainer("character-selection");
    showCharacterSelection(story);
  };
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
}

// --- Start game with customized character ---
async function startGameWithCustomizedCharacter(player, story) {
  // Set global references
  selectedStory = story;
  window.selectedStory = story;
  window.player = player;

  window.selectedCharacterModule = window.selectedCharacterModule;
  window.applyAttributes = window.applyAttributes;
  // Initialize new story page layout
  initializeStoryPageLayout();

  const charDiv = document.getElementById("character-selection");
  charDiv.style.display = "none";
  // Update story layout character name
  const characterNameStory = document.getElementById("current-character-name-story");
  if (characterNameStory) {
    characterNameStory.textContent = window.player.name;
  }

  if (typeof window.player.reset === "function") window.player.reset();

  await loadItems(story.folder.replace('./', ''));
  await loadLoot(story.folder.replace('./', ''));

  // Add some test items to inventory for debugging
  import('./inventory.js').then(({ addItem, addMoney }) => {
    addItem('potion', 3);
    addItem('metal-helmet', 1);
    addItem('leather-helmet', 1);
    addMoney(50);
  }).catch(err => console.error('Failed to add test items:', err));

  updateSecondaryStats(window.player, true);
  await loadStory(`../story-content/${story.file.replace('./', '')}`);

  // Refresh ability buttons now that abilities are loaded
  if (window.createStoryAbilityButtons) {
    window.createStoryAbilityButtons();
  }

  // Add save button to UI
  addSaveButton();

  updateCharacterUI();
  updateStoryUI();
}

// --- Load a specific scenario by ID ---
async function loadScenario(storyFolder, scenarioId) {
  const manifestUrl = `../story-content/${storyFolder}/scenarios.json?v=${Date.now()}`;
  const scenarios = await fetch(manifestUrl).then(r => r.json());
  const scenarioInfo = scenarios.find(s => s.id === scenarioId);
  if (!scenarioInfo) throw new Error("Scenario not found: " + scenarioId);
  const scenarioData = await fetch(`../story-content/${storyFolder}/scenarios/${scenarioInfo.file}?v=${Date.now()}`).then(r => r.json());
  // scenarioData.nodes contains all the nodes for this scenario
  return scenarioData;
}

// --- Main story node function ---
export async function showNode(nodeKey) {

  if (!window.player || !window.player.id) {
    console.error("Player not loaded or missing id!", window.player);
    return;
  }

  // Create local reference to window.player for convenience
  const player = window.player;

  // Update global currentNode for save system
  currentNode = nodeKey;
  window.currentNode = nodeKey;

  // Legacy handleBoosts removed - buff expiration now handled by turn management system
  regenMp && regenMp();
  regenLife && regenLife();
  updateSecondaryStats(player, true);
  updateCharacterUI && updateCharacterUI();

  const gameoverContainer = document.getElementById("gameover-container");
  gameoverContainer.style.display = "none";
  playerPath.push(nodeKey);
  window.playerPath = playerPath;

  let node = storyData[nodeKey];

  // Check in nodes object if not found directly
  if (!node && storyData.nodes) {
    node = storyData.nodes[nodeKey];
  }

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

  // Show dice roll result from previous choice
  let diceResultHtml = "";
  if (pendingDiceResult) {
    diceResultHtml = pendingDiceResult;
  }

  // Show effects from previous choice (damage/healing)
  let effectHtml = "";
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
    import('./environments.js').then(async ({ getEnvironmentById, getAllEnvironments }) => {
      try {
        const environments = getAllEnvironments();
        const envData = environments[envType];
        
        if (envData) {
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
            ${dangerIcon} <strong>${envData.name}</strong> (Intensity ${envIntensity})<br>
            <small>${envData.description}</small>
          </div>`;

          // Update the effect display with environmental info
          const currentEffectHtml = effectHtml + envMessage;
          updateElementContent("node-effect", currentEffectHtml);
          updateElementContent("dice-result", diceResultHtml);
        } else {
          // Still update with base effects if environmental data incomplete
          updateElementContent("node-effect", effectHtml);
          updateElementContent("dice-result", diceResultHtml);
        }
      } catch (error) {
        console.error('Failed to load environmental effects:', error);
        // Still update with base effects if environmental loading fails
        updateElementContent("node-effect", effectHtml);
        updateElementContent("dice-result", diceResultHtml);
      }
    }).catch(error => {
      console.error('Failed to import environments.js:', error);
      updateElementContent("node-effect", effectHtml);
      updateElementContent("dice-result", diceResultHtml);
    });
  } else {
    // No environmental effects, just update with base effects
    updateElementContent("node-effect", effectHtml);
  }

  // Update dice result display
  updateElementContent("dice-result", diceResultHtml);

  // Display node image if available
  displayNodeImage(node);

  pendingNodeEffect = null;
  pendingDiceResult = "";

  const storyText = Array.isArray(node.content) ? node.content.join(" ") : node.text;
  updateElementContent("story-text", storyText);

  // Handle special merchant node
  if (node.special === "merchant") {
    showMerchantInterface();
  }

  // Add to history (with effect and image)
  historyLog.push({
    title: node.title || "",
    effect: effectHtml,
    text: storyText,
    img: node.img || null
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

  if (window.player.secondary.life <= 0) {
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
      window.player.secondary.life = Math.floor(window.player.maxLife / 2);
      updateSecondaryStats(window.player, true);
      showNode(respawnNode);
    };
    if (activeChoicesContainer) activeChoicesContainer.appendChild(respawnBtn);

    return;
  }

  // --- Process random encounter nodes ---
  // Skip random encounters if disabled in this scenario
  let encounterNode = null;
  let randomEncounterTriggered = false;

  // Check both the old noBattle flag and new randomEncounters flag
  const randomEncountersDisabled = storyData.noBattle || storyData.randomEncounters === false;

  if (!randomEncountersDisabled) {
    encounterNode = processRandomEncounterNodes(node, player);
    if (encounterNode) {
      randomEncounterTriggered = true;
    }
  }

  if (encounterNode) {
    // Temporarily replace the current node with the encounter
    const originalNode = node;
    node = encounterNode;

    // Add a choice to continue to the original destination after encounter
    if (!node.choices) node.choices = [];
    node.choices.push({
      text: "Continue on your way...",
      next: nodeKey, // Return to original node
      continueFromEncounter: true
    });

    // Add encounter message to history
    historyLog.push({
      title: "⚡ Random Encounter!",
      effect: "",
      text: "Something unexpected happens..."
    });

    // Set flag to prevent immediate battle encounters
    battleJustHappened = true;
  }

  // --- Random encounter check (traditional battle encounters) ---
  // Skip if a random encounter node already triggered or if random encounters are disabled
  if (!randomEncounterTriggered && !randomEncountersDisabled && checkForRandomEncounter({
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

  // Only reset battleJustHappened flag after all encounter checks are complete
  battleJustHappened = false;

  // --- Choices ---
  (node.choices || [])
    .filter(choice => isChoiceVisible(choice, player) && isChoiceAvailableAtCurrentTime(choice))
    .forEach(choice => {
      const choiceDiv = document.createElement("div");
      const btn = document.createElement("button");

      // Create choice text with dice roll info if applicable
      let choiceText = choice.text;
      if (choice.dice && choice.dice.attribute) {
        const attributeName = choice.dice.attribute;
        const attributeValue = window.player.primary[attributeName] || 0;
        const attributeDisplayName = attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
        choiceText += ` 🎲 (${attributeDisplayName}: ${attributeValue})`;
      } else if (choice.dice) {
        choiceText += " 🎲";
      }

      btn.textContent = choiceText;

      // Add data attributes to track dice choices for later updates
      if (choice.dice && choice.dice.attribute) {
        btn.setAttribute('data-dice-choice', 'true');
        btn.setAttribute('data-dice-attribute', choice.dice.attribute);
        btn.setAttribute('data-choice-base-text', choice.text);
      }

      // Check for rejection conditions (choices that would be denied)
      const rejectionMessage = getChoiceRejectionMessage(choice, player);
      if (rejectionMessage) {
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
        btn.onclick = () => {
          // Show rejection message
          const rejectionDiv = document.createElement("div");
          rejectionDiv.style.cssText = "color: red; font-style: italic; margin: 10px 0; padding: 10px; background: rgba(255,0,0,0.1); border-radius: 4px;";
          rejectionDiv.textContent = rejectionMessage;

          // Insert after the choice button temporarily
          choiceDiv.appendChild(rejectionDiv);
          setTimeout(() => {
            if (rejectionDiv.parentNode) {
              rejectionDiv.parentNode.removeChild(rejectionDiv);
            }
          }, 3000);
        };
      } else {
        btn.onclick = async () => {
          battleJustHappened = false; // Reset when player makes a choice
          pendingNodeEffect = null;
          pendingDiceResult = "";

          // --- Handle quest progression ---
          if (choice.questStart) {
            startQuest(player, choice.questStart);
            historyLog.push({ action: `Started quest: ${choice.questStart}` });
          }

          if (choice.questComplete) {
            completeQuest(player, choice.questComplete);
            historyLog.push({ action: `Completed quest: ${choice.questComplete}` });
          }

          // --- Forced battle support (works for any choice) ---
          if (choice.battle) {
            // Check if battles are disabled in this scenario (backward compatibility)
            if (storyData.noBattle) {
              console.warn(`Battle attempted in no-battle scenario: ${choice.battle}`);
              // Skip the battle and go directly to the next node
              if (choice.next) {
                showNode(choice.next);
              }
              return;
            }

            await triggerForcedBattle(choice, selectedStory, player, (targetNode) => {
              battleJustHappened = true; // Keep flag set to prevent immediate re-encounter
              showNode(targetNode);
            });
            return;
          }

          // --- Multi-enemy battle support ---
          if (choice.enemies && Array.isArray(choice.enemies)) {
            // Check if battles are disabled in this scenario (backward compatibility)
            if (storyData.noBattle) {
              console.warn(`Multi-enemy battle attempted in no-battle scenario: ${choice.enemies.join(', ')}`);
              // Skip the battle and go directly to the next node
              if (choice.next) {
                showNode(choice.next);
              }
              return;
            }

            await triggerForcedBattle(choice, selectedStory, player, (targetNode) => {
              battleJustHappened = true; // Keep flag set to prevent immediate re-encounter
              showNode(targetNode);
            });
            return;
          }

          // --- Scenario transition support ---
          if (choice.scenario) {
            console.log(`🌲 Transitioning to scenario: ${choice.scenario}`);
            const scenarioData = await loadScenario(selectedStory.folder.replace('./', ''), choice.scenario);

            // Preserve scenario metadata (noBattle, id, title, etc.) while setting nodes
            storyData = {
              ...scenarioData, // Include all scenario metadata (noBattle, id, title, etc.)
              nodes: scenarioData.nodes || scenarioData // Set the nodes
            };

            // Legacy: ensure respawn is preserved (though it should already be in scenarioData)
            if (scenarioData.respawn && !storyData.respawn) {
              storyData.respawn = scenarioData.respawn;
            }

            console.log(`🌲 Scenario loaded. Respawn points:`, storyData.respawn);

            // Reinitialize day-night system for new scenario
            console.log(`🕒 Reinitializing day-night system for scenario transition`);
            setTimeout(() => {
              reinitializeDayNight();
            }, 200);

            // --- Determine next node based on race ---
            let nextNode = choice.next;
            if (choice.raceNext && choice.raceNext[getPrimaryRace(window.player)]) {
              nextNode = choice.raceNext[getPrimaryRace(window.player)];
            }

            showNode(nextNode);
            return;
          }

          // --- EXP from choices ---
          if (choice.exp) {
            const leveledUp = addExp(window.player, choice.exp);
            updateCharacterUI();
            if (leveledUp) {
              // Show level up message if you want
            }
          }

          if (choice.dice) {
            // Advance time for choice (check for custom time value)
            advanceTimeForChoice(choice.timeAdvancement);
            
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
            // Advance time for choice (check for custom time value)
            advanceTimeForChoice(choice.timeAdvancement);
            
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
            if (choice.raceNext && choice.raceNext[getPrimaryRace(window.player)]) {
              nextNode = choice.raceNext[getPrimaryRace(window.player)];
            }

            showNode(nextNode);
          }
        };
      }

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

// Initialize modal events on page load
initializeModalEvents();

// --- Show character stats modal function (used by new layout buttons) ---
function showCharacterStatsModal() {
  // Create local reference to window.player
  const player = window.player;
  if (!player) {
    console.error("Player not available for stats modal");
    return;
  }

  // Ensure secondary stats are up to date before displaying
  updateSecondaryStats(player, true);
  const modal = document.getElementById("character-stats-modal");
  const title = document.getElementById("character-stats-title");
  const content = document.getElementById("character-stats-content");

  // Get character name from story layout
  const characterNameStory = document.getElementById("current-character-name-story");
  const characterName = characterNameStory ? characterNameStory.textContent : player.name;
  title.textContent = characterName + " Stats";

  const mainAttributes = ["strength", "dexterity", "constitution", "charisma", "wisdom", "intelligence"];
  const secondaryStats = ["speed", "physicalDamage", "magicDamage", "physicalDefense", "magicDefense"];

  let html = "";

  // Basic Character Info
  html += `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
      ${player.imagePath ? `<div style="text-align: center; margin-bottom: 15px;">
        <img src="${player.imagePath}" style="max-width: 120px; max-height: 120px; border-radius: 8px; border: 2px solid #007bff;" 
             onerror="this.style.display='none';" alt="Character Image">
      </div>` : ''}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.95em;">
        <div><strong>Level:</strong> ${player.level || 1}</div>
        <div><strong>EXP:</strong> ${player.exp || 0}</div>
        <div><strong>Race:</strong> ${player.race ? player.race.charAt(0).toUpperCase() + player.race.slice(1) : 'Unknown'}</div>
        <div><strong>Type:</strong> ${player.type ? player.type.charAt(0).toUpperCase() + player.type.slice(1) : 'Unknown'}</div>
        <div><strong>Height:</strong> ${getHeight(player) + 'cm'}</div>
        <div><strong>Weight:</strong> ${getWeight(player) + 'kg'}</div>
        <div><strong>Profession:</strong> ${player.profession ? player.profession.charAt(0).toUpperCase() + player.profession.slice(1) : 'None'}</div>
        <div><strong>Attribute Points:</strong> ${player.attributePoints || 0}</div>
      </div>
    </div>
  `;

  // Attributes Accordion
  html += `
    <div class="accordion-header" onclick="window.toggleAccordion('attributes')">
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
        <span id="attribute-${attr}" style="margin-right: 10px;">${player.primary[attr]}</span>
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
    <div class="accordion-header" onclick="window.toggleAccordion('secondary')">
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
    <div class="accordion-header" onclick="window.toggleAccordion('equipment')">
      <span><strong>Equipment</strong></span>
      <span id="arrow-equipment" class="accordion-arrow">▶</span>
    </div>
    <div id="content-equipment" class="accordion-content">
      <ul style='list-style:none;padding-left:0;margin:0;'>`;

  // Use our new array-based equipment system
  if (Array.isArray(player.equipment)) {
    // Get all unique slot types from the character's equipment array
    const slotTypes = [...new Set(player.equipment.map(slot => slot.slot))];
    
    slotTypes.forEach(slotType => {
      const slotName = slotType.charAt(0).toUpperCase() + slotType.slice(1);
      
      // Find all items in this slot type
      const itemsInSlot = player.equipment.filter(slot => slot.slot === slotType && slot.item);
      
      if (itemsInSlot.length > 0) {
        // Show each equipped item in this slot type
        itemsInSlot.forEach((equipmentSlot, index) => {
          const item = equipmentSlot.item;
          let modifiersText = "";
          
          // Handle both old (modifiers) and new (stats) item structures
          if (item.modifiers) {
            const modifiersList = Object.entries(item.modifiers)
              .map(([attr, value]) => `${value > 0 ? '+' : ''}${value} ${attr}`)
              .join(', ');
            modifiersText = ` (${modifiersList})`;
          } else if (item.stats) {
            const statsList = Object.entries(item.stats)
              .map(([attr, value]) => `${value > 0 ? '+' : ''}${value} ${attr}`)
              .join(', ');
            modifiersText = ` (${statsList})`;
          }
          
          const displayName = itemsInSlot.length > 1 ? `${slotName} ${index + 1}` : slotName;
          
          html += `<li style="margin-bottom:6px;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <span style="font-weight: 600;">${displayName}:</span>
              <div style="text-align: right;">
                <div style="color:#87CEEB;">${item.name}</div>
                <div style="color:#a0a0a0; font-size:0.9em;">${modifiersText}</div>
              </div>
            </div>
          </li>`;
        });
      } else {
        // Show empty slot
        html += `<li style="margin-bottom:6px; display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">${slotName}:</span>
          <span style="color:#808080;">None</span>
        </li>`;
      }
    });
  } else {
    // Fallback for old equipment system
    const equipmentSlots = ["head", "body", "legs", "foot", "hand", "weapon"];
    equipmentSlots.forEach(slot => {
      html += `<li style="margin-bottom:6px; display: flex; justify-content: space-between;">
        <span style="font-weight: 600;">${slot.charAt(0).toUpperCase() + slot.slice(1)}:</span>
        <span style="color:#808080;">None</span>
      </li>`;
    });
  }
  html += "</ul></div>";

  content.innerHTML = html;
  modal.style.display = "block";
}

// Function to update character stats modal content without rebuilding everything
function refreshCharacterStatsModal() {
  if (document.getElementById("character-stats-modal").style.display === "block") {
    const mainAttributes = ["strength", "dexterity", "constitution", "charisma", "wisdom", "intelligence"];
    const secondaryStats = ["speed", "physicalDamage", "magicDamage", "physicalDefense", "magicDefense"];


    // Update attribute points display
    const pointsElement = document.getElementById("attribute-points-display");
    if (pointsElement) {
      pointsElement.innerHTML = `<b>Attribute Points Left:</b> ${window.player.attributePoints}`;
    }

    // Update attribute values and button visibility
    mainAttributes.forEach(attr => {
      const element = document.getElementById(`attribute-${attr}`);
      if (element) {
        const oldValue = element.textContent;
        const newValue = window.player.primary[attr];
        element.textContent = newValue;
      } else {
        console.warn(`⚠️ Element not found: attribute-${attr}`);
      }

      // Update or remove + buttons based on available points
      const buttonElement = element?.parentElement?.querySelector('button');
      if (window.player.attributePoints > 0) {
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
        const oldValue = element.textContent;
        const newValue = window.player.secondary[stat];
        element.textContent = newValue;
      } else {
        console.warn(`⚠️ Element not found: secondary-${stat}`);
      }
    });
    
  } else {
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
  
  // Initialize day-night system
  initializeDayNight();
}

function setupCharacterInfoSection() {
  const characterStorySection = document.getElementById("current-character-story");
  const characterInfoStatus = document.getElementById("current-character-status");

  if (characterStorySection) {
    // Create the new character info layout with enhanced display
    const heightDisplay = `${getHeight(window.player)}cm`;
    const weightDisplay = `${getWeight(window.player)}kg`;
    const professionDisplay = (window.player && window.player.profession) ? window.player.profession.charAt(0).toUpperCase() + window.player.profession.slice(1) : 'None';

    characterStorySection.innerHTML = `
      <div class="character-basic-info">
        ${window.player && window.player.imagePath ? `<div style="text-align: center; margin-bottom: 10px;">
          <img src="${window.player.imagePath}" style="max-width: 80px; max-height: 80px; border-radius: 50%; border: 2px solid #007bff;" 
               onerror="this.style.display='none';" alt="Character Image">
        </div>` : ''}
        <div style="font-size: 1.3em; font-weight: bold; color: #e0e0e0;">
          <strong>Character:</strong> <span id="current-character-name-story">${window.player ? window.player.name || '' : ''}</span>
        </div>
        <div style="display: flex; gap: 15px; color: #a0a0a0; font-size: 0.95em; flex-wrap: wrap;">
          <span id="character-race-story">Race: ${window.player ? window.player.race || '' : ''}</span>
          <span id="character-elementalAlignment-story">Type: ${window.player ? window.player.type || '' : ''}</span>
        </div>
        <div style="display: flex; gap: 15px; color: #a0a0a0; font-size: 0.9em; flex-wrap: wrap;">
          <span>Profession: ${professionDisplay}</span>
          <span>Height: ${heightDisplay}</span>
          <span>Weight: ${weightDisplay}</span>
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
            <progress id="mp-bar-story" value="0" max="0" style="width:120px;"></progress>
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

// Function to display node image
function displayNodeImage(node) {
  const imageContainerMain = document.getElementById("node-image-main");
  const imageContainer = document.getElementById("node-image");

  // Clear existing images
  if (imageContainerMain) imageContainerMain.innerHTML = "";
  if (imageContainer) imageContainer.innerHTML = "";

  if (node.img) {
    let imageSrc = node.img;

    // If it's not a web URL, construct path relative to scenarios img folder
    if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('data:')) {
      imageSrc = `../story-content/${selectedStory.folder.replace('./', '')}/img/scenarios/${imageSrc}`;
    }

    const imageHtml = `<img src="${imageSrc}" alt="${node.title || 'Scene Image'}" onerror="this.style.display='none'">`;

    if (imageContainerMain) imageContainerMain.innerHTML = imageHtml;
    if (imageContainer) imageContainer.innerHTML = imageHtml;
  }
}

// Function to show node image in a modal (for history)
function showNodeImageModal(imageSrc, title) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('node-image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'node-image-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 80%; max-height: 80%;">
        <span class="close" onclick="document.getElementById('node-image-modal').style.display='none'">&times;</span>
        <div class="modal-header">
          <h2 id="image-modal-title"></h2>
        </div>
        <div style="text-align: center;">
          <img id="image-modal-img" style="max-width: 100%; max-height: 70vh;" alt="Node Image">
        </div>
      </div>
    `;

    // Add click-outside-to-close functionality
    modal.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    document.body.appendChild(modal);
  }

  // Set image and title
  document.getElementById('image-modal-title').textContent = title || 'Scene Image';
  const imgElement = document.getElementById('image-modal-img');
  imgElement.src = imageSrc;
  imgElement.alt = title || 'Scene Image';

  // Show modal
  modal.style.display = 'block';
}

// Function to show ability image in a modal (for battle actions)
function showAbilityImageModal(imageSrc, abilityName) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('ability-image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ability-image-modal';
    modal.className = 'modal';
    modal.style.zIndex = '20000'; // Ensure it appears above combat modal
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 70%; max-height: 80%;">
        <span class="close" onclick="document.getElementById('ability-image-modal').style.display='none'">&times;</span>
        <div class="modal-header">
          <h2 id="ability-modal-title"></h2>
        </div>
        <div style="text-align: center;">
          <img id="ability-modal-img" style="max-width: 100%; max-height: 60vh; border-radius: 8px;" alt="Ability Image">
        </div>
      </div>
    `;

    // Add click-outside-to-close functionality
    modal.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    document.body.appendChild(modal);
  }

  // Ensure modal has proper z-index every time it's shown
  modal.style.zIndex = '20000';

  // Set image and title
  document.getElementById('ability-modal-title').textContent = abilityName || 'Ability';
  const imgElement = document.getElementById('ability-modal-img');
  imgElement.src = imageSrc;
  imgElement.alt = abilityName || 'Ability';

  // Show modal
  modal.style.display = 'block';
}

// Helper function to get ability image source path
function getAbilityImageSrc(imgPath) {
  if (!imgPath) return '';

  // If it's already a web URL, return as is
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) {
    return imgPath;
  }

  // Construct path relative to abilities img folder
  const selectedStory = window.selectedStory;
  if (selectedStory) {
    return `../story-content/${selectedStory.folder.replace('./', '')}/img/abilities/${imgPath}`;
  }

  return imgPath; // Fallback
}

// Import helper functions from UI modules
import { updateElementContent, updateStoryTitle, updateChoicesContainer, hideAllContainers, showContainer } from './ui-helpers.js';
import { rebuildInventoryModal, handleInventoryItemAction, toggleAccordion, updateInventoryModal } from './inventory-ui.js';
import { updateDiceChoiceTexts, createStoryAbilityButtons, setupBuffsSection } from './abilities-ui.js';


/**
 * Handle use/equip/unequip actions from the inventory modal
 */
window.handleInventoryItemAction = function (itemId, categoryKey) {
  import('./items.js').then(({ items }) => {
    import('./inventory.js').then(({ removeItem }) => {
      import('./characters.js').then(({ updateSecondaryStats }) => {
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
                if (window.player.primary[attr] !== undefined) {
                  window.player.primary[attr] -= mod;
                }
                if (attr === "physicalDefense" || attr === "magicDefense") {
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
                  if (window.player.primary[attr] !== undefined) {
                    window.player.primary[attr] -= mod;
                  }
                  if (attr === "physicalDefense" || attr === "magicDefense") {
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
                if (window.player.primary[attr] !== undefined) {
                  window.player.primary[attr] += mod;
                }
                if (attr === "physicalDefense" || attr === "magicDefense") {
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
              window.player.secondary.life = Math.min(window.player.secondary.life + item.effect.heal, window.player.maxLife);
            }
            if (item.effect.mp) {
              window.player.secondary.mp = Math.min(window.player.secondary.mp + item.effect.mp, window.player.maxMp);
            }
            consumed = true;
          }

          // Remove one instance of the item only if it was consumed
          if (consumed) {
            removeItem(itemId, 1);
          }
        }

        // Update UI
        updateSecondaryStats(window.player, true);
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

// Make imported functions globally available
window.rebuildInventoryModal = rebuildInventoryModal;
window.handleInventoryItemAction = handleInventoryItemAction;
window.toggleAccordion = toggleAccordion;
window.updateInventoryModal = updateInventoryModal;
window.updateDiceChoiceTexts = updateDiceChoiceTexts;
window.createStoryAbilityButtons = createStoryAbilityButtons;
window.setupBuffsSection = setupBuffsSection;
window.hideAllContainers = hideAllContainers;
window.showContainer = showContainer;
window.showNodeImageModal = showNodeImageModal;
window.showAbilityImageModal = showAbilityImageModal;
window.getAbilityImageSrc = getAbilityImageSrc;

// Make equipment utilities globally available
window.getEquipmentCategories = getEquipmentCategories;
window.findAvailableSlot = findAvailableSlot;
window.isSlotOccupied = isSlotOccupied;
window.getEquippedItem = getEquippedItem;
window.findEquippedItemSlot = findEquippedItemSlot;
window.getEquippedItemsByType = getEquippedItemsByType;
window.applyAllEquipmentBonuses = applyAllEquipmentBonuses;