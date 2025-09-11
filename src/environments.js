/**
 * Environmental Effects System - Complete rebuild with modular design
 * 
 * This system handles all environmental effects in the game, including:
 * - Random damage events (thunder, falling rocks, etc.)
 * - Attribute modifications (accuracy decreases, speed penalties, etc.)
 * - Ability effectiveness changes (fire attacks in volcanic areas, etc.)
 * - Status effect application (burning in volcanic areas, etc.)
 * - Intensity-based scaling (1-10 intensity levels)
 * - Elemental immunity to environmental effects
 */

// Import required systems
import { addStatus, removeStatus } from './status.js';
import { applyDamageWithImmunity } from './special-effects.js';
import { getPrimaryElementalAlignment } from './type-helpers.js';
import { applyPrimaryAttributeBoost, applySecondaryAttributeBoost, 
         removePrimaryAttributeBoost, removeSecondaryAttributeBoost } from './special-effects.js';

// Global environment registry
let environments = {};
let activeEnvironment = null;
let environmentEffectsRegistry = new Map(); // Track active environmental effects per character

/**
 * Load environment data from story folder
 * @param {string} storyFolder - The story folder path
 */
export async function loadEnvironments(storyFolder) {
    try {
        // Use different paths depending on the calling context
        const isTestContext = window.location.pathname.includes('/tests/');
        const manifestPath = isTestContext 
            ? `../../story-content/${storyFolder}/environmentalEffects.json`
            : `../story-content/${storyFolder}/environmentalEffects.json`;
        console.log(`🔧 DEBUG: Attempting to load environmental effects from: ${manifestPath}`);
        const response = await fetch(manifestPath);
        
        if (!response.ok) {
            console.warn('No environmental effects manifest found, using default environments');
            environments = getDefaultEnvironments();
            return;
        }
        
        const manifest = await response.json();
        environments = {};
        
        // Load each environment file
        for (const envDef of manifest) {
            try {
                // Use context-aware path resolution for individual environment files
                const envPath = isTestContext 
                    ? `../../story-content/${storyFolder}/environmentalEffects/${envDef.file}`
                    : `../story-content/${storyFolder}/environmentalEffects/${envDef.file}`;
                console.log(`🔧 DEBUG: Loading environment file: ${envPath}`);
                const envResponse = await fetch(envPath);
                if (envResponse.ok) {
                    const envData = await envResponse.json();
                    environments[envDef.id] = envData;
                    console.log(`✅ Loaded environment: ${envDef.id}`);
                } else {
                    console.warn(`❌ Failed to load environment ${envDef.id}: ${envResponse.status}`);
                }
            } catch (error) {
                console.warn(`Failed to load environment ${envDef.id}:`, error);
            }
        }
        
        console.log(`Loaded ${Object.keys(environments).length} environments`);
    } catch (error) {
        console.warn('Failed to load environments, using defaults:', error);
        environments = getDefaultEnvironments();
    }
}

/**
 * Get default environment configurations
 */
