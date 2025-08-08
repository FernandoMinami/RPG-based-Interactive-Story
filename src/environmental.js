/**
 * Modular Environmental System - Completely data-driven from story files
 * No hardcoded cases - all effects loaded dynamically from story configurations
 */

import { 
    applyBaseAttributeBoost, 
    removeBaseAttributeBoost,
    applyBaseAttributeDebuff,
    removeBaseAttributeDebuff
} from './special-effects.js';

/**
 * Load environmental data from story folder
 * @param {string} storyFolder - The story folder name
 * @returns {Promise<Object>} Environment data loaded from story files
 */
export async function loadStoryEnvironments(storyFolder) {
    try {
        // Load environmental effects manifest - handle different calling contexts with cache busting
        const cacheParam = `?v=${Date.now()}`;
        const manifestUrl = `../story-content/${storyFolder}/environmentalEffects/_environmentalEffects.json${cacheParam}`;
        const manifestResponse = await fetch(manifestUrl);
        
        if (!manifestResponse.ok) {
            console.warn(`No environmental effects found for story ${storyFolder}`);
            return {};
        }
        
        const environmentManifest = await manifestResponse.json();
        const environments = {};
        
        // Load each environment file with cache busting
        for (const envInfo of environmentManifest) {
            try {
                const envUrl = `../story-content/${storyFolder}/environmentalEffects/${envInfo.file}${cacheParam}`;
                const envResponse = await fetch(envUrl);
                
                if (envResponse.ok) {
                    const envData = await envResponse.json();
                    environments[envData.id || envData.type] = envData;
                }
            } catch (error) {
                console.warn(`Failed to load environment ${envInfo.file}:`, error.message);
            }
        }
        
        return environments;
    } catch (error) {
        console.warn(`Failed to load environments for story ${storyFolder}:`, error.message);
        return {};
    }
}

/**
 * Check if character type is immune to environmental effect
 * @param {string} characterType - The character's type
 * @param {Object} environmentData - Environment configuration from story files
 * @returns {boolean} True if character is immune
 */
export function isTypeImmune(characterType, environmentData) {
    // Check direct immunity
    if (environmentData.immuneType === characterType) {
        return true;
    }
    
    // Check type interactions for immunity (0 damage multiplier)
    if (environmentData.typeInteractions && environmentData.typeInteractions[characterType]) {
        const interaction = environmentData.typeInteractions[characterType];
        return interaction.environmentalDamageMultiplier === 0;
    }
    
    return false;
}

/**
 * Get type-specific multiplier for environmental effects
 * @param {string} characterType - The character's type
 * @param {Object} environmentData - Environment configuration from story files
 * @returns {number} Damage/effect multiplier for this type
 */
export function getTypeMultiplier(characterType, environmentData) {
    if (!environmentData.typeInteractions || !environmentData.typeInteractions[characterType]) {
        return 1.0; // Default multiplier
    }
    
    return environmentData.typeInteractions[characterType].environmentalDamageMultiplier || 1.0;
}

/**
 * Get type-specific description for environmental interaction
 * @param {string} characterType - The character's type
 * @param {Object} environmentData - Environment configuration from story files
 * @returns {string} Description of the type interaction
 */
export function getTypeInteractionDescription(characterType, environmentData) {
    if (!environmentData.typeInteractions || !environmentData.typeInteractions[characterType]) {
        return environmentData.effects?.description || environmentData.description || "";
    }
    
    return environmentData.typeInteractions[characterType].description || "";
}

/**
 * Process environmental damage based on intensity and type
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level (1-10)
 * @returns {Object} Damage information
 */
export function processEnvironmentalDamage(character, environmentData, intensity = 5) {
    // Check immunity first
    if (isTypeImmune(character.type, environmentData)) {
        return {
            damage: 0,
            damageType: null,
            isImmune: true,
            description: `${character.name} (${character.type} type) is immune to ${environmentData.name} effects!`
        };
    }
    
    let baseDamage = 0;
    let damageType = 'environmental';
    
    // Get damage from intensity levels (story-specific)
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelData = environmentData.intensityLevels[intensity];
        baseDamage = levelData.effects?.damage || 0;
        damageType = levelData.effects?.damageType || damageType;
    }
    // Fallback to base effects
    else if (environmentData.effects) {
        baseDamage = environmentData.effects.baseDamage || 0;
        damageType = environmentData.effects.damageType || damageType;
    }
    
    // Apply type multiplier
    const typeMultiplier = getTypeMultiplier(character.type, environmentData);
    const finalDamage = Math.floor(baseDamage * typeMultiplier);
    
    // Get description
    const description = getTypeInteractionDescription(character.type, environmentData);
    
    return {
        damage: Math.max(0, finalDamage),
        damageType,
        baseDamage,
        typeMultiplier,
        isImmune: false,
        description
    };
}

