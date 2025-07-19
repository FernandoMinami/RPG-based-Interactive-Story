import { inventory, addItem, removeItem, hasItem, getInventory } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateCharacterUI, updateStoryUI, updateInventoryBar } from './ui.js';
import { updateSecondaryStats, handleBoosts, regenMp } from './character.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { loadItems, items } from './items.js';
import { loadStatuses } from './status.js';
import { loadAbilities } from './abilities.js';
import { executeDiceRoll, processChoice, handlePlayerDeath } from './utils.js';
import { checkForRandomEncounter, triggerForcedBattle } from './encounters.js';


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
  player.reset();
  playerPath = [];
  historyLog.length = 0;
  document.getElementById("current-character").style.display = "";
  document.getElementById("inventory-modal").style.display = "none";
  document.getElementById("gameover-container").style.display = "none";
  document.getElementById("attributes-bar-container").style.display = "";
  
  // Load statuses for this story
  const statusManifest = await fetch('../story-content/story01-battle-st/statuses/_status.json?v=' + Date.now()).then(res => res.json());
  console.log("Loaded status manifest:", statusManifest);
  await loadStatuses(statusManifest, '../story-content/story01-battle-st/statuses/');
  
  // Load abilities for this story
  const abilityManifest = await fetch('../story-content/story01-battle-st/abilities/_abilities.json').then(res => res.json());
  await loadAbilities(abilityManifest, '../story-content/story01-battle-st/abilities/');
  
  // Add cache-busting query param
  const response = await fetch(file + "?v=" + Date.now());
  storyData = await response.json();
  if (storyData.start) {
    currentNode = "start";
  } else if (storyData.story) {
    currentNode = "story";
  }
  document.querySelector(".story-container").style.display = "";
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
      await loadItems(story.folder.replace('./', ''));
      if (typeof player.reset === "function") player.reset();
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
      battleJustHappened = false;
      showNode(targetNode);
    }
  })) {
    battleJustHappened = true;
    return;
  }
  battleJustHappened = false;

  // --- Choices ---
  (node.choices || [])
    .filter(choice => !choice.character || choice.character === player.id)
    .forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice.text + (choice.dice ? " 🎲" : "");
      btn.onclick = async () => {
        pendingNodeEffect = null;
        pendingDiceResult = "";

        // --- Forced battle support (works for any choice) ---
        if (choice.battle) {
          await triggerForcedBattle(choice, selectedStory, player, (targetNode) => {
            battleJustHappened = false;
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
}

// --- Modal open/close handlers ---
// Show inventory modal
document.getElementById("show-inventory-btn").onclick = function () {
  document.getElementById("inventory-modal").style.display = "block";
  updateInventoryBar && updateInventoryBar();
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


  content.innerHTML = html;
  modal.style.display = "block";
};


window.onload = showStorySelection;
window.updateCharacterUI = updateCharacterUI;