function getDefaultEnvironments() {
    return {
        neutral: {
            id: "neutral",
            name: "Neutral Environment",
            description: "A balanced environment with no special effects",
            icon: "🌍",
            immuneElements: [],
            effects: {},
            intensityLevels: {}
        },
        volcanic: {
            id: "volcanic",
            name: "Volcanic Environment",
            description: "Intense heat, lava flows, and sulfurous gases",
            icon: "🌋",
            immuneElements: ["fire"],
            effects: {
                randomDamage: {
                    damageType: "fire",
                    baseChance: 25,
                    baseDamage: 10,
                    description: "volcanic heat"
                },
                statusEffects: [
                    { statusId: "burning", chance: 20, duration: 3 }
                ],
                abilityModifiers: {
                    fire: { damageMultiplier: 1.5, accuracyMultiplier: 1.2 },
                    ice: { damageMultiplier: 0.3, accuracyMultiplier: 0.7 },
                    water: { damageMultiplier: 0.5, accuracyMultiplier: 0.8 }
                }
            },
            intensityLevels: {
                1: { damageMultiplier: 0.3, chanceMultiplier: 0.5 },
                5: { damageMultiplier: 1.0, chanceMultiplier: 1.0 },
                10: { damageMultiplier: 2.0, chanceMultiplier: 2.0 }
            }
        },
        underwater: {
            id: "underwater",
            name: "Underwater Environment",
            description: "Deep water with limited air and pressure",
            icon: "🌊",
            immuneElements: ["water"],
            effects: {
                randomDamage: {
                    damageType: "water",
                    baseChance: 15,
                    baseDamage: 5,
                    description: "water pressure"
                },
                attributeModifiers: {
                    primary: [
                        { attribute: "dexterity", amount: -3, description: "water resistance" }
                    ],
                    secondary: [
                        { attribute: "speed", amount: -5, description: "movement penalty underwater" }
                    ]
                },
                abilityModifiers: {
                    fire: { damageMultiplier: 0.2, accuracy: "always_miss" },
                    water: { damageMultiplier: 1.4, accuracyMultiplier: 1.3 },
                    lightning: { damageMultiplier: 1.6, accuracyMultiplier: 1.1 }
                }
            },
            intensityLevels: {
                1: { damageMultiplier: 0.4, attributeMultiplier: 0.5 },
                5: { damageMultiplier: 1.0, attributeMultiplier: 1.0 },
                10: { damageMultiplier: 1.8, attributeMultiplier: 2.0 }
            }
        },
        storm: {
            id: "storm",
            name: "Storm Environment",
            description: "Lightning, thunder, and powerful winds",
            icon: "⛈️",
            immuneElements: ["lightning", "air"],
            effects: {
                randomDamage: {
                    damageType: "lightning",
                    baseChance: 30,
                    baseDamage: 12,
                    description: "lightning strikes"
                },
                attributeModifiers: {
                    primary: [
                        { attribute: "dexterity", amount: -2, description: "wind interference" }
                    ]
                },
                statusEffects: [
                    { statusId: "paralyzed", chance: 15, duration: 2 }
                ],
                abilityModifiers: {
                    lightning: { damageMultiplier: 1.6, accuracyMultiplier: 1.2 },
                    air: { damageMultiplier: 1.3, accuracyMultiplier: 1.1 },
                    earth: { accuracyMultiplier: 0.8 }
                }
            },
            intensityLevels: {
                1: { damageMultiplier: 0.4, chanceMultiplier: 0.6 },
                5: { damageMultiplier: 1.0, chanceMultiplier: 1.0 },
                10: { damageMultiplier: 2.2, chanceMultiplier: 1.8 }
            }
        },
        arctic: {
            id: "arctic",
            name: "Arctic Environment", 
            description: "Extreme cold with ice and snow",
            icon: "❄️",
            immuneElements: ["ice", "water"],
            effects: {
                randomDamage: {
                    damageType: "ice",
                    baseChance: 20,
                    baseDamage: 6,
                    description: "freezing cold"
                },
                attributeModifiers: {
                    primary: [
                        { attribute: "dexterity", amount: -2, description: "cold stiffness" }
                    ],
                    secondary: [
                        { attribute: "speed", amount: -3, description: "icy terrain" }
                    ]
                },
                statusEffects: [
                    { statusId: "slowed", chance: 25, duration: 3 }
                ],
                abilityModifiers: {
                    ice: { damageMultiplier: 1.5, accuracyMultiplier: 1.2 },
                    fire: { damageMultiplier: 0.7, accuracyMultiplier: 0.9 },
                    water: { damageMultiplier: 1.2, accuracyMultiplier: 1.1 }
                }
            },
            intensityLevels: {
                1: { damageMultiplier: 0.4, attributeMultiplier: 0.5 },
                5: { damageMultiplier: 1.0, attributeMultiplier: 1.0 },
                10: { damageMultiplier: 1.8, attributeMultiplier: 1.6 }
            }
        },
        cave: {
            id: "cave",
            name: "Cave Environment",
            description: "Dark underground caverns with poor visibility",
            icon: "🕳️",
            immuneElements: ["earth"],
            effects: {
                randomDamage: {
                    damageType: "physical",
                    baseChance: 20,
                    baseDamage: 8,
                    description: "falling rocks"
                },
                attributeModifiers: {
                    primary: [
                        { attribute: "dexterity", amount: -4, description: "poor visibility" }
                    ]
                },
                abilityModifiers: {
                    light: { damageMultiplier: 1.5, accuracyMultiplier: 1.3 },
                    dark: { damageMultiplier: 1.2, accuracyMultiplier: 1.1 },
                    earth: { damageMultiplier: 1.3, accuracyMultiplier: 1.2 }
                }
            },
            intensityLevels: {
                1: { damageMultiplier: 0.5, attributeMultiplier: 0.4 },
                5: { damageMultiplier: 1.0, attributeMultiplier: 1.0 },
                10: { damageMultiplier: 1.6, attributeMultiplier: 1.8 }
            }
        }
    };
}

