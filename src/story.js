import { inventory, addItem, removeItem, hasItem, getInventory } from "./inventory.js";
import { startBattle } from "./battle.js";
import { addExp, getExpForLevel } from './leveling.js';
import { updateCharacterUI, updateStoryUI, updateInventoryBar } from './ui.js';
import { updateSecondaryStats, handleBoosts, regenMp } from './character.js';
import { historyLog, updateHistoryPanel } from './history.js';
import { loadItems, items } from './items.js';


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
      updateCharacterUI();
      updateStoryUI();
      await loadStory(`../story-content/${story.file.replace('./', '')}`);
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

  // --- 20% chance for a random battle using enemies manifest ---
  // Skip if node.noBattle or storyData.noBattle is true
  if (
    !battleJustHappened &&
    !node.noBattle &&
    !storyData.noBattle &&
    Math.random() < 0.2
  ) {
    battleJustHappened = true;
    const storyFolder = selectedStory.folder.replace('./', '');
    const enemy = await getRandomEnemy(storyFolder);
    startBattle(player, enemy, (result, rewards) => {
      if (result === "win" || result === "escape") {
        document.getElementById("combat-modal").style.display = "none";
        showNode(nodeKey);
      } else if (result === "respawn") {
        document.getElementById("combat-modal").style.display = "none";
        showNode(nodeKey);
      } else {
        document.getElementById("combat-modal").style.display = "none";
        showNode("gameover");
      }
    });
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
          const storyFolder = selectedStory.folder.replace('./', '');
          const enemyModule = await import(`../story-content/${storyFolder}/enemies/${choice.battle}.js?v=${Date.now()}`);
          const enemy = { ...enemyModule.enemy };
          startBattle(player, enemy, (result, rewards) => {
            if (result === "win" || result === "escape") {
              document.getElementById("combat-modal").style.display = "none";
              showNode(choice.next);
            } else if (result === "respawn") {
              document.getElementById("combat-modal").style.display = "none";
              showNode(choice.next);
            } else {
              document.getElementById("combat-modal").style.display = "none";
              showNode("gameover");
            }
            battleJustHappened = false;
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
          choicesContainer.style.display = "none";
          const baseRoll = Math.floor(Math.random() * 20) + 1;
          let bonus = 0;
          let bonusText = "";
          let attrValue = 0;
          if (choice.dice.attribute && player.attributes[choice.dice.attribute] !== undefined) {
            attrValue = player.attributes[choice.dice.attribute];
            bonus = Math.floor((attrValue - 10) / 2);
            bonusText = ` (+${bonus} ${choice.dice.attribute})`;
          }
          const totalRoll = baseRoll + bonus;
          pendingDiceResult = `You rolled ${baseRoll}${bonusText}: total <b>${totalRoll}</b>. `;
          historyLog.push({ action: pendingDiceResult });
          updateStoryUI && updateStoryUI();
          let resultText = pendingDiceResult;
          let outcome = null;
          if (choice.dice.outcomes) {
            outcome = choice.dice.outcomes.find(o => totalRoll >= o.min && o.max >= totalRoll);
          }
          if (outcome) {
            resultText += outcome.text ? outcome.text : "";
            if (outcome.life !== undefined) {
              let damage = outcome.life;
              if (damage < 0) {
                const defenseValue = player.secondary.defense || 0;
                damage = Math.min(0, damage + defenseValue);
              }
              player.life += damage;
              if (player.life > player.maxLife) player.life = player.maxLife;
              if (player.life < 0) player.life = 0;
              pendingNodeEffect = damage;
            }
            if (outcome.attributes && applyAttributes) {
              applyAttributes(outcome.attributes);
            }
            if (outcome.items) {
              for (const [itemId, amount] of Object.entries(outcome.items)) {
                addItem(itemId, amount);
              }
              updateStoryUI && updateStoryUI();
            }
            updateCharacterUI && updateCharacterUI();
            setTimeout(() => {
              choicesContainer.style.display = "";
              showNode(outcome.next);
            }, 1200);
          } else {
            setTimeout(() => {
              choicesContainer.style.display = "";
              showNode(nodeKey);
            }, 1200);
          }
        } else {
          if (choice.life !== undefined) {
            let damage = choice.life;
            if (damage < 0) {
              const defenseValue = player.secondary.defense || 0;
              damage = Math.min(0, damage + defenseValue);
            }
            player.life += damage;
            if (player.life > player.maxLife) player.life = player.maxLife;
            if (player.life < 0) player.life = 0;
            pendingNodeEffect = damage;
          }
          if (choice.attributes && applyAttributes) {
            applyAttributes(choice.attributes);
          }
          updateStoryUI && updateStoryUI();
          updateCharacterUI && updateCharacterUI();
          historyLog.push({ action: `Chose: ${choice.text}` });
          updateStoryUI && updateStoryUI();

          // --- If player died from this choice, hide choices and respawn ---
          if (player.life <= 0) {
            choicesContainer.innerHTML = ""; // Hide all choices
            const respawnNodes = storyData.respawn || [];
            if (respawnNodes.length > 0) {
              const respawnNode = respawnNodes[Math.floor(Math.random() * respawnNodes.length)];
              player.life = Math.floor(player.maxLife / 2);
              updateSecondaryStats(player);
              showNode(respawnNode);
            } else {
              player.life = Math.floor(player.maxLife / 2);
              updateSecondaryStats(player);
              showNode("start");
            }
            return;
          }

          showNode(choice.next);
        }
      };
      choicesContainer.appendChild(btn);
    });
}

// --- Get a random enemy from the manifest ---
async function getRandomEnemy(storyFolder) {
  // Load the enemies manifest for this story
  const manifestUrl = `../story-content/${storyFolder}/enemies/_enemies.json`;
  const enemyList = await fetch(manifestUrl).then(r => r.json());
  // Pick a random enemy id
  const enemyId = enemyList[Math.floor(Math.random() * enemyList.length)].id;
  // Import the enemy module
  const enemyModule = await import(`../story-content/${storyFolder}/enemies/${enemyId}.js?v=${Date.now()}`);
  return { ...enemyModule.enemy };
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
  const secondaryStats = ["speed", "physicalDamage", "magicDamage", "physicalDefense", "magicDefense"];

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