// status.js - New Modular Status System

// Import dynamic range immunity function
import { checkDynamicRangeImmunity } from './special-effects.js';
import { hasAnyElementalAlignment, getWeight } from './element-helpers.js';

export const StatusRegistry = {};

// Global status tracking for all characters
export const ActiveStatusRegistry = new Map();

// Character linking system for mounts, trapping, etc.
export const CharacterLinks = new Map();

// Backup storage for original stats (to restore when status ends)
const OriginalStatsBackup = new Map();

/** Initialize character in the status system
 * @param {Object} character - The character to initialize
 */
export function initializeCharacter(character) {
    const charId = getCharacterId(character);
    
    if (!ActiveStatusRegistry.has(charId)) {
        ActiveStatusRegistry.set(charId, new Map());
    }
    
    if (!CharacterLinks.has(charId)) {
        CharacterLinks.set(charId, {
            linkedTo: [],
            trappedBy: [],
            mounting: null,
            mountedBy: null
        });
    }
    
    // Backup original stats
    if (!OriginalStatsBackup.has(charId)) {
        OriginalStatsBackup.set(charId, {
            primary: { ...character.primary },
            secondary: character.secondary ? { ...character.secondary } : {}
        });
    }
}

/** Get unique character ID
 * @param {Object} character - The character
 * @returns {string} - Unique character ID
 */
function getCharacterId(character) {
    return character.id || character.name || `character_${Math.random().toString(36).substr(2, 9)}`;
}

/** Add status to a character
 * @param {Object} target - Target character
 * @param {string} statusId - Status ID from registry
 * @param {number} turns - Duration in turns (0 = permanent)
 * @param {Object} caster - Who applied the status (optional)
 * @param {Function} addLog - Logging function
 * @returns {boolean} - True if status was applied, false if blocked
 */
export function addStatus(target, statusId, turns = 0, caster = null, addLog = () => {}) {
    const status = StatusRegistry[statusId];
    
    // Debug logging
    
    if (!status) {
        const availableStatuses = Object.keys(StatusRegistry).join(', ');
        console.error(`❌ Status ${statusId} not found in registry. Available: ${availableStatuses}`);
        addLog(`Status ${statusId} not found in registry`);
        return false;
    }
    
    // Initialize character if needed
    initializeCharacter(target);
    
    // Check immunity by type
    if (status.immuneTypes && target.misc?.elementalAlignments && hasAnyElementalAlignment(target, status.immuneTypes)) {
        addLog(`${target.name || 'Target'} is immune to ${status.name} due to type immunity`);
        return false;
    }
    
    const charId = getCharacterId(target);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    // Check if status is already active
    if (activeStatuses.has(statusId)) {
        // Refresh duration
        const existingStatus = activeStatuses.get(statusId);
        existingStatus.turns = turns || existingStatus.turns;
        addLog(`${status.name} duration refreshed on ${target.name || 'target'}`);
        return true;
    }
    
    // Apply the status
    const statusInstance = {
        id: statusId,
        name: status.name,
        turns: turns,
        caster: caster,
        appliedEffects: {}
    };
    
    // Apply all status effects
    applyStatusEffects(target, status, statusInstance, addLog);
    
    // Store the status
    activeStatuses.set(statusId, statusInstance);
    
    // Update UI array for display
    updateStatusUIArray(target);
    
    addLog(`${status.name} applied to ${target.name || 'target'}${turns > 0 ? ` for ${turns} turns` : ''}`);
    return true;
}

/** Remove status from a character
 * @param {Object} target - Target character
 * @param {string} statusId - Status ID to remove (null = remove all)
 * @param {Function} addLog - Logging function
 */
export function removeStatus(target, statusId = null, addLog = () => {}) {
    const charId = getCharacterId(target);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return;
    
    if (statusId === null) {
        // Remove all statuses
        for (const [id, instance] of activeStatuses) {
            removeStatusEffects(target, StatusRegistry[id], instance, addLog);
        }
        activeStatuses.clear();
        addLog(`All statuses removed from ${target.name || 'target'}`);
    } else {
        // Remove specific status
        const statusInstance = activeStatuses.get(statusId);
        if (statusInstance) {
            removeStatusEffects(target, StatusRegistry[statusId], statusInstance, addLog);
            activeStatuses.delete(statusId);
            addLog(`${StatusRegistry[statusId]?.name || statusId} removed from ${target.name || 'target'}`);
        }
    }
    
    // Update UI array
    updateStatusUIArray(target);
}

