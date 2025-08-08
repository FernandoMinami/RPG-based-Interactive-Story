// abilities.js - Dynamic ability loading system

export const AbilityRegistry = {};

// Make abilities functions available globally for items
window.abilities = {
    learnAbility: null, // Will be set after function definition
    learnMultipleAbilities: null
};

/**
 * Dynamically loads all abilities from a manifest.
 */
export async function loadAbilities(abilityManifest, abilityBasePath = "../story-content/story01-battle-st/abilities/") {
    if (!Array.isArray(abilityManifest)) {
        throw new TypeError('abilityManifest must be an array');
    }    
    // Clear registry to prevent conflicts
    for (const key in AbilityRegistry) {
        delete AbilityRegistry[key];
    }

    for (let ability of abilityManifest) {
        try {            
            // Add cache-busting timestamp to ensure fresh import
            const timestamp = Date.now();
            const abilityModule = await import(`${abilityBasePath}${ability.file}?t=${timestamp}`);
            
            // Handle both export formats: 'export default' and 'export const ability'
            const abilityData = abilityModule.default || abilityModule.ability;
            
            if (abilityData) {
                AbilityRegistry[ability.id] = abilityData;
            } else {
                console.error(`Ability ${ability.id} has no default export or ability export in ${ability.file}`);
            }
        } catch (e) {
            console.error(`Failed to load ability: ${ability.file}`, e);
        }
    }
    
}

/**
 * Get an ability by ID from the registry
 */
export function getAbility(abilityId) {
    return AbilityRegistry[abilityId];
}

/**
 * Get multiple abilities by their IDs
 */
export function getAbilities(abilityIds) {
    
    const abilities = {};
    for (const abilityData of abilityIds) {
        // Handle both old format (string) and new format (object with id and rate)
        const id = typeof abilityData === 'string' ? abilityData : abilityData.id;
        if (AbilityRegistry[id]) {
            abilities[id] = AbilityRegistry[id];
        } else {
            console.warn(`Ability ${id} not found in registry`);
        }
    }
    return abilities;
}

/**
 * Check if an ability can be used based on requirements, cooldowns, and combos
 * @param {Object} user - The user of the ability
 * @param {Object} target - The target of the ability  
 * @param {string} abilityId - The ID of the ability
 * @param {Object} ability - The ability definition
 * @param {Object} battleState - Battle tracking state (cooldowns, uses, combos)
 * @returns {boolean} - true if ability can be used
 */
export function canUseAbility(user, target, abilityId, ability, battleState = {}) {
    if (!ability) return false;

    // Check MP cost
    if (ability.mpCost && user.mana < ability.mpCost) return false;

    // Check self status requirements
    if (ability.requiresStatusSelf && !isStatusActive(user, ability.requiresStatusSelf)) return false;

    // Check target status requirements
    if (ability.requiresStatusTarget && !isStatusActive(target, ability.requiresStatusTarget)) return false;

    // Backward compatibility: check old requiresStatus property (assume it means target)
    if (ability.requiresStatus && !isStatusActive(target, ability.requiresStatus)) return false;

    // Check cooldown (if battle state provided)
    if (battleState.abilityCooldowns && battleState.abilityCooldowns[abilityId] > 0) return false;

    // Check uses per battle (if battle state provided)
    if (ability.usesPerBattle && ability.usesPerBattle > 0 && battleState.abilityUsesLeft) {
        if (!battleState.abilityUsesLeft[abilityId] || battleState.abilityUsesLeft[abilityId] <= 0) return false;
    }

    // Check combo requirements (if battle state provided)
    if (ability.combo && ability.combo.followsFrom && ability.combo.followsFrom.length > 0 && battleState.lastPlayerAbility !== undefined) {
        if (!battleState.lastPlayerAbility || !ability.combo.followsFrom.includes(battleState.lastPlayerAbility)) {
            return false;
        }
    }

    return true;
}

/**
 * Use an ability (apply cooldown, reduce uses, and track for combos)
 * @param {string} abilityId - The ID of the ability used
 * @param {Object} ability - The ability definition
 * @param {Object} battleState - Battle tracking state (cooldowns, uses, combos)
 * @param {boolean} isPlayer - Whether this is a player ability (for combo tracking)
 */
export function useAbility(abilityId, ability, battleState = {}, isPlayer = true) {
    // Apply cooldown
    if (ability.cooldown && ability.cooldown > 0 && battleState.abilityCooldowns) {
        battleState.abilityCooldowns[abilityId] = ability.cooldown;
    }

    // Reduce uses per battle
    if (ability.usesPerBattle && ability.usesPerBattle > 0 && battleState.abilityUsesLeft) {
        if (battleState.abilityUsesLeft[abilityId]) {
            battleState.abilityUsesLeft[abilityId]--;
        }
    }

    // Track last used ability for combo system
    if (isPlayer && battleState.lastPlayerAbility !== undefined) {
        battleState.lastPlayerAbility = abilityId;
    } else if (!isPlayer && battleState.lastEnemyAbility !== undefined) {
        battleState.lastEnemyAbility = abilityId;
    }
}

// Import status checking function
import { isStatusActive } from './status.js';

/**
 * Teach an ability to a player
 * @param {Object} player - The player object
 * @param {string} abilityId - The ID of the ability to learn
 * @param {string} abilityName - The display name of the ability (optional)
 * @returns {boolean} - true if ability was learned, false if already known
 */
export function learnAbility(player, abilityId, abilityName = null) {
    // Use the actual ability name from registry if not provided
    if (!abilityName && AbilityRegistry[abilityId]) {
        abilityName = AbilityRegistry[abilityId].name || abilityId;
    } else if (!abilityName) {
        abilityName = abilityId;
    }

    // Check if player already knows this ability
    if (player.abilityIds && player.abilityIds.includes(abilityId)) {
        const message = `${player.name} already knows the ${abilityName} ability!`;
        if (window.historyLog) {
            window.historyLog.push({ action: message });
        }
        return false; // Not learned (already known)
    }

    // Initialize abilityIds if it doesn't exist
    if (!player.abilityIds) {
        player.abilityIds = [];
    }

    // Teach the ability to the player
    player.abilityIds.push(abilityId);

    const message = `${player.name} learned the ${abilityName} ability!`;
    if (window.historyLog) {
        window.historyLog.push({ action: message });
    }

    return true; // Successfully learned
}

/**
 * Learn multiple abilities at once
 * @param {Object} player - The player object
 * @param {Array} abilityIds - Array of ability IDs to learn
 * @returns {Object} - Object with learned count and already known abilities
 */
export function learnMultipleAbilities(player, abilityIds) {
    let learnedCount = 0;
    let alreadyKnown = [];

    for (const abilityId of abilityIds) {
        if (learnAbility(player, abilityId)) {
            learnedCount++;
        } else {
            alreadyKnown.push(abilityId);
        }
    }

    return { learnedCount, alreadyKnown };
}

// Make functions available globally
window.abilities.learnAbility = learnAbility;
window.abilities.learnMultipleAbilities = learnMultipleAbilities;
