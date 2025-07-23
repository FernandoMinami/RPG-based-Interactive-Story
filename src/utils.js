// utils.js - Utility functions for story mechanics

import { addExp } from './leveling.js';
import { addItem } from './inventory.js';
import { updateCharacterUI, updateStoryUI } from './ui.js';
import { historyLog } from './history.js';

/**
 * Execute a dice roll choice with attribute bonuses and outcomes
 * @param {Object} choice - The choice object containing dice configuration
 * @param {Object} player - The player object
 * @param {Function} applyAttributes - Function to apply attribute changes
 * @param {Function} onComplete - Callback when dice roll is complete
 * @returns {Object} - Object containing dice result and pending effects
 */
export function executeDiceRoll(choice, player, applyAttributes, onComplete) {
    const choicesContainer = document.getElementById("choices-container");
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
    const pendingDiceResult = `You rolled ${baseRoll}${bonusText}: total <b>${totalRoll}</b>. `;
    
    historyLog.push({ action: pendingDiceResult });
    updateStoryUI && updateStoryUI();
    
    let resultText = pendingDiceResult;
    let outcome = null;
    let pendingNodeEffect = null;
    
    if (choice.dice.outcomes) {
        outcome = choice.dice.outcomes.find(o => totalRoll >= o.min && o.max >= totalRoll);
    }
    
    if (outcome) {
        resultText += outcome.text ? outcome.text : "";
        
        // Handle life changes
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
        
        // Handle attribute changes
        if (outcome.attributes && applyAttributes) {
            applyAttributes(outcome.attributes);
        }
        
        // Handle item rewards
        if (outcome.items) {
            for (const [itemId, amount] of Object.entries(outcome.items)) {
                addItem(itemId, amount);
            }
            updateStoryUI && updateStoryUI();
        }
        
        updateCharacterUI && updateCharacterUI();
        
        setTimeout(() => {
            choicesContainer.style.display = "";
            
            // --- Determine next node based on race ---
            let nextNode = outcome.next;
            if (outcome.raceNext && outcome.raceNext[window.player.race]) {
                nextNode = outcome.raceNext[window.player.race];
            }
            
            onComplete(nextNode, pendingNodeEffect, pendingDiceResult);
        }, 1200);
    } else {
        setTimeout(() => {
            choicesContainer.style.display = "";
            onComplete(null, pendingNodeEffect, pendingDiceResult);
        }, 1200);
    }
    
    return {
        baseRoll,
        bonus,
        totalRoll,
        outcome,
        pendingDiceResult,
        pendingNodeEffect
    };
}

/**
 * Process a non-dice choice with potential life/attribute changes
 * @param {Object} choice - The choice object
 * @param {Object} player - The player object
 * @param {Function} applyAttributes - Function to apply attribute changes
 * @returns {number|null} - Pending node effect (damage/healing)
 */
export function processChoice(choice, player, applyAttributes) {
    let pendingNodeEffect = null;
    
    // Handle life changes
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
    
    // Handle attribute changes
    if (choice.attributes && applyAttributes) {
        applyAttributes(choice.attributes);
    }
    
    // Handle EXP rewards
    if (choice.exp) {
        const leveledUp = addExp(player, choice.exp);
        updateCharacterUI();
        if (leveledUp) {
            // Level up message could be handled here if needed
        }
    }
    
    updateStoryUI && updateStoryUI();
    updateCharacterUI && updateCharacterUI();
    historyLog.push({ action: `Chose: ${choice.text}` });
    updateStoryUI && updateStoryUI();
    
    return pendingNodeEffect;
}

/**
 * Check if player has died and handle respawn logic
 * @param {Object} player - The player object
 * @param {Object} storyData - The story data containing respawn nodes
 * @param {Function} showNode - Function to show a story node
 * @param {Function} updateSecondaryStats - Function to update secondary stats
 * @returns {boolean} - True if player died and respawn was handled
 */
export function handlePlayerDeath(player, storyData, showNode, updateSecondaryStats) {
    if (player.life <= 0) {
        const choicesContainer = document.getElementById("choices-container");
        choicesContainer.innerHTML = ""; // Hide all choices
        
        const respawnNodes = storyData.respawn || [];
        let respawnNode = "start";
        
        if (respawnNodes.length > 0) {
            respawnNode = respawnNodes[Math.floor(Math.random() * respawnNodes.length)];
        }
        
        player.life = Math.floor(player.maxLife / 2);
        updateSecondaryStats(player);
        showNode(respawnNode);
        return true;
    }
    return false;
}