/** Reduce turns on all statuses for a character
 * @param {Object} target - Target character
 * @param {Function} addLog - Logging function
 */
export function reduceTurns(target, addLog = () => {}) {
    const charId = getCharacterId(target);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return;
    
    const expiredStatuses = [];
    
    for (const [statusId, statusInstance] of activeStatuses) {
        if (statusInstance.turns > 0) {
            statusInstance.turns--;
            if (statusInstance.turns === 0) {
                expiredStatuses.push(statusId);
            }
        }
    }
    
    // Remove expired statuses
    for (const statusId of expiredStatuses) {
        removeStatus(target, statusId, addLog);
    }
}

/** Link two characters together
 * @param {Object} char1 - First character
 * @param {Object} char2 - Second character
 * @param {string} linkType - Type of link ("mount", "trap", "general")
 */
export function linkCharacters(char1, char2, linkType = "general") {
    initializeCharacter(char1);
    initializeCharacter(char2);
    
    const char1Id = getCharacterId(char1);
    const char2Id = getCharacterId(char2);
    
    const char1Links = CharacterLinks.get(char1Id);
    const char2Links = CharacterLinks.get(char2Id);
    
    // Add to general linked list
    if (!char1Links.linkedTo.includes(char2Id)) {
        char1Links.linkedTo.push(char2Id);
    }
    if (!char2Links.linkedTo.includes(char1Id)) {
        char2Links.linkedTo.push(char1Id);
    }
    
    // Handle specific link types
    if (linkType === "mount") {
        char1Links.mounting = char2Id;
        char2Links.mountedBy = char1Id;
    } else if (linkType === "trap") {
        char2Links.trappedBy.push(char1Id);
    }
}

/** Unlink two characters
 * @param {Object} char1 - First character
 * @param {Object} char2 - Second character
 * @param {string} linkType - Type of link to remove
 */
export function unlinkCharacters(char1, char2, linkType = "general") {
    const char1Id = getCharacterId(char1);
    const char2Id = getCharacterId(char2);
    
    const char1Links = CharacterLinks.get(char1Id);
    const char2Links = CharacterLinks.get(char2Id);
    
    if (!char1Links || !char2Links) return;
    
    // Remove from general linked list
    char1Links.linkedTo = char1Links.linkedTo.filter(id => id !== char2Id);
    char2Links.linkedTo = char2Links.linkedTo.filter(id => id !== char1Id);
    
    // Handle specific link types
    if (linkType === "mount") {
        if (char1Links.mounting === char2Id) char1Links.mounting = null;
        if (char2Links.mountedBy === char1Id) char2Links.mountedBy = null;
    } else if (linkType === "trap") {
        char2Links.trappedBy = char2Links.trappedBy.filter(id => id !== char1Id);
    }
}

/** Handle mount equipment (enemy uses mount)
 * @param {Object} rider - The riding character
 * @param {Object} mount - The mount character
 * @param {Function} addLog - Logging function
 */
export function equipMount(rider, mount, addLog = () => {}) {
    // Check weight capacity
    const riderWeight = getWeight(rider, 100);
    const mountWeight = getWeight(mount, 200);
    const mountStrength = mount.primary?.strength || 10;
    
    const weightLimit = mountWeight + (mountStrength * 2);
    const requiredCapacity = riderWeight * 1.4;
    
    if (requiredCapacity > weightLimit) {
        const damage = Math.floor((requiredCapacity - weightLimit) / 10);
        mount.life = Math.max(0, mount.life - damage);
        addStatus(mount, "struggling", 3, rider, addLog);
        addLog(`${mount.name} struggles under the weight and takes ${damage} damage!`);
    }
    
    // Link characters and apply statuses
    linkCharacters(rider, mount, "mount");
    addStatus(mount, "mount", 0, rider, addLog);
    addStatus(rider, "riding", 0, mount, addLog);
    
    // Set mount in equipment slot if it exists
    if (rider.equipment) {
        rider.equipment.mount = mount;
    }
}