/**
 * Set the active environment
 * @param {string} environmentId - Environment ID to activate
 * @param {number} intensity - Intensity level (1-10)
 * @param {Function} addLog - Logging function
 */
export function setActiveEnvironment(environmentId, intensity = 5, addLog = () => {}) {
    const environment = environments[environmentId];
    if (!environment) {
        addLog(`Unknown environment: ${environmentId}`);
        return false;
    }
    
    const clampedIntensity = Math.max(1, Math.min(10, intensity));
    
    activeEnvironment = {
        ...environment,
        currentIntensity: clampedIntensity
    };
    
    // Extract effects for the current intensity level from story environment files
    if (environment.intensityLevels) {
        let foundEffects = null;
        
        // First try exact match
        if (environment.intensityLevels[clampedIntensity]) {
            foundEffects = environment.intensityLevels[clampedIntensity].effects;
        } else {
            // Try range-based matching (e.g., "7-9", "4-6")
            for (const [key, levelData] of Object.entries(environment.intensityLevels)) {
                if (key.includes('-')) {
                    const [min, max] = key.split('-').map(Number);
                    if (clampedIntensity >= min && clampedIntensity <= max) {
                        foundEffects = levelData.effects;
                        break;
                    }
                }
            }
        }
        
        if (foundEffects) {
            activeEnvironment.effects = foundEffects;
        } else if (!activeEnvironment.effects) {
            activeEnvironment.effects = {};
        }
    } else if (!activeEnvironment.effects) {
        // Fallback for environments without proper effects structure
        activeEnvironment.effects = {};
    }
    
    addLog(`Environment changed to ${environment.name} (Intensity: ${activeEnvironment.currentIntensity})`);
    return true;
}

/**
 * Get the current active environment
 */
export function getActiveEnvironment() {
    return activeEnvironment;
}

/**
 * Check if a character is immune to environmental effects
 * @param {Object} character - Character to check
 * @param {Object} environment - Environment configuration
 * @returns {boolean} True if character is immune
 */
export function isCharacterImmuneToEnvironment(character, environment = null) {
    const env = environment || activeEnvironment;
    if (!env) return false;
    
    const primaryElement = getPrimaryElementalAlignment(character);
    
    // Check both old structure (immuneElements array) and new structure (immuneType string)
    if (env.immuneElements && env.immuneElements.includes(primaryElement)) {
        return true;
    }
    
    if (env.immuneType && env.immuneType === primaryElement) {
        return true;
    }
    
    return false;
}

/**
 * Apply environmental effects to a character during their turn
 * @param {Object} character - Character to apply effects to
 * @param {Function} addLog - Logging function
 */
export function applyEnvironmentalEffects(character, addLog = () => {}) {
    if (!activeEnvironment || !character) return;
    
    // Check immunity
    if (isCharacterImmuneToEnvironment(character)) {
        addLog(`${character.name} is immune to ${activeEnvironment.name} effects!`);
        return;
    }
    
    const characterId = getCharacterId(character);
    const intensity = activeEnvironment.currentIntensity;
    const effects = activeEnvironment.effects;
    
    // Apply random damage events - handle both old and new structure
    if (effects.randomDamage) {
        // Old structure (hardcoded environments)
        applyRandomDamageEvent(character, effects.randomDamage, intensity, addLog);
    } else if (effects.damage) {
        // New structure (story environment files) - convert to compatible format
        const damageConfig = {
            baseChance: effects.statusChance || 30, // Use statusChance as damage chance if available
            baseDamage: effects.damage,
            damageType: 'environmental'
        };
        applyRandomDamageEvent(character, damageConfig, intensity, addLog);
    }
    
    // Apply status effects - handle both old and new structure
    if (effects.statusEffects) {
        // Old structure (hardcoded environments)
        applyEnvironmentalStatusEffects(character, effects.statusEffects, intensity, addLog);
    } else if (effects.statusChance && effects.statusType) {
        // New structure (story environment files) - convert to compatible format
        const statusEffects = [{
            statusId: effects.statusType,
            chance: effects.statusChance,
            duration: 2 // Default duration
        }];
        applyEnvironmentalStatusEffects(character, statusEffects, intensity, addLog);
    }
    
    // Track that environmental effects were applied this turn
    if (!environmentEffectsRegistry.has(characterId)) {
        environmentEffectsRegistry.set(characterId, {
            character: character,
            appliedEffects: [],
            environmentId: activeEnvironment.id
        });
    }
}

