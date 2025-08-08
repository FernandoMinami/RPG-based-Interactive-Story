// battle-ui.js - Battle user interface management

import { getInventory, removeItem } from './inventory.js';
import { items } from './items.js';
import { getAbilities, canUseAbility } from './abilities.js';
import { isStatusActive, applyStatus, statusSummary, isBuffActive, isCharacterTrapped } from './status.js';

/**
 * Create and manage ability buttons for the player
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Object} battleState - Battle state tracking
 * @param {Function} onAbilityUse - Callback when ability is used
 * @returns {HTMLElement} - The abilities container div
 */
export function createAbilityButtons(player, enemy, battleState, onAbilityUse) {
    const abilityDiv = document.createElement("div");
    abilityDiv.className = "ability";
    abilityDiv.style.display = "none";

    const playerAbilities = getAbilities(player.abilityIds || []);
    Object.entries(playerAbilities).forEach(([abilityId, ability]) => {
        const btn = document.createElement("button");
        let buttonText = `${ability.name}\n(${ability.mpCost || 0} MP)`;

        // Update battleState with current values for checking
        const canUse = canUseAbility(player, enemy, abilityId, ability, battleState);

        // Build detailed requirement messages for display
        let requirementMessage = "";

        // Check cooldown and usage limitations for display
        if (battleState.abilityCooldowns[abilityId] > 0) {
            requirementMessage += ` (${battleState.abilityCooldowns[abilityId]} turns)`;
        }

        if (ability.usesPerBattle && ability.usesPerBattle > 0) {
            const usesLeft = battleState.abilityUsesLeft[abilityId] || 0;
            if (usesLeft <= 0) {
                requirementMessage += ` (no uses left)`;
            } else {
                buttonText += ` [${usesLeft}/${ability.usesPerBattle}]`;
            }
        }

        // Check self status requirements for display
        if (ability.requiresStatusSelf && !isStatusActive(player, ability.requiresStatusSelf)) {
            requirementMessage += ` (requires ${ability.requiresStatusSelf})`;
        }

        // Check target status requirements for display
        if (ability.requiresStatusTarget && !isStatusActive(enemy, ability.requiresStatusTarget)) {
            requirementMessage += ` (requires target ${ability.requiresStatusTarget})`;
        }

        // Backward compatibility for display
        if (ability.requiresStatus && !isStatusActive(enemy, ability.requiresStatus)) {
            requirementMessage += ` (requires target ${ability.requiresStatus})`;
        }

        // Check combo requirements for display
        if (ability.combo && ability.combo.followsFrom && ability.combo.followsFrom.length > 0) {
            if (!battleState.lastPlayerAbility || !ability.combo.followsFrom.includes(battleState.lastPlayerAbility)) {
                const requiredAbilities = ability.combo.followsFrom.join(' or ');
                requirementMessage += ` (combo: needs ${requiredAbilities})`;
            } else {
                buttonText += ` [COMBO!]`;
            }
        }

        // Only disable buff abilities if their specific buff is active
        let buffActive = false;
        if (ability.type === "buff") {
            if (ability.statusTag) {
                // New system - check by statusTag
                buffActive = isBuffActive(player, ability.statusTag);
            } else if (ability.attribute && player.activeBoosts[ability.attribute] && player.activeBoosts[ability.attribute].turns > 0) {
                // Legacy system fallback
                buffActive = true;
            }
        }

        // Update button text to show all information
        btn.textContent = buttonText + requirementMessage;
        btn.disabled = player.mp < (ability.mpCost || 0) || buffActive || !canUse;

        btn.onclick = () => onAbilityUse(abilityId, ability);
        abilityDiv.appendChild(btn);
    });

    return abilityDiv;
}

/**
 * Create and manage consumable item buttons
 * @param {Object} player - The player object
 * @param {Function} onItemUse - Callback when item is used
 * @returns {HTMLElement} - The consumables container div
 */
export function createConsumableButtons(player, onItemUse) {
    const consumablesDiv = document.createElement("div");
    consumablesDiv.className = "consumables";
    consumablesDiv.style.display = "none";

    Object.entries(getInventory()).forEach(([itemId, count]) => {
        const itemDef = items[itemId];
        if (itemDef && itemDef.type === "consumable" && count > 0) {
            const btn = document.createElement("button");
            btn.textContent = `${itemDef.name} (${count})`;
            btn.onclick = () => onItemUse(itemId, itemDef);
            consumablesDiv.appendChild(btn);
        }
    });

    return consumablesDiv;
}

/**
 * Create escape/struggle button based on player status
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Function} onEscape - Callback for escape attempt
 * @param {Function} onStruggle - Callback for struggle attempt
 * @returns {HTMLElement} - The escape container div
 */