/** Handle mount taming (player uses mount)
 * @param {Object} rider - The riding character
 * @param {Object} mount - The mount character
 * @param {Function} addLog - Logging function
 */
export function tameMount(rider, mount, addLog = () => {}) {
    linkCharacters(rider, mount, "mount");
    addStatus(mount, "mount", 0, rider, addLog);
    addStatus(rider, "riding", 0, mount, addLog);
    
    // Set mount in equipment slot if it exists
    if (rider.equipment) {
        rider.equipment.mount = mount;
    }
}

/** Handle trapping mechanics
 * @param {Object} trapper - The character doing the trapping
 * @param {Object} target - The target being trapped
 * @param {string} statusId - The trapping status ID
 * @param {Function} addLog - Logging function
 */
export function trapping(trapper, target, statusId, addLog = () => {}) {
    linkCharacters(trapper, target, "trap");
    addStatus(target, statusId, 0, trapper, addLog);
}

/** Check if character can act (not stunned, etc.)
 * @param {Object} character - Character to check
 * @returns {boolean} - True if can act
 */
export function canCharacterAct(character) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return true;
    
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (status && status.unnableAct) {
            return false;
        }
    }
    
    return true;
}

/** Check if character can use abilities
 * @param {Object} character - Character to check
 * @param {Object} ability - Ability to check (optional)
 * @returns {boolean} - True if can use abilities
 */
export function canUseAbilities(character, ability = null) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return true;
    
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (!status) continue;
        
        // Check general ability restriction
        if (status.unnableAbility) return false;
        
        // Check type restrictions
        if (ability && status.unnableType && ability.type === status.unnableType) {
            return false;
        }
        
        // Check range restrictions
        if (ability && status.unnableRange && ability.range === status.unnableRange) {
            return false;
        }
    }
    
    return true;
}

/** Check if character can escape
 * @param {Object} character - Character to check
 * @returns {boolean} - True if can escape
 */
export function canEscape(character) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return true;
    
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (status && status.unnableEscape) {
            return false;
        }
    }
    
    return true;
}

/** Check if character is trapped
 * @param {Object} character - Character to check
 * @returns {Object|null} - Trap info or null if not trapped
 */
export function isCharacterTrapped(character) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return null;
    
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (status && status.trapped && status.trapped.isTrapped) {
            return {
                statusId,
                status,
                instance: statusInstance
            };
        }
    }
    
    return null;
}

/** Attempt to break free from trap
 * @param {Object} character - Character attempting to break free
 * @param {Function} addLog - Logging function
 * @returns {Object} - Result with success boolean and messages
 */
export function attemptBreakFree(character, addLog = () => {}) {
    const trapInfo = isCharacterTrapped(character);
    if (!trapInfo) {
        return { success: false, messages: ["Not trapped"] };
    }
    
    const { status, statusId } = trapInfo;
    const trapConfig = status.trapped;
    
    const charId = getCharacterId(character);
    const links = CharacterLinks.get(charId);
    
    if (!trapConfig.attributeToBreakFree) {
        // Simple random roll
        const roll = Math.floor(Math.random() * 20) + 1;
        if (roll > 12) {
            // Success
            links.trappedBy = [];
            removeStatus(character, statusId, addLog);
            return { 
                success: true, 
                messages: [`Broke free! (Rolled ${roll})`] 
            };
        } else {
            return { 
                success: false, 
                messages: [`Failed to break free (Rolled ${roll})`] 
            };
        }
    } else {
        // Attribute-based struggle
        const userRoll = Math.floor(Math.random() * 20) + 1;
        const userAttribute = character.primary[trapConfig.attributeToBreakFree] || 10;
        const userBonus = userAttribute - 10;
        const userTotal = userRoll + userBonus;
        
        // Calculate opponent totals
        let success = true;
        const messages = [];
        
        for (const trapperId of links.trappedBy) {
            // Find trapper character - this would need to be passed in or found via battle state
            // For now, use a simplified calculation
            const trapperRoll = Math.floor(Math.random() * 20) + 1;
            const trapperBonus = 0; // Would need actual trapper data
            const trapperTotal = trapperRoll + trapperBonus;
            
            if (userTotal <= trapperTotal) {
                success = false;
                break;
            }
        }
        
        if (success) {
            links.trappedBy = [];
            removeStatus(character, statusId, addLog);
            messages.push(`Broke free! (${userTotal} vs trap)`);
        } else {
            messages.push(`Failed to break free (${userTotal} vs trap)`);
        }
        
        return { success, messages };
    }
}

