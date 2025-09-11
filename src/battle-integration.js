// battle-integration-new.js - Integration between battle system and new status system

import { 
    addStatus, 
    removeStatus, 
    reduceTurns, 
    canCharacterAct,
    canUseAbilities,
    canEscape,
    isCharacterTrapped,
    attemptBreakFree,
    processDoTDamage,
    checkDamageModification,
    initializeCharacter
} from './status.js';

import { 
    processDoTEffect,
    checkRangeImmunity,
    checkTypeImmunity,
    checkDamageTypeImmunity,
    calculateTrapEscape,
    handleForceBreakFree
} from './special-effects.js';

/**
 * Initialize all characters for battle with new status system
 * @param {Object} player - Player character
 * @param {Array} enemies - Array of enemy characters
 */
export function initializeBattleCharacters(player, enemies) {
    initializeCharacter(player);
    enemies.forEach(enemy => initializeCharacter(enemy));
}

/**
 * Handle turn start for character (reduce status turns, process DoTs)
 * @param {Object} character - Character whose turn is starting
 * @param {Function} addLog - Logging function
 */
export function handleTurnStart(character, addLog = () => {}) {
    // Process DoT damage
    processDoTDamage(character, addLog);
    
    // Reduce turn counters
    reduceTurns(character, addLog);
}

/**
 * Handle ability usage with new status system
 * @param {Object} caster - Character using the ability
 * @param {Object} target - Target of the ability
 * @param {Object} ability - Ability being used
 * @param {number} damage - Damage dealt (if any)
 * @param {boolean} hit - Whether the ability hit
 * @param {Function} addLog - Logging function
 * @returns {Object} - Status application results
 */
export function handleAbilityStatusEffects(caster, target, ability, damage, hit, addLog = () => {}) {
    const results = {
        statusesApplied: [],
        messages: []
    };
    
    if (!hit) return results;
    
    // Handle primary status effect
    if (ability.statusToApply && ability.statusChance) {
        const roll = Math.random();
        if (roll < ability.statusChance) {
            const success = addStatus(target, ability.statusToApply, ability.statusDuration || 3, caster, addLog);
            if (success) {
                results.statusesApplied.push(ability.statusToApply);
                results.messages.push(`${ability.statusToApply} applied to ${target.name}`);
            }
        }
    }
    
    // Handle secondary status effect
    if (ability.secondaryStatusToApply && ability.secondaryStatusChance) {
        const roll = Math.random();
        if (roll < ability.secondaryStatusChance) {
            const success = addStatus(target, ability.secondaryStatusToApply, ability.secondaryStatusDuration || 1, caster, addLog);
            if (success) {
                results.statusesApplied.push(ability.secondaryStatusToApply);
                results.messages.push(`${ability.secondaryStatusToApply} applied to ${target.name}`);
            }
        }
    }
    
    return results;
}

/**
 * Check if ability can be used with new status system restrictions
 * @param {Object} character - Character trying to use ability
 * @param {Object} ability - Ability to check
 * @returns {Object} - {canUse: boolean, reason: string}
 */
export function checkAbilityRestrictions(character, ability) {
    // Check if character can act at all
    if (!canCharacterAct(character)) {
        return { canUse: false, reason: "Cannot act due to status effects" };
    }
    
    // Check if character can use abilities
    if (!canUseAbilities(character, ability)) {
        return { canUse: false, reason: "Cannot use abilities due to status effects" };
    }
    
    return { canUse: true, reason: "" };
}

/**
 * Calculate final damage with status immunities and resistances
 * @param {Object} target - Target character
 * @param {Object} ability - Ability being used
 * @param {number} originalDamage - Original damage amount
 * @param {Object} caster - Character using the ability (for dynamic checks)
 * @returns {Object} - {finalDamage: number, immunities: Array, messages: Array}
 */
export function calculateDamageWithStatusEffects(target, ability, originalDamage, caster = null) {
    const result = {
        finalDamage: originalDamage,
        immunities: [],
        messages: []
    };
    
    // Check for damage modification (now includes dynamic range immunity)
    const modifiedDamage = checkDamageModification(target, ability, originalDamage, caster);
    
    if (modifiedDamage === 0 && originalDamage > 0) {
        result.finalDamage = 0;
        result.immunities.push("immune");
        result.messages.push(`${target.name} is immune to this attack!`);
    } else {
        result.finalDamage = modifiedDamage;
    }
    
    return result;
}