/**
 * Process environmental attribute changes
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level
 * @returns {Object} Attribute changes to apply
 */
export function processEnvironmentalAttributeChanges(character, environmentData, intensity = 5) {
    // Check immunity
    if (isTypeImmune(character.type, environmentData)) {
        return {
            attributeChanges: {},
            isImmune: true,
            description: `${character.name} is immune to ${environmentData.name} attribute effects!`
        };
    }
    
    const attributeChanges = {};
    let description = "";
    
    // Get attribute changes from intensity levels
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelData = environmentData.intensityLevels[intensity];
        if (levelData.effects?.attributeChanges) {
            Object.assign(attributeChanges, levelData.effects.attributeChanges);
            description = levelData.effects.message || levelData.description || "";
        }
    }
    // Check base effects
    else if (environmentData.effects?.attributeChanges) {
        Object.assign(attributeChanges, environmentData.effects.attributeChanges);
        description = environmentData.effects.description || "";
    }
    
    // Apply type multiplier to attribute changes
    const typeMultiplier = getTypeMultiplier(character.type, environmentData);
    for (const [attr, change] of Object.entries(attributeChanges)) {
        attributeChanges[attr] = Math.floor(change * typeMultiplier);
    }
    
    return {
        attributeChanges,
        isImmune: false,
        description: getTypeInteractionDescription(character.type, environmentData) || description
    };
}

/**
 * Process environmental combat penalties/bonuses
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level
 * @returns {Object} Combat modifiers to apply
 */
export function processEnvironmentalCombatModifiers(character, environmentData, intensity = 5) {
    // Check immunity
    if (isTypeImmune(character.type, environmentData)) {
        return {
            accuracyModifier: 0,
            damageModifier: 1.0,
            speedModifier: 1.0,
            isImmune: true
        };
    }
    
    let accuracyModifier = 0;
    let damageModifier = 1.0;
    let speedModifier = 1.0;
    
    // Get modifiers from intensity levels
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelEffects = environmentData.intensityLevels[intensity].effects;
        if (levelEffects) {
            accuracyModifier = -(levelEffects.accuracyPenalty || 0); // Make negative for penalty
            damageModifier = 1.0 - (levelEffects.damagePenalty || 0);
            speedModifier = 1.0 - (levelEffects.speedPenalty || 0);
        }
    }
    
    // Apply type-specific interactions
    if (environmentData.typeInteractions && character.type && environmentData.typeInteractions[character.type]) {
        const typeInteraction = environmentData.typeInteractions[character.type];
        
        if (typeInteraction.accuracyBonus) {
            accuracyModifier += typeInteraction.accuracyBonus;
        }
        if (typeInteraction.accuracyPenalty) {
            accuracyModifier -= typeInteraction.accuracyPenalty;
        }
        if (typeInteraction.speedBonus) {
            speedModifier *= (1 + typeInteraction.speedBonus);
        }
        if (typeInteraction.speedPenalty) {
            speedModifier *= (1 - typeInteraction.speedPenalty);
        }
        if (typeInteraction.damageBonus) {
            damageModifier *= (1 + typeInteraction.damageBonus);
        }
        if (typeInteraction.damageReduction) {
            damageModifier *= (1 - typeInteraction.damageReduction);
        }
    }
    
    // Apply combat modifiers (ability-specific)
    if (environmentData.combatModifiers) {
        for (const [abilityType, modifiers] of Object.entries(environmentData.combatModifiers)) {
            // Check if this applies to character's type or abilities
            if (abilityType.includes(character.type) || character.type === 'neutral') {
                if (modifiers.accuracyBonus) accuracyModifier += modifiers.accuracyBonus;
                if (modifiers.accuracyPenalty) accuracyModifier -= modifiers.accuracyPenalty;
                if (modifiers.damageBonus) damageModifier *= modifiers.damageBonus;
                if (modifiers.damageReduction) damageModifier *= modifiers.damageReduction;
            }
        }
    }
    
    return {
        accuracyModifier: Math.max(-1.0, Math.min(1.0, accuracyModifier)), // Cap between -100% and +100%
        damageModifier: Math.max(0.1, Math.min(3.0, damageModifier)), // Cap between 10% and 300%
        speedModifier: Math.max(0.1, Math.min(2.0, speedModifier)), // Cap between 10% and 200%
        isImmune: false
    };
}