/**
 * Apply environmental attribute modifiers to a character (on environment change)
 * @param {Object} character - Character to apply effects to
 * @param {Function} addLog - Logging function
 */
export function applyEnvironmentalAttributes(character, addLog = () => {}) {
    if (!activeEnvironment || !character) return;
    
    // Check immunity
    if (isCharacterImmuneToEnvironment(character)) {
        return;
    }
    
    const characterId = getCharacterId(character);
    const intensity = activeEnvironment.currentIntensity;
    const effects = activeEnvironment.effects;
    
    // Remove any existing environmental attribute effects for this character
    removeEnvironmentalAttributes(character, addLog);
    
    if (!effects.attributeModifiers) return;
    
    const appliedEffects = [];
    const intensityMultiplier = getIntensityMultiplier('attributeMultiplier', intensity);
    
    // Apply primary attribute modifiers
    if (effects.attributeModifiers.primary) {
        const modifiedAttributes = effects.attributeModifiers.primary.map(attr => ({
            ...attr,
            amount: Math.round(attr.amount * intensityMultiplier)
        }));
        
        const primaryEffects = applyPrimaryAttributeBoost(character, modifiedAttributes, addLog);
        if (primaryEffects.boosts.length > 0) {
            appliedEffects.push(primaryEffects);
        }
    }
    
    // Apply secondary attribute modifiers
    if (effects.attributeModifiers.secondary) {
        const modifiedAttributes = effects.attributeModifiers.secondary.map(attr => ({
            ...attr,
            amount: Math.round(attr.amount * intensityMultiplier)
        }));
        
        const secondaryEffects = applySecondaryAttributeBoost(character, modifiedAttributes, addLog);
        if (secondaryEffects.boosts.length > 0) {
            appliedEffects.push(secondaryEffects);
        }
    }
    
    // Store applied effects for later removal
    if (appliedEffects.length > 0) {
        if (!environmentEffectsRegistry.has(characterId)) {
            environmentEffectsRegistry.set(characterId, {
                character: character,
                appliedEffects: [],
                environmentId: activeEnvironment.id
            });
        }
        
        const registry = environmentEffectsRegistry.get(characterId);
        registry.appliedEffects.push(...appliedEffects);
    }
}

/**
 * Remove environmental attribute modifiers from a character
 * @param {Object} character - Character to remove effects from
 * @param {Function} addLog - Logging function
 */
export function removeEnvironmentalAttributes(character, addLog = () => {}) {
    const characterId = getCharacterId(character);
    const registry = environmentEffectsRegistry.get(characterId);
    
    if (!registry || !registry.appliedEffects) return;
    
    // Remove all applied attribute effects
    registry.appliedEffects.forEach(effect => {
        if (effect.type === 'primaryAttributeBoost') {
            removePrimaryAttributeBoost(effect, addLog);
        } else if (effect.type === 'secondaryAttributeBoost') {
            removeSecondaryAttributeBoost(effect, addLog);
        }
    });
    
    // Clear the registry for this character
    registry.appliedEffects = [];
}

/**
 * Apply random damage event based on environment
 * @param {Object} character - Character to damage
 * @param {Object} damageConfig - Damage configuration
 * @param {number} intensity - Environment intensity
 * @param {Function} addLog - Logging function
 */
