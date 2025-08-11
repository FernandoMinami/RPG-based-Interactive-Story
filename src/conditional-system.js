// conditional-system.js - Advanced conditional choices and random encounter system

import { hasItem, hasLoot } from './inventory.js';
import { getAbility } from './abilities.js';

/**
 * Check if a player meets attribute requirements
 * @param {Object} player - Player object
 * @param {Object} requirements - Attribute requirements object
 * @returns {boolean} - True if requirements are met
 */
export function checkAttributeRequirements(player, requirements) {
    if (!requirements || !player.attributes) return true;
    
    for (const [attribute, minValue] of Object.entries(requirements)) {
        if (player.attributes[attribute] < minValue) {
            return false;
        }
    }
    return true;
}

/**
 * Check if a player meets physical characteristics requirements
 * @param {Object} player - Player object
 * @param {Object} requirements - Physical requirements object
 * @returns {boolean|string} - True if requirements are met, or rejection reason string
 */
export function checkPhysicalRequirements(player, requirements) {
    if (!requirements) return true;
    
    // Height requirements (in cm)
    if (requirements.height) {
        if (requirements.height.min && player.height < requirements.height.min) {
            return `You are too short (${player.height}cm, minimum ${requirements.height.min}cm required)`;
        }
        if (requirements.height.max && player.height > requirements.height.max) {
            return `You are too tall (${player.height}cm, maximum ${requirements.height.max}cm allowed)`;
        }
    }
    
    // Weight requirements (in kg)
    if (requirements.weight) {
        if (requirements.weight.min && player.weight < requirements.weight.min) {
            return `You are too light (${player.weight}kg, minimum ${requirements.weight.min}kg required)`;
        }
        if (requirements.weight.max && player.weight > requirements.weight.max) {
            return `You are too heavy (${player.weight}kg, maximum ${requirements.weight.max}kg allowed)`;
        }
    }
    
    return true;
}

/**
 * Check if a player meets race/type requirements
 * @param {Object} player - Player object
 * @param {Object} requirements - Race/type requirements object
 * @returns {boolean|string} - True if requirements are met, or rejection reason string
 */
export function checkRaceTypeRequirements(player, requirements) {
    if (!requirements) return true;
    
    // Race acceptance/rejection
    if (requirements.acceptedRaces && !requirements.acceptedRaces.includes(player.race)) {
        return `Your race (${player.race}) is not welcome here`;
    }
    
    if (requirements.rejectedRaces && requirements.rejectedRaces.includes(player.race)) {
        return `Your race (${player.race}) is not allowed here`;
    }
    
    // Type acceptance/rejection
    if (requirements.acceptedTypes && !requirements.acceptedTypes.includes(player.type)) {
        return `Your type (${player.type}) is not welcome here`;
    }
    
    if (requirements.rejectedTypes && requirements.rejectedTypes.includes(player.type)) {
        return `Your type (${player.type}) is not allowed here`;
    }
    
    return true;
}

/**
 * Check if a player meets quest requirements
 * @param {Object} player - Player object
 * @param {Object} requirements - Quest requirements object
 * @returns {boolean} - True if requirements are met
 */
