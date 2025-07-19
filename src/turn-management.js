// turn-management.js - Battle turn order and state management

import { regenMp } from './character.js';
import { updateStatuses, isStatusActive } from './status.js';
import { getAbilities } from './abilities.js';

/**
 * Create turn management system
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @returns {Object} - Turn management functions
 */
export function createTurnManager(player, enemy) {
    let currentTurn = 0;
    let playerTurn = true;

    /**
     * Calculate effective speed and accuracy for a character
     * @param {Object} character - The character to calculate for
     * @returns {Object} - Speed and accuracy values
     */
    function calculateEffectiveStats(character) {
        let effectiveSpeed = character.secondary?.speed || character.speed || 0;
        let effectiveAccuracy = 1;

        // Check for status effects that affect speed/accuracy
        if (isStatusActive(character, 'pinned')) {
            // Pinned reduces speed by 20% and accuracy by 30%
            effectiveSpeed = Math.floor(effectiveSpeed * 0.8);
            effectiveAccuracy = 0.7; // 30% accuracy reduction
        }

        return { effectiveSpeed, effectiveAccuracy };
    }

    /**
     * Update cooldowns at the start of each turn
     * @param {Object} abilityCooldowns - Cooldown tracking object
     */
    function updateCooldowns(abilityCooldowns) {
        Object.keys(abilityCooldowns).forEach(abilityId => {
            if (abilityCooldowns[abilityId] > 0) {
                abilityCooldowns[abilityId]--;
            }
        });
    }

    /**
     * Check if player can act (not stunned/frozen)
     * @returns {boolean} - True if player can act
     */
    function canPlayerAct() {
        return !isStatusActive(player, 'stunned') && !isStatusActive(player, 'frozen');
    }

    /**
     * Advance to next turn
     * @param {Object} battleState - Battle state object
     * @param {Function} addLog - Logging function
     */
    function nextTurn(battleState, addLog) {
        currentTurn++;
        updateCooldowns(battleState.abilityCooldowns);
        
        // Regenerate mana
        if (regenMp) regenMp();

        // Update status effects for both characters
        updateStatuses(player, addLog);
        updateStatuses(enemy, addLog);
    }

    /**
     * Switch turns between player and enemy
     */
    function switchTurn() {
        playerTurn = !playerTurn;
    }

    /**
     * Get current turn information
     * @returns {Object} - Current turn info
     */
    function getTurnInfo() {
        return {
            currentTurn,
            playerTurn,
            playerStats: calculateEffectiveStats(player),
            enemyStats: calculateEffectiveStats(enemy),
            canPlayerAct: canPlayerAct()
        };
    }

    return {
        nextTurn,
        switchTurn,
        getTurnInfo,
        calculateEffectiveStats,
        updateCooldowns,
        canPlayerAct
    };
}

/**
 * Initialize ability tracking for battle
 * @param {Object} player - The player object
 * @returns {Object} - Initialized tracking objects
 */
export function initializeAbilityTracking(player) {
    const abilityCooldowns = {};
    const abilityUsesLeft = {};

    const playerAbilities = getAbilities(player.abilityIds || []);
    Object.entries(playerAbilities).forEach(([abilityId, ability]) => {
        abilityCooldowns[abilityId] = 0; // No cooldown at start
        if (ability.usesPerBattle && ability.usesPerBattle > 0) {
            abilityUsesLeft[abilityId] = ability.usesPerBattle;
        }
    });

    return { abilityCooldowns, abilityUsesLeft };
}

/**
 * Handle escape attempt
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Function} addLog - Logging function
 * @returns {boolean} - True if escape was successful
 */
export function handleEscapeAttempt(player, enemy, addLog) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const playerSpeed = player.secondary?.speed || 0;
    const enemySpeed = enemy.secondary?.speed || enemy.speed || 0;
    const escapeScore = Math.floor(roll + playerSpeed - enemySpeed);
    
    addLog(`${player.name} tries to escape! (Roll: ${roll} + Speed: ${playerSpeed} - Enemy Speed: ${enemySpeed} = ${escapeScore})`);

    if (escapeScore > 10) {
        addLog(`${player.name} escaped successfully!`);
        return true;
    } else {
        addLog(`${player.name} failed to escape!`);
        return false;
    }
}

/**
 * Handle struggle attempt when pinned
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Function} addLog - Logging function
 * @returns {boolean} - True if struggle was successful
 */
export function handleStruggleAttempt(player, enemy, addLog) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const playerStrengthBonus = (player.attributes?.strength || 10) - 10;
    const enemyWeight = enemy.weight || 0;
    const struggleScore = Math.floor(roll + playerStrengthBonus - (enemyWeight / 10));
    
    addLog(`${player.name} Struggles! (Roll: ${roll} + Strength Bonus: ${playerStrengthBonus} - Enemy Weight/10: ${enemyWeight}/10 = ${struggleScore})`);

    if (struggleScore > 10) {
        addLog(`${player.name} Manages to push ${enemy.name} away!`);
        return true;
    } else {
        addLog(`${player.name} failed to escape!`);
        return false;
    }
}