/**
 * Process environmental status effects
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level
 * @returns {Object} Status effects to apply
 */
export function processEnvironmentalStatusEffects(character, environmentData, intensity = 5) {
    // Check immunity
    if (isTypeImmune(character.type, environmentData)) {
        return {
            statusEffects: [],
            isImmune: true
        };
    }
    
    const statusEffects = [];
    
    // Get status effects from intensity levels
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelEffects = environmentData.intensityLevels[intensity].effects;
        if (levelEffects?.statusType && levelEffects?.statusChance) {
            // Roll for status effect
            const roll = Math.random() * 100;
            if (roll < levelEffects.statusChance) {
                statusEffects.push({
                    type: levelEffects.statusType,
                    duration: levelEffects.statusDuration || 3,
                    intensity: levelEffects.statusIntensity || 1
                });
            }
        }
    }
    
    // Check base status effects
    if (environmentData.statusEffects) {
        for (const [statusId, statusData] of Object.entries(environmentData.statusEffects)) {
            const roll = Math.random();
            if (roll < (statusData.chance || 0)) {
                statusEffects.push({
                    type: statusId,
                    duration: statusData.duration || 3,
                    intensity: statusData.intensity || 1
                });
            }
        }
    }
    
    return {
        statusEffects,
        isImmune: false
    };
}

/**
 * Process special environmental mechanics (tripping, lightning, etc.)
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level
 * @returns {Object} Special effects that occurred
 */
export function processEnvironmentalSpecialEffects(character, environmentData, intensity = 5) {
    // Check immunity
    if (isTypeImmune(character.type, environmentData)) {
        return {
            specialEffects: [],
            specialDamage: 0,
            isImmune: true,
            attributeDebuffs: []
        };
    }
    
    const specialEffects = [];
    let specialDamage = 0;
    const attributeDebuffs = [];
    
    // Process attribute modifiers (environmental debuffs)
    if (environmentData.attributeModifiers) {
        for (const modifier of environmentData.attributeModifiers) {
            // Check if this modifier applies to the character's type
            let shouldApply = false;
            
            if (modifier.applicableTypes) {
                // Positive list - apply only to specified types
                shouldApply = modifier.applicableTypes.includes(character.type);
            } else if (modifier.excludedTypes) {
                // Negative list - apply to all except specified types
                shouldApply = !modifier.excludedTypes.includes(character.type);
            } else {
                // No type restrictions - apply to all
                shouldApply = true;
            }
            
            if (shouldApply) {
                // Apply the attribute debuff
                const debuffConfig = {
                    attributeName: modifier.attribute,
                    amount: modifier.amount,
                    duration: modifier.duration || 'conditional',
                    source: `Environmental: ${environmentData.name}`,
                    description: modifier.description || `${modifier.attribute} reduced by ${modifier.amount} due to environmental conditions`
                };
                
                applyBaseAttributeDebuff(character, debuffConfig);
                attributeDebuffs.push(debuffConfig);
                
                // Add message about the debuff
                const message = modifier.message || 
                    `${character.name}'s ${modifier.attribute} is reduced by ${modifier.amount} due to the ${environmentData.name.toLowerCase()} environment`;
                specialEffects.push(message);
            }
        }
    }
    
    // Get special effects from intensity levels
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelEffects = environmentData.intensityLevels[intensity].effects;
        
        // Tripping mechanic
        if (levelEffects?.trippingChance && levelEffects?.trippingDamage) {
            const roll = Math.random() * 100;
            if (roll < levelEffects.trippingChance) {
                specialDamage += levelEffects.trippingDamage;
                specialEffects.push(`${character.name} trips in the ${environmentData.name.toLowerCase()} and takes ${levelEffects.trippingDamage} damage!`);
            }
        }
        
        // Lightning strikes
        if (levelEffects?.lightningChance && levelEffects?.lightningDamage) {
            const roll = Math.random() * 100;
            if (roll < levelEffects.lightningChance) {
                const typeMultiplier = getTypeMultiplier(character.type, environmentData);
                const lightningDamage = Math.floor(levelEffects.lightningDamage * typeMultiplier);
                specialDamage += lightningDamage;
                specialEffects.push(`${character.name} is struck by lightning for ${lightningDamage} damage!`);
            }
        }
        
        // Falling rocks
        if (levelEffects?.fallingRocksChance && levelEffects?.fallingRocksDamage) {
            const roll = Math.random() * 100;
            if (roll < levelEffects.fallingRocksChance) {
                specialDamage += levelEffects.fallingRocksDamage;
                specialEffects.push(`Falling rocks hit ${character.name} for ${levelEffects.fallingRocksDamage} damage!`);
            }
        }
        
        // Any other custom special effects defined in the environment data
        if (levelEffects?.customEffects) {
            for (const effect of levelEffects.customEffects) {
                const roll = Math.random() * 100;
                if (roll < (effect.chance || 0)) {
                    if (effect.damage) {
                        const typeMultiplier = getTypeMultiplier(character.type, environmentData);
                        const effectDamage = Math.floor(effect.damage * typeMultiplier);
                        specialDamage += effectDamage;
                    }
                    if (effect.message) {
                        specialEffects.push(effect.message.replace('{character}', character.name).replace('{damage}', effect.damage || 0));
                    }
                }
            }
        }
    }
    
    return {
        specialEffects,
        specialDamage,
        isImmune: false,
        attributeDebuffs
    };
}

