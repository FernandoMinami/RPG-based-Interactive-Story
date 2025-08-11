// turn-management.js - Battle turn order and state management

import { regenMp, regenLife } from './character.js';
import { updateStatuses, isStatusActive, applyStatus, canCharacterAct } from './status.js';
import { getAbilities } from './abilities.js';
import { getEnvironmentalEffect } from './types.js';
import { 
    calculateEnvironmentalHealing, 
    calculateEnvironmentalDamage,
    getEnvironmentalEffectsForBattle,
    getEnvironmentalPenalties
} from './environmental.js';

/**
 * Create turn management system
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @returns {Object} - Turn management functions
 */
export function createTurnManager(player, enemy) {
    let currentTurn = 0;
    let playerTurn = true;
    
    // Underwater breath tracking
    let breathTracking = {
        player: { turnsUnderwater: 0, hasBreathDamage: false },
        enemy: { turnsUnderwater: 0, hasBreathDamage: false }
    };

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
        
        // Apply environmental speed penalties using new unified system
        if (window.battleEnvironment) {
            const { type: environmentType, intensity } = window.battleEnvironment;
            const penalties = getEnvironmentalPenalties(character, environmentType, intensity);
            
            // Apply speed penalty
            if (penalties.speedPenalty > 0) {
                effectiveSpeed = Math.floor(effectiveSpeed * (1 - penalties.speedPenalty));
            }
            
            // Note: Environmental accuracy penalties are now handled in calculateAccuracy()
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
        return canCharacterAct(player);
    }

    /**
     * Check if enemy can act (not stunned/frozen)
     * @returns {boolean} - True if enemy can act
     */
    function canEnemyAct() {
        return canCharacterAct(enemy);
    }

    /**
     * Advance to next turn
     * @param {Object} battleState - Battle state object
     * @param {Function} addLog - Logging function
     * @param {string} environment - Current battle environment (optional)
     */
    function nextTurn(battleState, addLog, environment = null, addSystemMessage = null) {
        currentTurn++;
        updateCooldowns(battleState.abilityCooldowns);
        
        // Regenerate mana and life with environmental bonuses
        if (regenMp) regenMp();
        
        // Calculate environmental life regeneration bonus
        let lifeRegenBonus = 0;
        if (environment && environment !== "neutral") {
            const envEffect = getEnvironmentalEffect(player.type, environment);
            if (envEffect.hasEffect) {
                lifeRegenBonus = envEffect.bonusRegeneration;
            }
        }
        
        if (regenLife) {
            const regenAmount = regenLife(lifeRegenBonus);
            if (regenAmount > 0 && addLog) {
                let message = `${player.name} regenerates ${regenAmount} life`;
                if (lifeRegenBonus > 0) {
                    message += ` (${player.secondary.lifeRegen || 0} base + ${lifeRegenBonus} environmental)`;
                }
                addLog(message);
            }
        }

        // Only apply environmental effects and status updates if both characters are alive
        if (player.life > 0 && enemy.life > 0) {
            // Apply environmental effects (default to neutral if not specified)
            const currentEnvironment = environment || "neutral";
            applyEnvironmentalEffects(player, currentEnvironment, addLog);
            applyEnvironmentalEffects(enemy, currentEnvironment, addLog);

            // Update status effects for both characters, but only on player's turn
            // This ensures buffs/debuffs last for full rounds, not individual actions
            if (playerTurn) {
                // Use addSystemMessage for status updates to avoid interfering with recent actions
                const statusLogger = addSystemMessage || addLog;
                updateStatuses(player, statusLogger);
                updateStatuses(enemy, statusLogger);
                // Round end - no need to show "End of Round" message to players
            }
        }
    }

    /**
     * Apply environmental effects to a character
     * @param {Object} character - The character to affect
     * @param {string|Object} environment - The environment type or environment object
     * @param {Function} addLog - Logging function
     */
    function applyEnvironmentalEffects(character, environment, addLog) {
        let environmentType = "neutral";
        let intensity = 1;
        
        // Handle both string and object environment formats
        if (typeof environment === "string") {
            environmentType = environment;
        } else if (environment && environment.type) {
            environmentType = environment.type;
            intensity = environment.intensity || 1;
        }
        
        // Skip neutral environments
        if (environmentType === "neutral") return;
        
        // Check for environmental healing/regeneration first
        const healing = calculateEnvironmentalHealing(character, environmentType);
        if (healing.healingAmount > 0) {
            const oldLife = character.life;
            character.life = Math.min(character.maxLife, character.life + healing.healingAmount);
            const actualHealing = character.life - oldLife;
            if (actualHealing > 0) {
                addLog(`${character.name || "Character"} regenerates ${actualHealing} HP from the ${environmentType} environment! ${healing.description}`);
            }
        }

        // Use the new unified environmental system
        const envEffects = getEnvironmentalEffectsForBattle(character, environmentType, intensity, currentTurn);
        
        // Skip if character is immune or protected
        if (envEffects.hasImmunity || envEffects.isProtected) {
            if (envEffects.allMessages.length > 0) {
                addLog(envEffects.allMessages[0]);
            }
            return;
        }
        
        // Apply regular environmental damage
        if (envEffects.environmentalDamage > 0) {
            character.life = Math.max(0, character.life - envEffects.environmentalDamage);
            addLog(`🌡️ ${character.name} takes ${envEffects.environmentalDamage} environmental damage!`);
        }
        
        // Apply special environmental effects (lightning, tripping, breath loss, etc.)
        if (envEffects.specialDamage > 0) {
            character.life = Math.max(0, character.life - envEffects.specialDamage);
            envEffects.specialMessages.forEach(message => addLog(message));
        }
        
        // Apply status effects
        if (envEffects.statusChance > 0 && envEffects.statusType) {
            const roll = Math.floor(Math.random() * 100) + 1;
            if (roll <= envEffects.statusChance) {
                applyStatus(character, envEffects.statusType, 2, addLog);
                addLog(`${character.name} is affected by ${envEffects.statusType} from the harsh environment!`);
            }
        }
        
        // Handle underwater breath tracking (special case for legacy system)
        if (environmentType === 'underwater' && !envEffects.hasImmunity) {
            const characterKey = character === player ? 'player' : 'enemy';
            breathTracking[characterKey].turnsUnderwater++;
            
            // Check for breath damage after 6 turns (medium/deep water only)
            if (intensity >= 5 && breathTracking[characterKey].turnsUnderwater >= 6) {
                if (!breathTracking[characterKey].hasBreathDamage) {
                    breathTracking[characterKey].hasBreathDamage = true;
                    addLog(`${character.name} is running out of breath underwater!`);
                }
            }
        }
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
            canPlayerAct: canPlayerAct(),
            canEnemyAct: canEnemyAct()
        };
    }

    return {
        nextTurn,
        switchTurn,
        getTurnInfo,
        calculateEffectiveStats,
        updateCooldowns,
        canPlayerAct,
        canEnemyAct
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
 * @param {Function} addLog - Logging function (optional for backwards compatibility)
 * @returns {Object} - { success: boolean, messages: Array }
 */
export function handleEscapeAttempt(player, enemy, addLog) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const playerSpeed = player.secondary?.speed || 0;
    const enemySpeed = enemy.secondary?.speed || enemy.speed || 0;
    const escapeScore = Math.floor(roll + playerSpeed - enemySpeed);
    
    const messages = [];
    const attemptMessage = `${player.name} tries to escape! (Roll: ${roll} + Speed: ${playerSpeed} - Enemy Speed: ${enemySpeed} = ${escapeScore})`;
    messages.push(attemptMessage);
    
    let success = false;
    let resultMessage = '';
    
    if (escapeScore > 10) {
        resultMessage = `${player.name} escaped successfully!`;
        success = true;
    } else {
        resultMessage = `${player.name} failed to escape!`;
        success = false;
    }
    
    messages.push(resultMessage);
    
    // For backwards compatibility, still log if addLog is provided
    if (addLog) {
        addLog(attemptMessage);
        addLog(resultMessage);
    }
    
    return { success, messages };
}

/**
 * Handle struggle attempt when pinned
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Function} addLog - Logging function (optional for backwards compatibility)
 * @returns {Object} - { success: boolean, messages: Array }
 */
export function handleStruggleAttempt(player, enemy, addLog) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const playerStrengthBonus = (player.attributes?.strength || 10) - 10;
    const enemyWeight = enemy.weight || 0;
    const struggleScore = Math.floor(roll + playerStrengthBonus - (enemyWeight / 10));
    
    const messages = [];
    const attemptMessage = `${player.name} Struggles! (Roll: ${roll} + Strength Bonus: ${playerStrengthBonus} - Enemy Weight/10: ${enemyWeight}/10 = ${struggleScore})`;
    messages.push(attemptMessage);
    
    let success = false;
    let resultMessage = '';
    
    if (struggleScore > 10) {
        resultMessage = `${player.name} Manages to push ${enemy.name} away!`;
        success = true;
    } else {
        resultMessage = `${player.name} failed to escape!`;
        success = false;
    }
    
    messages.push(resultMessage);
    
    // For backwards compatibility, still log if addLog is provided
    if (addLog) {
        addLog(attemptMessage);
        addLog(resultMessage);
    }
    
    return { success, messages };
}