/** Apply all effects from a status
 * @param {Object} target - Target character
 * @param {Object} status - Status definition
 * @param {Object} statusInstance - Status instance data
 * @param {Function} addLog - Logging function
 */
function applyStatusEffects(target, status, statusInstance, addLog) {
    const effects = {};
    
    // Apply attribute increases
    if (status.increaseAtributes) {
        const { amount, attribute } = status.increaseAtributes;
        if (target.primary[attribute] !== undefined) {
            target.primary[attribute] += amount;
            effects.attributeIncrease = { attribute, amount };
        }
    }
    
    // Apply attribute decreases
    if (status.reduceAtributes) {
        const { amount, attribute } = status.reduceAtributes;
        if (target.primary[attribute] !== undefined) {
            target.primary[attribute] -= amount;
            effects.attributeDecrease = { attribute, amount };
        }
    }
    
    // Apply secondary increases
    if (status.increaseSecondary) {
        const { amount, secondary } = status.increaseSecondary;
        if (!target.secondary) target.secondary = {};
        
        // Initialize the secondary attribute if it doesn't exist
        if (target.secondary[secondary] === undefined) {
            target.secondary[secondary] = 0;
        }
        
        target.secondary[secondary] += amount;
        effects.secondaryIncrease = { secondary, amount };

    }
    
    // Apply secondary decreases
    if (status.reduceSecondary) {
        const { amount, secondary } = status.reduceSecondary;
        if (!target.secondary) target.secondary = {};
        
        // Initialize the secondary attribute if it doesn't exist
        if (target.secondary[secondary] === undefined) {
            target.secondary[secondary] = 0;
        }
        
        // Store the original value before modification
        const originalValue = target.secondary[secondary];
        
        // Apply reduction but ensure it doesn't go below 0
        target.secondary[secondary] = Math.max(0, target.secondary[secondary] - amount);
        
        // Store the actual reduction amount (for proper restoration)
        const actualReduction = originalValue - target.secondary[secondary];
        
        effects.secondaryDecrease = { secondary, amount: actualReduction };
    }
    
    statusInstance.appliedEffects = effects;
}

/** Remove all effects from a status
 * @param {Object} target - Target character
 * @param {Object} status - Status definition
 * @param {Object} statusInstance - Status instance data
 * @param {Function} addLog - Logging function
 */
function removeStatusEffects(target, status, statusInstance, addLog) {
    const effects = statusInstance.appliedEffects;
    
    // Restore attribute changes
    if (effects.attributeIncrease) {
        const { attribute, amount } = effects.attributeIncrease;
        target.primary[attribute] -= amount;
    }
    
    if (effects.attributeDecrease) {
        const { attribute, amount } = effects.attributeDecrease;
        target.primary[attribute] += amount;
    }
    
    // Restore secondary changes
    if (effects.secondaryIncrease) {
        const { secondary, amount } = effects.secondaryIncrease;
        target.secondary[secondary] -= amount;
    }
    
    if (effects.secondaryDecrease) {
        const { secondary, amount } = effects.secondaryDecrease;
        target.secondary[secondary] += amount;
    }
}

/** Update the UI status array for display
 * @param {Object} target - Target character
 */
function updateStatusUIArray(target) {
    const charId = getCharacterId(target);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!target.statusEffects) {
        target.statusEffects = [];
    }
    
    target.statusEffects = [];
    
    if (activeStatuses) {
        for (const [statusId, statusInstance] of activeStatuses) {
            const status = StatusRegistry[statusId];
            if (status) {
                target.statusEffects.push({
                    name: status.name,
                    statusTag: statusId,
                    duration: statusInstance.turns,
                    description: status.description || status.name
                });
            }
        }
    }
}