/**
 * Main function to process all environmental effects for a character
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level (1-10)
 * @returns {Object} Complete environmental effects data
 */
export function processAllEnvironmentalEffects(character, environmentData, intensity = 5) {
    if (!environmentData) {
        return {
            hasEffects: false,
            isImmune: false,
            damage: 0,
            attributeChanges: {},
            combatModifiers: { accuracyModifier: 0, damageModifier: 1.0, speedModifier: 1.0 },
            statusEffects: [],
            specialEffects: [],
            messages: []
        };
    }
    
    // Check for overall immunity
    const isImmune = isTypeImmune(character.type, environmentData);
    if (isImmune) {
        return {
            hasEffects: false,
            isImmune: true,
            damage: 0,
            attributeChanges: {},
            combatModifiers: { accuracyModifier: 0, damageModifier: 1.0, speedModifier: 1.0 },
            statusEffects: [],
            specialEffects: [],
            messages: [`${character.name} (${character.type} type) is immune to ${environmentData.name} effects!`]
        };
    }
    
    // Process all environmental effects
    const damageData = processEnvironmentalDamage(character, environmentData, intensity);
    const attributeData = processEnvironmentalAttributeChanges(character, environmentData, intensity);
    const combatData = processEnvironmentalCombatModifiers(character, environmentData, intensity);
    const statusData = processEnvironmentalStatusEffects(character, environmentData, intensity);
    const specialData = processEnvironmentalSpecialEffects(character, environmentData, intensity);
    
    // Collect all messages
    const messages = [];
    if (damageData.description) messages.push(damageData.description);
    if (attributeData.description) messages.push(attributeData.description);
    messages.push(...specialData.specialEffects);
    
    return {
        hasEffects: true,
        isImmune: false,
        
        // Damage
        damage: damageData.damage,
        damageType: damageData.damageType,
        
        // Attribute changes
        attributeChanges: attributeData.attributeChanges,
        
        // Combat modifiers
        combatModifiers: combatData,
        
        // Status effects
        statusEffects: statusData.statusEffects,
        
        // Special effects
        specialEffects: specialData.specialEffects,
        specialDamage: specialData.specialDamage,
        
        // Environmental attribute debuffs
        attributeDebuffs: specialData.attributeDebuffs || [],
        
        // Messages and metadata
        messages,
        environmentName: environmentData.name,
        intensity,
        
        // Raw data for advanced usage
        rawData: {
            damage: damageData,
            attributes: attributeData,
            combat: combatData,
            status: statusData,
            special: specialData
        }
    };
}

/**
 * Utility function to get environment message for display
 * @param {Object} character - The character object
 * @param {Object} environmentData - Environment configuration from story files
 * @param {number} intensity - Environment intensity level
 * @returns {string} Environment message for UI display
 */