/**
 * Handle escape attempt with new status system
 * @param {Object} character - Character trying to escape
 * @param {Function} addLog - Logging function
 * @returns {Object} - {canAttempt: boolean, escapeType: string, result: Object}
 */
export function handleEscapeAttempt(character, addLog = () => {}) {
    // Check if escape is allowed
    if (!canEscape(character)) {
        return { 
            canAttempt: false, 
            escapeType: "blocked", 
            result: { success: false, messages: ["Cannot escape due to status effects"] }
        };
    }
    
    // Check if trapped (need to struggle instead)
    const trapInfo = isCharacterTrapped(character);
    if (trapInfo) {
        const breakFreeResult = attemptBreakFree(character, addLog);
        return {
            canAttempt: true,
            escapeType: "struggle",
            result: breakFreeResult
        };
    }
    
    // Normal escape attempt
    const escapeRoll = Math.floor(Math.random() * 20) + 1;
    const success = escapeRoll > 12; // Basic escape threshold
    
    return {
        canAttempt: true,
        escapeType: "escape",
        result: {
            success,
            messages: [`Escape attempt: rolled ${escapeRoll} ${success ? '(Success!)' : '(Failed)'}`]
        }
    };
}

/**
 * Handle character death and cleanup
 * @param {Object} character - Character that died
 * @param {Function} addLog - Logging function
 */
export function handleCharacterDeath(character, addLog = () => {}) {
    // Remove all statuses from dead character
    removeStatus(character, null, addLog);
    
    // Additional cleanup could go here
    addLog(`${character.name} has fallen in battle`);
}

/**
 * Check if battle should end based on status effects
 * @param {Object} player - Player character
 * @param {Array} enemies - Array of enemy characters
 * @returns {Object} - {shouldEnd: boolean, reason: string, winner: string}
 */
export function checkBattleEndConditions(player, enemies) {
    // Check if player is dead
    if (player.secondary.life <= 0) {
        return { shouldEnd: true, reason: "Player defeated", winner: "enemy" };
    }
    
    // Check if all enemies are dead
    const aliveEnemies = enemies.filter(enemy => enemy.secondary.life > 0);
    if (aliveEnemies.length === 0) {
        return { shouldEnd: true, reason: "All enemies defeated", winner: "player" };
    }
    
    return { shouldEnd: false, reason: "", winner: "" };
}

/**
 * Get battle action button text based on status
 * @param {Object} character - Character to check
 * @returns {string} - Button text ("Attack", "Struggle", "Pass", etc.)
 */
export function getBattleActionButtonText(character) {
    if (!canCharacterAct(character)) {
        return "Pass Turn";
    }
    
    const trapInfo = isCharacterTrapped(character);
    if (trapInfo) {
        const trapConfig = trapInfo.status.trapped;
        return trapConfig.buttonText || "Struggle";
    }
    
    if (!canEscape(character)) {
        return "Pass Turn";
    }
    
    return "Escape";
}

/**
 * Update UI elements based on status effects
 * @param {Object} character - Character to update UI for
 * @param {string} containerId - Container ID for UI updates
 */
export function updateStatusEffectUI(character, containerId = null) {
    // This would update the UI display of active status effects
    // Implementation depends on your UI structure
    
    if (character.statusEffects) {
        // Update the character's status display
        const statusContainer = document.getElementById(containerId || "status-effects");
        if (statusContainer) {
            let statusHtml = '';
            character.statusEffects.forEach(effect => {
                statusHtml += `<div class="status-effect">
                    <span class="status-name">${effect.name}</span>
                    ${effect.duration > 0 ? `<span class="status-duration">(${effect.duration})</span>` : ''}
                </div>`;
            });
            statusContainer.innerHTML = statusHtml;
        }
    }
}

// Export all functions
export {
    initializeBattleCharacters,
    handleTurnStart,
    handleAbilityStatusEffects,
    checkAbilityRestrictions,
    calculateDamageWithStatusEffects,
    handleEscapeAttempt,
    handleCharacterDeath,
    checkBattleEndConditions,
    getBattleActionButtonText,
    updateStatusEffectUI
};