export function createEscapeButton(player, enemy, onEscape, onStruggle) {
    const escapeDiv = document.createElement("div");
    escapeDiv.className = "escape-container";
    escapeDiv.style.marginTop = "10px";

    if (isCharacterTrapped(player)) {
        // Player is trapped, show struggle button
        const struggleBtn = document.createElement("button");
        struggleBtn.textContent = "Struggle";
        struggleBtn.onclick = () => onStruggle();
        escapeDiv.appendChild(struggleBtn);
    } else {
        // Player is not trapped, show escape button
        const escapeBtn = document.createElement("button");
        escapeBtn.textContent = "Escape";
        escapeBtn.onclick = () => onEscape();
        escapeDiv.appendChild(escapeBtn);
    }

    return escapeDiv;
}

/**
 * Setup the main battle action buttons (Abilities/Items toggles)
 * @param {HTMLElement} actionsDiv - The actions container
 * @param {HTMLElement} abilityDiv - The abilities container
 * @param {HTMLElement} consumablesDiv - The consumables container
 */
export function setupActionButtons(actionsDiv, abilityDiv, consumablesDiv) {
    // Create the ability toggle button
    const abilityToggleBtn = document.createElement("button");
    abilityToggleBtn.textContent = "Abilities";
    abilityToggleBtn.onclick = () => {
        const isVisible = abilityDiv.style.display === "grid";
        abilityDiv.style.display = isVisible ? "none" : "grid";
        consumablesDiv.style.display = "none";
    };
    actionsDiv.appendChild(abilityToggleBtn);

    // Create the consumables toggle button
    const itemsToggleBtn = document.createElement("button");
    itemsToggleBtn.textContent = "Items";
    itemsToggleBtn.onclick = () => {
        const isVisible = consumablesDiv.style.display === "grid";
        consumablesDiv.style.display = isVisible ? "none" : "grid";
        abilityDiv.style.display = "none";
    };
    actionsDiv.appendChild(itemsToggleBtn);
}

/**
 * Update battle stats display with optional character images
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 */
export function updateBattleStats(player, enemy) {
    const playerStats = document.getElementById("combat-player-stats");
    const enemyStats = document.getElementById("combat-enemy-stats");

    // Create player display with optional image
    const playerImageHtml = player.imagePath
        ? `<div style="display: flex; align-items: center;width: 100%; justify-content: space-between;">
             <img src="${player.imagePath}" alt="${player.name}" 
               style="width: 180px; object-fit: cover; border-radius: 8px; margin-right: 15px;" 
               onerror="this.style.display='none';">

             <div style="flex: 1;display: flex; flex-direction: column;align-items: center;">
               <div><b>${player.name}</b></div>
               <div>HP: ${player.life}/${player.maxLife}</div>
               <div>MP: ${player.mp}/${player.maxMp}</div>
               <div>Status: ${statusSummary(player)}</div>
             </div>
           </div>`
        : `<div><b>${player.name}</b> <span>HP: ${player.life}/${player.maxLife}</span> <span>MP: ${player.mp}/${player.maxMp}</span> <span>Status: ${statusSummary(player)}</span></div>`;

    // Create enemy display with optional image
    const enemyImageHtml = enemy.imagePath
        ? `<div style="display: flex; align-items: center;width: 100%; justify-content: space-between;">
             <div style="flex: 1;display: flex; flex-direction: column;align-items: center;">
               <div><b>${enemy.name}</b></div>
               <div>HP: ${enemy.life}/${enemy.maxLife}</div>
               <div>Status: ${statusSummary(enemy)}</div>
             </div>

             <img src="${enemy.imagePath}" alt="${enemy.name}" 
                style="width: 180px; object-fit: cover; border-radius: 8px; margin-right: 15px;" 
                onerror="this.style.display='none';">
           </div>`
        : `<div><b>${enemy.name}</b> <span>HP: ${enemy.life}/${enemy.maxLife}</span> <span>Status: ${statusSummary(enemy)}</span></div>`;

    playerStats.innerHTML = playerImageHtml;
    enemyStats.innerHTML = enemyImageHtml;
}

/**
 * Setup battle history toggle functionality
 */
export function setupBattleHistory() {
    const logDiv = document.getElementById("combat-log");
    const showHistoryBtn = document.getElementById("show-battle-history-btn");

    showHistoryBtn.onclick = function () {
        if (logDiv.style.display === "none") {
            logDiv.style.display = "";
            showHistoryBtn.textContent = "Hide Battle History";
        } else {
            logDiv.style.display = "none";
            showHistoryBtn.textContent = "Show Battle History";
        }
    };
    logDiv.style.display = "none"; // Hide by default
}