export function getEnvironmentMessage(character, environmentData, intensity = 5) {
    if (!environmentData) return "";
    
    if (isTypeImmune(character.type, environmentData)) {
        return `${character.name} (${character.type} type) is immune to ${environmentData.name} effects!`;
    }
    
    // Get intensity-specific message
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelData = environmentData.intensityLevels[intensity];
        if (levelData.effects?.message) {
            return levelData.effects.message;
        }
        if (levelData.description) {
            return levelData.description;
        }
    }
    
    // Get type-specific message
    const typeDescription = getTypeInteractionDescription(character.type, environmentData);
    if (typeDescription) {
        return typeDescription;
    }
    
    // Fallback to general description
    return environmentData.description || `${character.name} is affected by the ${environmentData.name}.`;
}

/**
 * Remove environmental debuffs from a character when they leave an environment
 * @param {Object} character - The character object
 * @param {string} environmentName - Name of the environment being left
 */
export function removeEnvironmentalDebuffs(character, environmentName) {
    if (!character.statusEffects) {
        character.statusEffects = [];
    }
    
    // Remove debuffs that were applied by this environment
    const sourceToRemove = `Environmental: ${environmentName}`;
    
    // Find and remove environmental debuffs from the character's status effects
    character.statusEffects = character.statusEffects.filter(effect => {
        if (effect.source === sourceToRemove && effect.type === 'debuff') {
            // Remove the actual attribute debuff
            const debuffConfig = {
                attributeName: effect.attributeName,
                amount: effect.amount
            };
            removeBaseAttributeDebuff(character, debuffConfig);
            return false; // Remove this effect
        }
        return true; // Keep this effect
    });
}

/**
 * Legacy compatibility - simple environmental damage calculation
 * @param {Object} character - The character object
 * @param {string} environmentType - Environment type identifier
 * @param {number} intensity - Environment intensity
 * @param {Object} storyEnvironments - Loaded story environments
 * @returns {Object} Simple damage result
 */
export function calculateEnvironmentalDamage(character, environmentType, intensity = 5, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return { environmentalDamage: 0, description: "" };
    }
    
    const result = processEnvironmentalDamage(character, environmentData, intensity);
    return {
        environmentalDamage: result.damage,
        environmentalTypeDamage: result.damageType,
        description: result.description,
        hasImmunity: result.isImmune
    };
}

/**
 * Simple wrappers for story integration - these load environment data on demand
 */

/**
 * Get environmental damage for turn-based application
 * @param {Object} character - The character
 * @param {string} environmentType - Type of environment
 * @param {number} intensity - Intensity level
 * @param {Object} storyEnvironments - Loaded story environments
 * @returns {Object} Environmental damage information
 */
export function getEnvironmentalDamage(character, environmentType, intensity = 5, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return {
            damage: 0,
            statusChance: 0,
            statusType: null,
            description: `Unknown environment: ${environmentType}`,
            hasImmunity: false,
            isProtected: false
        };
    }
    
    const result = processAllEnvironmentalEffects(character, environmentData, intensity);
    
    return {
        damage: result.damage + result.specialDamage,
        statusChance: result.statusEffects.reduce((total, effect) => total + (effect.chance || 20), 0),
        statusType: result.statusEffects[0]?.type || null,
        description: result.messages.join(' '),
        hasImmunity: result.isImmune,
        isProtected: false, // Handled internally now
        environmentType,
        intensity
    };
}

/**
 * Get environmental stat penalties (accuracy, speed, damage reduction)
 * @param {Object} character - The character
 * @param {string} environmentType - Type of environment
 * @param {number} intensity - Intensity level
 * @param {Object} storyEnvironments - Loaded story environments
 * @returns {Object} Environmental penalties
 */
export function getEnvironmentalPenalties(character, environmentType, intensity = 5, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return {
            accuracyPenalty: 0,
            speedPenalty: 0,
            damagePenalty: 0,
            hasImmunity: false,
            isProtected: false
        };
    }
    
    const result = processAllEnvironmentalEffects(character, environmentData, intensity);
    
    return {
        accuracyPenalty: Math.abs(result.combatModifiers.accuracyModifier) * (result.combatModifiers.accuracyModifier < 0 ? 1 : 0),
        speedPenalty: (1.0 - result.combatModifiers.speedModifier),
        damagePenalty: (1.0 - result.combatModifiers.damageModifier),
        hasImmunity: result.isImmune,
        isProtected: false,
        environmentType,
        intensity
    };
}