export function checkQuestRequirements(player, requirements) {
    if (!requirements) return true;
    
    // Initialize quest tracking if it doesn't exist
    if (!player.completedQuests) player.completedQuests = [];
    if (!player.activeQuests) player.activeQuests = [];
    
    // Required completed quests
    if (requirements.completedQuests) {
        for (const questId of requirements.completedQuests) {
            if (!player.completedQuests.includes(questId)) {
                return false;
            }
        }
    }
    
    // Required active quests
    if (requirements.activeQuests) {
        for (const questId of requirements.activeQuests) {
            if (!player.activeQuests.includes(questId)) {
                return false;
            }
        }
    }
    
    // Forbidden completed quests (choice only available if quest NOT completed)
    if (requirements.forbiddenCompletedQuests) {
        for (const questId of requirements.forbiddenCompletedQuests) {
            if (player.completedQuests.includes(questId)) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Check if a player meets item requirements
 * @param {Object} player - Player object
 * @param {Object} requirements - Item requirements object
 * @returns {boolean} - True if requirements are met
 */
export function checkItemRequirements(player, requirements) {
    if (!requirements) return true;
    
    // Required items
    if (requirements.items) {
        for (const itemId of requirements.items) {
            if (!hasItem(itemId)) {
                return false;
            }
        }
    }
    
    // Required loot items
    if (requirements.loot) {
        for (const lootId of requirements.loot) {
            if (!hasLoot(lootId)) {
                return false;
            }
        }
    }
    
    // Required equipped items
    if (requirements.equippedItems) {
        for (const [slot, itemId] of Object.entries(requirements.equippedItems)) {
            if (!player.equipment[slot] || player.equipment[slot].id !== itemId) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Check if a player meets ability requirements
 * @param {Object} player - Player object
 * @param {Object} requirements - Ability requirements object
 * @returns {boolean} - True if requirements are met
 */
export function checkAbilityRequirements(player, requirements) {
    if (!requirements) return true;
    
    // Get player's abilities from the registry
    const playerAbilities = [];
    if (player.abilityIds) {
        for (const abilityId of player.abilityIds) {
            const ability = getAbility(abilityId);
            if (ability) {
                playerAbilities.push(ability);
            }
        }
    }
    
    // Check specific ability ID requirements
    if (requirements.id) {
        const requiredIds = Array.isArray(requirements.id) ? requirements.id : [requirements.id];
        for (const requiredId of requiredIds) {
            if (!player.abilityIds || !player.abilityIds.includes(requiredId)) {
                return false;
            }
        }
    }
    
    // Check elemental type requirements
    if (requirements.elementalType) {
        const requiredTypes = Array.isArray(requirements.elementalType) ? requirements.elementalType : [requirements.elementalType];
        let hasRequiredType = false;
        
        for (const requiredType of requiredTypes) {
            for (const ability of playerAbilities) {
                if (ability.elementalType === requiredType) {
                    hasRequiredType = true;
                    break;
                }
            }
            if (hasRequiredType) break;
        }
        
        if (!hasRequiredType) {
            return false;
        }
    }
    
    // Check range requirements
    if (requirements.range) {
        const requiredRanges = Array.isArray(requirements.range) ? requirements.range : [requirements.range];
        let hasRequiredRange = false;
        
        for (const requiredRange of requiredRanges) {
            for (const ability of playerAbilities) {
                if (ability.range === requiredRange) {
                    hasRequiredRange = true;
                    break;
                }
            }
            if (hasRequiredRange) break;
        }
        
        if (!hasRequiredRange) {
            return false;
        }
    }
    
    // Check damage type requirements
    if (requirements.damageType) {
        const requiredDamageTypes = Array.isArray(requirements.damageType) ? requirements.damageType : [requirements.damageType];
        let hasRequiredDamageType = false;
        
        for (const requiredDamageType of requiredDamageTypes) {
            for (const ability of playerAbilities) {
                if (ability.damageType === requiredDamageType) {
                    hasRequiredDamageType = true;
                    break;
                }
            }
            if (hasRequiredDamageType) break;
        }
        
        if (!hasRequiredDamageType) {
            return false;
        }
    }
    
    return true;
}

/**
 * Check if a choice should be visible to the player
 * @param {Object} choice - Choice object
 * @param {Object} player - Player object
 * @returns {boolean} - True if choice should be visible
 */
export function isChoiceVisible(choice, player) {
    // Existing filters
    if (choice.character && choice.character !== player.id) return false;
    if (choice.requiredRace && choice.requiredRace !== player.race) return false;
    
    // New requirement filters
    if (choice.requirements) {
        const req = choice.requirements;
        
        // Attribute requirements
        if (!checkAttributeRequirements(player, req.attributes)) return false;
        
        // Physical requirements
        const physicalCheck = checkPhysicalRequirements(player, req.physical);
        if (physicalCheck !== true) return false;
        
        // Race/type requirements
        const raceTypeCheck = checkRaceTypeRequirements(player, req.raceType);
        if (raceTypeCheck !== true) return false;
        
        // Quest requirements
        if (!checkQuestRequirements(player, req.quests)) return false;
        
        // Item requirements
        if (!checkItemRequirements(player, req.inventory)) return false;
        
        // Ability requirements
        if (!checkAbilityRequirements(player, req.abilities)) return false;
    }
    
    return true;
}

/**
 * Get rejection message for a choice that would be rejected
 * @param {Object} choice - Choice object
 * @param {Object} player - Player object
 * @returns {string|null} - Rejection message or null if choice is available
 */
export function getChoiceRejectionMessage(choice, player) {
    if (!choice.requirements) return null;
    
    const req = choice.requirements;
    
    // Physical requirements return specific messages
    if (req.physical) {
        const physicalCheck = checkPhysicalRequirements(player, req.physical);
        if (physicalCheck !== true) return physicalCheck;
    }
    
    // Race/type requirements return specific messages
    if (req.raceType) {
        const raceTypeCheck = checkRaceTypeRequirements(player, req.raceType);
        if (raceTypeCheck !== true) return raceTypeCheck;
    }
    
    return null;
}

/**
 * Process random encounter nodes within a scenario
 * @param {Object} node - Current story node
 * @param {Object} player - Player object
 * @returns {Object|null} - Random encounter node or null
 */
export function processRandomEncounterNodes(node, player) {
    if (!node.randomEncounters) return null;
    
    for (const encounter of node.randomEncounters) {
        // Check if encounter should trigger
        const chance = encounter.chance || 10; // Default 10% chance
        if (Math.random() * 100 > chance) continue;
        
        // Check if player meets encounter requirements
        if (encounter.requirements) {
            if (!checkAttributeRequirements(player, encounter.requirements.attributes)) continue;
            if (!checkQuestRequirements(player, encounter.requirements.quests)) continue;
            if (!checkItemRequirements(player, encounter.requirements.inventory)) continue;
            if (!checkAbilityRequirements(player, encounter.requirements.abilities)) continue;
            
            const physicalCheck = checkPhysicalRequirements(player, encounter.requirements.physical);
            if (physicalCheck !== true) continue;
            
            const raceTypeCheck = checkRaceTypeRequirements(player, encounter.requirements.raceType);
            if (raceTypeCheck !== true) continue;
        }
        
        // Encounter triggered! Return the encounter node
        return {
            title: encounter.title,
            text: encounter.text,
            choices: encounter.choices || [],
            items: encounter.items,
            life: encounter.life,
            mana: encounter.mana,
            exp: encounter.exp,
            encounter: true // Mark as encounter node
        };
    }
    
    return null;
}

/**
 * Quest management functions
 */
export function startQuest(player, questId) {
    if (!player.activeQuests) player.activeQuests = [];
    if (!player.activeQuests.includes(questId)) {
        player.activeQuests.push(questId);
    }
}

export function completeQuest(player, questId) {
    if (!player.completedQuests) player.completedQuests = [];
    if (!player.completedQuests.includes(questId)) {
        player.completedQuests.push(questId);
    }
    
    // Remove from active quests
    if (player.activeQuests) {
        const index = player.activeQuests.indexOf(questId);
        if (index > -1) {
            player.activeQuests.splice(index, 1);
        }
    }
}

export function isQuestActive(player, questId) {
    return player.activeQuests && player.activeQuests.includes(questId);
}

export function isQuestCompleted(player, questId) {
    return player.completedQuests && player.completedQuests.includes(questId);
}

/**
 * Profession system (for future expansion)
 */
export function addProfession(player, professionId) {
    if (!player.professions) player.professions = [];
    if (!player.professions.includes(professionId)) {
        player.professions.push(professionId);
    }
}

export function hasProfession(player, professionId) {
    return player.professions && player.professions.includes(professionId);
}