function applyRandomDamageEvent(character, damageConfig, intensity, addLog) {
    const chanceMultiplier = getIntensityMultiplier('chanceMultiplier', intensity);
    const damageMultiplier = getIntensityMultiplier('damageMultiplier', intensity);
    
    const effectiveChance = damageConfig.baseChance * chanceMultiplier;
    const roll = Math.random() * 100;
    
    if (roll <= effectiveChance) {
        const damage = Math.round(damageConfig.baseDamage * damageMultiplier);
        
        // Create a temporary character object for damage system compatibility
        const tempCharacter = { ...character };
        if (character.secondary && character.secondary.life !== undefined) {
            tempCharacter.life = character.secondary.life;
        }
        
        const finalDamage = applyDamageWithImmunity(
            tempCharacter, 
            damage, 
            damageConfig.damageType, 
            `environment_${activeEnvironment.id}`, 
            addLog
        );
        
        // Apply the damage back to the original character structure
        if (character.secondary && character.secondary.life !== undefined) {
            character.secondary.life = tempCharacter.life;
        } else if (character.life !== undefined) {
            character.life = tempCharacter.life;
        }
        
        if (finalDamage > 0) {
            addLog(`${character.name} takes ${finalDamage} ${damageConfig.damageType} damage from ${damageConfig.description}!`);
        }
    }
}

/**
 * Apply environmental status effects
 * @param {Object} character - Character to apply status to
 * @param {Array} statusEffects - Array of status effect configurations
 * @param {number} intensity - Environment intensity
 * @param {Function} addLog - Logging function
 */
function applyEnvironmentalStatusEffects(character, statusEffects, intensity, addLog) {
    const chanceMultiplier = getIntensityMultiplier('chanceMultiplier', intensity);
    
    statusEffects.forEach(statusEffect => {
        const effectiveChance = statusEffect.chance * chanceMultiplier;
        const roll = Math.random() * 100;
        
        if (roll <= effectiveChance) {
            const duration = statusEffect.duration || 3;
            addStatus(character, statusEffect.statusId, duration, null, addLog);
        }
    });
}

/**
 * Modify ability effectiveness based on environment
 * @param {Object} ability - Ability being used
 * @param {Object} attacker - Character using the ability
 * @param {Object} target - Target of the ability
 * @param {number} baseDamage - Original damage
 * @param {number} baseAccuracy - Original accuracy
 * @returns {Object} Modified damage and accuracy
 */
export function modifyAbilityByEnvironment(ability, attacker, target, baseDamage, baseAccuracy) {
    if (!activeEnvironment || !activeEnvironment.effects || !activeEnvironment.effects.abilityModifiers) {
        return { damage: baseDamage, accuracy: baseAccuracy };
    }
    
    const abilityElement = ability.element || ability.type || 'neutral';
    const modifier = activeEnvironment.effects.abilityModifiers[abilityElement];
    
    if (!modifier) {
        return { damage: baseDamage, accuracy: baseAccuracy };
    }
    
    let modifiedDamage = baseDamage;
    let modifiedAccuracy = baseAccuracy;
    
    // Check for always miss condition
    if (modifier.accuracy === 'always_miss') {
        return { damage: 0, accuracy: 0, alwaysMiss: true };
    }
    
    // Apply damage multiplier
    if (modifier.damageMultiplier) {
        modifiedDamage = Math.round(baseDamage * modifier.damageMultiplier);
    }
    
    // Apply accuracy multiplier
    if (modifier.accuracyMultiplier) {
        modifiedAccuracy = baseAccuracy * modifier.accuracyMultiplier;
    }
    
    return { damage: modifiedDamage, accuracy: modifiedAccuracy };
}

/**
 * Get intensity multiplier for a specific effect type
 * @param {string} effectType - Type of effect ('damageMultiplier', 'chanceMultiplier', etc.)
 * @param {number} intensity - Current intensity level
 * @returns {number} Multiplier value
 */
function getIntensityMultiplier(effectType, intensity) {
    if (!activeEnvironment.intensityLevels) return 1.0;
    
    // Find the appropriate intensity level
    const levels = activeEnvironment.intensityLevels;
    
    // Check for exact match
    if (levels[intensity] && levels[intensity][effectType]) {
        return levels[intensity][effectType];
    }
    
    // Check for range matches (e.g., "1-3", "4-6")
    for (const [range, values] of Object.entries(levels)) {
        if (range.includes('-')) {
            const [min, max] = range.split('-').map(Number);
            if (intensity >= min && intensity <= max && values[effectType]) {
                return values[effectType];
            }
        }
    }
    
    // Linear interpolation between defined levels
    const sortedLevels = Object.keys(levels)
        .filter(key => !key.includes('-') && levels[key][effectType])
        .map(Number)
        .sort((a, b) => a - b);
    
    if (sortedLevels.length === 0) return 1.0;
    
    // Find surrounding levels for interpolation
    let lowerLevel = sortedLevels[0];
    let upperLevel = sortedLevels[sortedLevels.length - 1];
    
    for (let i = 0; i < sortedLevels.length - 1; i++) {
        if (intensity >= sortedLevels[i] && intensity <= sortedLevels[i + 1]) {
            lowerLevel = sortedLevels[i];
            upperLevel = sortedLevels[i + 1];
            break;
        }
    }
    
    if (lowerLevel === upperLevel) {
        return levels[lowerLevel][effectType] || 1.0;
    }
    
    // Linear interpolation
    const lowerValue = levels[lowerLevel][effectType] || 1.0;
    const upperValue = levels[upperLevel][effectType] || 1.0;
    const ratio = (intensity - lowerLevel) / (upperLevel - lowerLevel);
    
    return lowerValue + (upperValue - lowerValue) * ratio;
}