/**
 * Get special environmental mechanics - now completely data-driven
 * @param {Object} character - The character
 * @param {string} environmentType - Type of environment
 * @param {number} intensity - Intensity level
 * @param {number} currentTurn - Current turn number (for turn-based effects)
 * @param {Object} storyEnvironments - Loaded story environments
 * @returns {Object} Special environmental effects
 */
export function getEnvironmentalSpecialEffects(character, environmentType, intensity = 5, currentTurn = 1, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return {
            specialDamage: 0,
            specialMessages: [],
            hasImmunity: false,
            isProtected: false
        };
    }
    
    const result = processEnvironmentalSpecialEffects(character, environmentData, intensity);
    
    // Handle turn-based effects if defined in environment data
    let additionalDamage = 0;
    const additionalMessages = [];
    
    if (environmentData.intensityLevels && environmentData.intensityLevels[intensity]) {
        const levelEffects = environmentData.intensityLevels[intensity].effects;
        
        // Breath loss mechanics
        if (levelEffects?.breathLoss && currentTurn >= (levelEffects.breathLoss.turnsBeforeDamage || 3)) {
            additionalDamage += levelEffects.breathLoss.damagePerTurn || 5;
            additionalMessages.push(`${character.name} loses ${levelEffects.breathLoss.damagePerTurn || 5} health from lack of air!`);
        }
        
        // Turn-based escalation
        if (levelEffects?.escalatingDamage) {
            const escalationDamage = Math.floor(levelEffects.escalatingDamage * Math.min(currentTurn, 10));
            additionalDamage += escalationDamage;
            if (escalationDamage > 0) {
                additionalMessages.push(`Environmental effects worsen! Additional ${escalationDamage} damage!`);
            }
        }
    }
    
    return {
        specialDamage: result.specialDamage + additionalDamage,
        specialMessages: [...result.specialEffects, ...additionalMessages],
        hasImmunity: result.isImmune,
        isProtected: false,
        environmentType,
        intensity,
        currentTurn
    };
}

/**
 * Calculate fall damage based on height, weight, and character type - now data-driven
 * @param {Object} character - The character falling
 * @param {number} height - Fall height in meters
 * @param {Object} typeData - Character type data (loaded from story)
 * @returns {Object} Damage information and type effectiveness
 */
export function calculateFallDamage(character, height, typeData = null) {
    // Base fall damage formula: (height^1.5 * weight/100) for realism
    const baseDamage = Math.floor(Math.pow(height, 1.5) * ((character.weight || 70) / 100));
    
    let finalDamage = baseDamage;
    let effectDescription = "";
    let typeModifier = 1.0;
    
    // Apply type-based environmental effects if type data is provided
    if (typeData && typeData.environmentalEffects) {
        // Check for fall-specific effects
        if (typeData.environmentalEffects.falling) {
            typeModifier = typeData.environmentalEffects.falling.damageMultiplier || 1.0;
            effectDescription = typeData.environmentalEffects.falling.description || "";
        }
        // Check for flying/air immunity
        else if (typeData.environmentalEffects.flying) {
            typeModifier = typeData.environmentalEffects.flying.damageMultiplier || 0.2;
            effectDescription = typeData.environmentalEffects.flying.description || "Naturally airborne - greatly reduces fall damage!";
        }
        // Check general environment resistances
        else if (typeData.environmentalEffects.physical) {
            typeModifier = typeData.environmentalEffects.physical.damageMultiplier || 1.0;
            effectDescription = typeData.environmentalEffects.physical.description || "";
        }
    }
    
    finalDamage = Math.floor(finalDamage * typeModifier);
    
    return {
        baseDamage,
        finalDamage,
        typeModifier,
        effectDescription,
        height,
        characterType: character.type || "neutral"
    };
}

/**
 * Main interface for battle system - loads story environments and processes effects
 * @param {Object} character - The character
 * @param {string} environmentType - Environment type
 * @param {number} intensity - Intensity level
 * @param {number} currentTurn - Current turn (for special effects)
 * @param {Object} storyEnvironments - Pre-loaded story environments
 * @returns {Object} All environmental data needed for gameplay
 */