/** Process DoT damage for a character
 * @param {Object} target - Target character
 * @param {Function} addLog - Logging function
 */
export function processDoTDamage(target, addLog = () => {}) {
    const charId = getCharacterId(target);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return;
    
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (status && status.DoT && status.DoT.isDoT) {
            const damage = status.DoT.DoTAmount || 0;
            const damageType = status.DoT.DamageType || 'none';

            target.secondary.life = Math.max(0, target.secondary.life - damage);
            addLog(`${target.name || 'Target'} takes ${damage} ${damageType} damage from ${status.name}`);
        }
    }
}

/** Check damage immunity/resistance for incoming damage
 * @param {Object} target - Target character
 * @param {Object} ability - Ability being used
 * @param {number} damage - Original damage amount
 * @param {Object} caster - Character using the ability (for dynamic checks)
 * @returns {number} - Modified damage amount
 */
export function checkDamageModification(target, ability, damage, caster = null) {
    const charId = getCharacterId(target);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return damage;
    
    let modifiedDamage = damage;
    
    // First check dynamic range immunity (isHigh system)
    if (caster) {
        if (checkDynamicRangeImmunity(target, ability, caster)) {
            return 0; // Immune due to elevation difference
        }
    }
    
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (!status) continue;
        
        // Check static range immunity (for non-isHigh statuses)
        if (status.rangeImmunity && ability.range === status.rangeImmunity) {
            // Skip if this is an isHigh status (already handled dynamically)
            if (!status.isHigh) {
                modifiedDamage = 0;
                break;
            }
        }
        
        // Check type immunity
        if (status.typeImmunity && ability.type === status.typeImmunity) {
            modifiedDamage = 0;
            break;
        }
        
        // Check damage type immunity
        if (status.damageTypeImmunity && ability.damageType === status.damageTypeImmunity) {
            modifiedDamage = 0;
            break;
        }
    }
    
    return modifiedDamage;
}

/** Dynamically load all statuses from a manifest
 * @param {Array} statusManifest - Array of status file names
 * @param {string} statusBasePath - Base path to status files
 */
export async function loadStatuses(statusManifest, statusBasePath = `../story-content/${storyFolder}/statuses/`) {
    if (!Array.isArray(statusManifest)) {
        console.error("Status manifest must be an array");
        return;
    }
    

    
    // Clear registry
    for (const key in StatusRegistry) {
        delete StatusRegistry[key];
    }
    
    for (const statusFile of statusManifest) {
        try {
            const statusModule = await import(`${statusBasePath}${statusFile}`);
            const status = statusModule.default;
            
            if (status && status.id) {
                StatusRegistry[status.id] = status;
            } else {
                console.warn(`Invalid status in file ${statusFile}`);
            }
        } catch (error) {
            console.error(`Failed to load status from ${statusFile}:`, error);
        }
    }
    
}

/** Get all active statuses for a character
 * @param {Object} character - Character to check
 * @returns {Array} - Array of active status info
 */
export function getActiveStatuses(character) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return [];
    
    const result = [];
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (status) {
            result.push({
                id: statusId,
                name: status.name,
                turns: statusInstance.turns,
                caster: statusInstance.caster
            });
        }
    }
    
    return result;
}

/** Check if a specific status is active
 * @param {Object} character - Character to check
 * @param {string} statusId - Status ID to check
 * @returns {boolean} - True if status is active
 */
export function hasStatus(character, statusId) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    return activeStatuses ? activeStatuses.has(statusId) : false;
}

/** Remove statuses that should end with battle
 * @param {Object} character - Character to clean up
 * @param {Function} addLog - Logging function
 */