/**
 * Get unique character identifier
 * @param {Object} character - Character object
 * @returns {string} Unique identifier
 */
function getCharacterId(character) {
    return character.id || character.name || `char_${Date.now()}_${Math.random()}`;
}

/**
 * Clean up environmental effects for a character (when they die or leave battle)
 * @param {Object} character - Character to clean up
 * @param {Function} addLog - Logging function
 */
export function cleanupEnvironmentalEffects(character, addLog = () => {}) {
    removeEnvironmentalAttributes(character, addLog);
    
    const characterId = getCharacterId(character);
    environmentEffectsRegistry.delete(characterId);
}

/**
 * Get all available environments
 * @returns {Object} All loaded environments
 */
export function getAllEnvironments() {
    return environments;
}

/**
 * Get environment by ID
 * @param {string} environmentId - Environment identifier
 * @returns {Object|null} Environment data or null
 */
export function getEnvironmentById(environmentId) {
    return environments[environmentId] || null;
}

/**
 * Check if an ability will be affected by the current environment
 * @param {Object} ability - Ability to check
 * @returns {Object} Information about environmental effects on the ability
 */
export function getAbilityEnvironmentalEffects(ability) {
    if (!activeEnvironment || !activeEnvironment.effects.abilityModifiers) {
        return { hasEffect: false };
    }
    
    const abilityElement = ability.element || ability.type || 'neutral';
    const modifier = activeEnvironment.effects.abilityModifiers[abilityElement];
    
    if (!modifier) {
        return { hasEffect: false };
    }
    
    return {
        hasEffect: true,
        damageMultiplier: modifier.damageMultiplier || 1.0,
        accuracyMultiplier: modifier.accuracyMultiplier || 1.0,
        alwaysMiss: modifier.accuracy === 'always_miss',
        description: getEffectDescription(modifier, abilityElement)
    };
}

/**
 * Get human-readable description of environmental effects
 * @param {Object} modifier - Ability modifier object
 * @param {string} element - Ability element
 * @returns {string} Description text
 */
function getEffectDescription(modifier, element) {
    const effects = [];
    
    if (modifier.accuracy === 'always_miss') {
        effects.push(`${element} abilities always miss`);
    } else {
        if (modifier.damageMultiplier && modifier.damageMultiplier !== 1.0) {
            const change = modifier.damageMultiplier > 1.0 ? 'increased' : 'decreased';
            const percent = Math.round(Math.abs(modifier.damageMultiplier - 1.0) * 100);
            effects.push(`damage ${change} by ${percent}%`);
        }
        
        if (modifier.accuracyMultiplier && modifier.accuracyMultiplier !== 1.0) {
            const change = modifier.accuracyMultiplier > 1.0 ? 'increased' : 'decreased';
            const percent = Math.round(Math.abs(modifier.accuracyMultiplier - 1.0) * 100);
            effects.push(`accuracy ${change} by ${percent}%`);
        }
    }
    
    return effects.length > 0 ? effects.join(', ') : 'no effect';
}

/**
 * Initialize character for environmental effects tracking
 * @param {Object} character - Character to initialize
 */
export function initializeCharacterEnvironment(character) {
    const characterId = getCharacterId(character);
    if (!environmentEffectsRegistry.has(characterId)) {
        environmentEffectsRegistry.set(characterId, {
            character: character,
            appliedEffects: [],
            environmentId: null
        });
    }
}

// Export the environments object for direct access if needed
export { environments };