export function getEnvironmentalEffectsForBattle(character, environmentType, intensity = 5, currentTurn = 1, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return {
            environmentalDamage: 0,
            environmentalTypeDamage: 'neutral',
            statusChance: 0,
            statusType: null,
            accuracyPenalty: 0,
            speedPenalty: 0,
            damagePenalty: 0,
            specialDamage: 0,
            specialMessages: [],
            hasImmunity: false,
            isProtected: false,
            allMessages: [`Unknown environment: ${environmentType}`]
        };
    }
    
    const allEffects = processAllEnvironmentalEffects(character, environmentData, intensity);
    const specialEffects = getEnvironmentalSpecialEffects(character, environmentType, intensity, currentTurn, storyEnvironments);
    
    return {
        // Direct damage per turn
        environmentalDamage: allEffects.damage,
        environmentalTypeDamage: allEffects.damageType || environmentType,
        
        // Status effects
        statusChance: allEffects.statusEffects.reduce((total, effect) => total + (effect.chance || 20), 0),
        statusType: allEffects.statusEffects[0]?.type || null,
        
        // Stat penalties
        accuracyPenalty: Math.abs(allEffects.combatModifiers.accuracyModifier) * (allEffects.combatModifiers.accuracyModifier < 0 ? 1 : 0),
        speedPenalty: Math.max(0, 1.0 - allEffects.combatModifiers.speedModifier),
        damagePenalty: Math.max(0, 1.0 - allEffects.combatModifiers.damageModifier),
        
        // Special mechanics
        specialDamage: specialEffects.specialDamage,
        specialMessages: specialEffects.specialMessages,
        
        // Meta information
        hasImmunity: allEffects.isImmune,
        isProtected: false,
        allMessages: [...allEffects.messages, ...specialEffects.specialMessages],
        
        // Raw data for advanced usage
        rawEffectsData: allEffects,
        rawSpecialData: specialEffects
    };
}

/**
 * Simplified function for story scenarios - just get environmental damage
 * @param {Object} character - The character
 * @param {string} environmentType - Environment type
 * @param {number} intensity - Intensity level
 * @param {Object} storyEnvironments - Pre-loaded story environments
 * @returns {Object} Simple environmental damage for story events
 */
export function getEnvironmentalDamageForStory(character, environmentType, intensity = 5, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return {
            environmentalDamage: 0,
            environmentalTypeDamage: 'neutral',
            description: `Unknown environment: ${environmentType}`,
            hasImmunity: false,
            isProtected: false
        };
    }
    
    const effects = processAllEnvironmentalEffects(character, environmentData, intensity);
    
    return {
        environmentalDamage: effects.damage + effects.specialDamage,
        environmentalTypeDamage: effects.damageType || environmentType,
        description: effects.messages.join(' '),
        hasImmunity: effects.isImmune,
        isProtected: false
    };
}

/**
 * Check if environment is active and valid
 * @param {string} environmentType - Environment type to check
 * @param {Object} storyEnvironments - Story environments data
 * @returns {boolean} Whether environment exists
 */
export function isValidEnvironment(environmentType, storyEnvironments = {}) {
    return storyEnvironments.hasOwnProperty(environmentType);
}

/**
 * Get list of all available environments for a story
 * @param {Object} storyEnvironments - Story environments data
 * @returns {Array} List of environment names
 */
export function getAvailableEnvironments(storyEnvironments = {}) {
    return Object.keys(storyEnvironments);
}

/**
 * Get environment display name
 * @param {string} environmentType - Environment type
 * @param {Object} storyEnvironments - Story environments data
 * @returns {string} Display name
 */
export function getEnvironmentDisplayName(environmentType, storyEnvironments = {}) {
    return storyEnvironments[environmentType]?.name || environmentType;
}

/**
 * Modular scenario handler - processes story-specific environmental scenarios
 * @param {Object} character - The character
 * @param {string} scenarioId - The scenario identifier
 * @param {Object} storyEnvironments - Story environments data
 * @param {Object} additionalData - Additional scenario data (height for falls, etc.)
 * @returns {Object} Environmental interaction result
 */