export function removeStatusAtEnd(character, addLog = () => {}) {
    const charId = getCharacterId(character);
    const activeStatuses = ActiveStatusRegistry.get(charId);
    
    if (!activeStatuses) return;
    
    const statusesToRemove = [];
    
    // Find statuses that should end with battle
    for (const [statusId, statusInstance] of activeStatuses) {
        const status = StatusRegistry[statusId];
        if (status && status.endsWithBattle === true) {
            statusesToRemove.push(statusId);
        }
    }
    
    // Remove the statuses
    for (const statusId of statusesToRemove) {
        const status = StatusRegistry[statusId];
        removeStatus(character, statusId, addLog);
    }
    
    if (statusesToRemove.length > 0) {
        addLog(`Battle-specific statuses removed from ${character.name}`);
    }
}

/** Check if a specific status is active for a character (alias for hasStatus)
 * @param {Object} character - Character to check
 * @param {string} statusId - Status ID to check
 * @returns {boolean} - True if status is active
 */
export function isStatusActive(character, statusId) {
    return hasStatus(character, statusId);
}

/** Get a summary of active statuses for display
 * @param {Object} character - Character to get status summary for
 * @returns {string} - Formatted status summary
 */
export function statusSummary(character) {
    const activeStatuses = getActiveStatuses(character);
    
    if (activeStatuses.length === 0) {
        return "None";
    }
    
    return activeStatuses.map(statusData => {
        const status = StatusRegistry[statusData.id]; // Fixed: use statusData.id instead of statusData.statusId
        const displayName = status ? status.name : statusData.id;
        const turnsText = statusData.turns > 0 ? ` (${statusData.turns})` : " (∞)";
        return displayName + turnsText;
    }).join(", ");
}





/** Legacy function - apply status (redirect to addStatus)
 * @param {Object} target - Target character
 * @param {string} statusId - Status ID to apply
 * @param {number} turns - Duration in turns
 * @param {Function} addLog - Logging function
 * @param {boolean} isPlayer - Whether target is player (legacy parameter)
 */
export function applyStatus(target, statusId, turns = 0, addLog = () => {}, isPlayer = true) {
    return addStatus(target, statusId, turns, null, addLog);
}

/** Legacy function - update statuses (redirect to reduceTurns)
 * @param {Object} character - Character to update
 * @param {Function} addLog - Logging function
 */
export function updateStatuses(character, addLog = () => {}) {
    processDoTDamage(character, addLog);
    reduceTurns(character, addLog);
}

/** Legacy function - apply stunned status
 * @param {Object} target - Target to stun
 * @param {number} turns - Duration
 * @param {Function} addLog - Logging function
 */
export function applyStunnedStatus(target, turns = 1, addLog = () => {}) {
    addStatus(target, "stunned", turns, null, addLog);
}

/** Legacy function - remove mount partnership
 * @param {Object} character - Character to remove mount from
 * @param {Function} addLog - Logging function
 */
export function removeMountPartnership(character, addLog = () => {}) {
    // Remove both mount and rider statuses
    removeStatus(character, "mount", addLog);
    removeStatus(character, "rider", addLog);
    
    // Clean up mount partnership properties
    if (character.mountPartner) {
        delete character.mountPartner;
    }
    if (character.riders) {
        delete character.riders;
    }
}

/** Legacy function - check if buff is active
 * @param {Object} target - Target to check
 * @param {string} buffTag - Buff tag to check
 * @returns {boolean} - True if buff is active
 */
export function isBuffActive(target, buffTag) {
    // Check if any status with the given tag is active
    return isStatusActive(target, buffTag);
}

// Legacy compatibility - add BuffRegistry as alias to StatusRegistry
export const BuffRegistry = StatusRegistry;




// Make functions globally available
if (typeof window !== 'undefined') {
    window.addStatus = addStatus;
    window.removeStatus = removeStatus;
    window.reduceTurns = reduceTurns;
    window.canCharacterAct = canCharacterAct;
    window.canUseAbilities = canUseAbilities;
    window.canEscape = canEscape;
    window.isCharacterTrapped = isCharacterTrapped;
    window.attemptBreakFree = attemptBreakFree;
    window.processDoTDamage = processDoTDamage;
    window.checkDamageModification = checkDamageModification;
    window.isStatusActive = isStatusActive;
    window.hasStatus = hasStatus;
    window.getActiveStatuses = getActiveStatuses;
    window.statusSummary = statusSummary;
    window.removeStatusAtEnd = removeStatusAtEnd;
}