export function handleEnvironmentalScenario(character, scenarioId, storyEnvironments = {}, additionalData = {}) {
    // Try to find scenario in story environments first
    const scenarioData = storyEnvironments[scenarioId];
    
    if (scenarioData) {
        // Use story-defined environmental scenario
        const effects = processAllEnvironmentalEffects(character, scenarioData, additionalData.intensity || 5);
        
        return {
            type: "environmental",
            damage: effects.damage + effects.specialDamage,
            statusEffects: effects.statusEffects,
            attributeChanges: effects.attributeChanges,
            flavorText: effects.messages.join(' ') || scenarioData.description,
            environmentName: scenarioData.name
        };
    }
    
    // Handle special built-in scenarios
    switch(scenarioId) {
        case "cliff_fall":
        case "fall_damage":
            const fallHeight = additionalData.height || 10;
            const typeData = additionalData.typeData || null;
            const fallDamage = calculateFallDamage(character, fallHeight, typeData);
            return {
                type: "fall_damage",
                damage: fallDamage.finalDamage,
                baseDamage: fallDamage.baseDamage,
                typeModifier: fallDamage.typeModifier,
                flavorText: fallDamage.effectDescription || `You fall ${fallHeight} meters!`,
                height: fallHeight
            };
            
        default:
            return {
                type: "none",
                damage: 0,
                flavorText: `Unknown environmental scenario: ${scenarioId}`
            };
    }
}

/**
 * Legacy compatibility functions - now data-driven but maintaining same interface
 */

/**
 * Apply environmental healing or regeneration - now loads from story data
 * @param {Object} character - The character
 * @param {string} environmentType - Type of environment
 * @param {Object} storyEnvironments - Story environments data
 * @returns {Object} Healing information
 */
export function calculateEnvironmentalHealing(character, environmentType, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    
    if (!environmentData) {
        return {
            healingAmount: 0,
            description: "",
            environmentType,
            characterType: character.type
        };
    }
    
    // Check for healing effects in environment data
    let healingAmount = 0;
    let description = "";
    
    if (environmentData.effects?.healing) {
        healingAmount = environmentData.effects.healing;
        description = `${character.name} gains ${healingAmount} health from the ${environmentData.name}!`;
    }
    
    // Check type-specific healing bonuses
    if (environmentData.typeInteractions && environmentData.typeInteractions[character.type]) {
        const typeInteraction = environmentData.typeInteractions[character.type];
        if (typeInteraction.healingBonus) {
            healingAmount += typeInteraction.healingBonus;
            description = typeInteraction.description || description;
        }
    }
    
    return {
        healingAmount: Math.max(0, healingAmount),
        description,
        environmentType,
        characterType: character.type
    };
}

/**
 * Check if character gets environmental status effects - now data-driven
 * @param {Object} character - The character
 * @param {string} environmentType - Type of environment
 * @param {Object} storyEnvironments - Story environments data
 * @returns {Array} Array of status effects to apply
 */
export function getEnvironmentalStatusEffects(character, environmentType, storyEnvironments = {}) {
    const environmentData = storyEnvironments[environmentType];
    
    if (!environmentData) {
        return [];
    }
    
    const effects = processEnvironmentalStatusEffects(character, environmentData);
    return effects.statusEffects;
}

/**
 * Check if character has environmental protection items - now story-agnostic
 * @param {Object} character - The character to check
 * @param {string} environmentType - The environment type
 * @param {Object} storyEnvironments - Story environments data
 * @returns {Object} Protection information
 */
export function checkEnvironmentalProtection(character, environmentType, storyEnvironments = {}) {
    if (!character.inventory || character.inventory.length === 0) {
        return { isProtected: false, description: "", item: null };
    }
    
    const environmentData = storyEnvironments[environmentType];
    if (!environmentData) {
        return { isProtected: false, description: "", item: null };
    }
    
    const protectionItems = environmentData.protectionItems || [];
    
    for (const protectionItem of protectionItems) {
        const hasItem = character.inventory.some(item => 
            item.name === protectionItem.name || 
            (item.displayName && item.displayName === protectionItem.name) ||
            item.id === protectionItem.id
        );
        
        if (hasItem) {
            let description = "";
            if (protectionItem.protection === "full") {
                description = `${protectionItem.name} provides complete protection from ${environmentData.name} effects!`;
            } else if (protectionItem.protection === "partial") {
                description = `${protectionItem.name} provides partial protection from ${environmentData.name} effects!`;
            } else {
                description = `${protectionItem.name} provides temporary protection from ${environmentData.name} effects!`;
            }
            
            return {
                isProtected: protectionItem.protection === "full",
                description,
                item: protectionItem
            };
        }
    }
    
    return { isProtected: false, description: "", item: null };
}