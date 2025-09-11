/**
 * Special Effects System - Modular effects for Interactive Story
 * 
 * This system provides dynamic effects that can be applied to any character
 * without hard-coding specific attributes or secondary stats. Each story
 * can define its own special effects configuration.
 */

// Import validation system for robust character structure checking
import { validatePrimaryAttributes, validateSecondaryAttributes } from './character-validation.js';
import { StatusRegistry, removeStatus, addStatus } from './status.js';

/**Primary Attribute Boost Effect
 * Boosts one or more primary attributes of a character dynamically
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} attributeBoosts - Array of boost objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applyPrimaryAttributeBoost(target, attributeBoosts, addLog = () => {}) {
    const appliedEffects = {
        type: 'primaryAttributeBoost',
        target: target,
        boosts: [],
        originalValues: {}
    };

    // Validate target structure
    if (!validatePrimaryAttributes(target, addLog)) {
        addLog(`Cannot apply primary attribute boost: invalid target structure`);
        return appliedEffects;
    }

    // Process each attribute boost
    attributeBoosts.forEach(boost => {
        const { attribute, amount } = boost;
        
        // Check if target has this primary attribute
        if (target.primary.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = target.primary[attribute];
            }
            
            // Apply the boost
            target.primary[attribute] += amount;
            appliedEffects.boosts.push({ attribute, amount });
            
            
            addLog(`${target.name || 'Target'}'s ${attribute} increased by ${amount} (${appliedEffects.originalValues[attribute]} → ${target.primary[attribute]})`);
        } else {
            addLog(`${target.name || 'Target'} does not have ${attribute} attribute - boost ignored`);
        }
    });

    return appliedEffects;
}

/** Remove Primary Attribute Boost Effect
 * Removes previously applied attribute boosts
 * 
 * @param {Object} appliedEffects - The effects object returned from applyPrimaryAttributeBoost
 * @param {Function} addLog - Logging function for feedback
 */
export function removePrimaryAttributeBoost(appliedEffects, addLog = () => {}) {
    if (!appliedEffects || appliedEffects.type !== 'primaryAttributeBoost') {
        addLog('Invalid or missing primary attribute boost effects to remove');
        return;
    }

    const { target, originalValues } = appliedEffects;
    
    // Restore original values
    Object.keys(originalValues).forEach(attribute => {
        if (target.primary && target.primary.hasOwnProperty(attribute)) {
            const oldValue = target.primary[attribute];
            target.primary[attribute] = originalValues[attribute];
        }
    });
}

/** Secondary Attribute Boost Effect
 * Boosts one or more secondary attributes (like maxLife, maxMana, speed, etc.)
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} secondaryBoosts - Array of secondary boost objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applySecondaryAttributeBoost(target, secondaryBoosts, addLog = () => {}) {
    const appliedEffects = {
        type: 'secondaryAttributeBoost',
        target: target,
        boosts: [],
        originalValues: {}
    };

    // Check for secondary attributes in different possible locations
    const secondaryTarget = target.secondary || target;

    // Process each secondary boost
    secondaryBoosts.forEach(boost => {
        const { attribute, amount } = boost;
        
        // Check if target has this secondary attribute
        if (secondaryTarget.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = secondaryTarget[attribute];
            }
            
            // Apply the boost
            secondaryTarget[attribute] += amount;
            appliedEffects.boosts.push({ attribute, amount });
            
            addLog(`${target.name || 'Target'}'s ${attribute} increased by ${amount} (${appliedEffects.originalValues[attribute]} → ${secondaryTarget[attribute]})`);
        } else {
            addLog(`${target.name || 'Target'} does not have ${attribute} secondary attribute - boost ignored`);
        }
    });

    return appliedEffects;
}

/** Remove Secondary Attribute Boost Effect
 * 
 * @param {Object} appliedEffects - The effects object returned from applySecondaryAttributeBoost
 * @param {Function} addLog - Logging function for feedback
 */
export function removeSecondaryAttributeBoost(appliedEffects, addLog = () => {}) {
    if (!appliedEffects || appliedEffects.type !== 'secondaryAttributeBoost') {
        addLog('Invalid or missing secondary attribute boost effects to remove');
        return;
    }

    const { target, originalValues } = appliedEffects;
    const secondaryTarget = target.secondary || target;
    
    // Restore original values
    Object.keys(originalValues).forEach(attribute => {
        if (secondaryTarget.hasOwnProperty(attribute)) {
            const oldValue = secondaryTarget[attribute];
            secondaryTarget[attribute] = originalValues[attribute];
        }
    });
}

/** Secondary Attribute Debuff
 * Debuffs one or more secondary attributes (like maxLife, maxMana, speed, etc.)
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} secondaryDebuffs - Array of debuff objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applySecondaryAttributeDebuff(target, secondaryDebuffs, addLog = () => {}) {
    const appliedEffects = {
        type: 'secondaryAttributeDebuff',
        target: target,
        debuffs: [],
        originalValues: {}
    };

    // Target secondary attributes (could be target.secondary or target itself)
    const secondaryTarget = target.secondary || target;
    
    // Process each secondary attribute debuff
    secondaryDebuffs.forEach(debuff => {
        const { attribute, amount } = debuff;
        
        // Check if target has this secondary attribute
        if (secondaryTarget.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = secondaryTarget[attribute];
            }
            
            // Apply the debuff (reduce the attribute)
            const oldValue = secondaryTarget[attribute];
            secondaryTarget[attribute] = Math.max(0, secondaryTarget[attribute] - amount);
            appliedEffects.debuffs.push({ attribute, amount });
            
        } else {
        }
    });

    return appliedEffects;
}

/** Remove Secondary Attribute Debuff Effect
 * Removes previously applied secondary attribute debuffs
 * 
 * @param {Object} appliedEffects - The effects object returned from applySecondaryAttributeDebuff
 * @param {Function} addLog - Logging function for feedback
 */
export function removeSecondaryAttributeDebuff(appliedEffects, addLog = () => {}) {
    if (!appliedEffects || appliedEffects.type !== 'secondaryAttributeDebuff') {
        addLog('Invalid or missing secondary attribute debuff effects to remove');
        return;
    }

    const { target, originalValues } = appliedEffects;
    const secondaryTarget = target.secondary || target;
    
    // Restore original values
    Object.keys(originalValues).forEach(attribute => {
        if (secondaryTarget.hasOwnProperty(attribute)) {
            const oldValue = secondaryTarget[attribute];
            secondaryTarget[attribute] = originalValues[attribute];
        }
    });
}

/** Percentage-Based Attribute Boost
 * Boosts attributes by a percentage rather than flat amount
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} percentageBoosts - Array of percentage boost objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applyPercentageAttributeBoost(target, percentageBoosts, addLog = () => {}) {
    const appliedEffects = {
        type: 'percentageAttributeBoost',
        target: target,
        boosts: [],
        originalValues: {}
    };

    // Ensure target has primary attributes object
    if (!target.primary) {
        addLog(`${target.name || 'Target'} has no primary attributes to boost`);
        return appliedEffects;
    }

    // Process each percentage boost
    percentageBoosts.forEach(boost => {
        const { attribute, percentage } = boost;
        
        // Check if target has this primary attribute
        if (target.primary.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = target.primary[attribute];
            }
            
            // Calculate and apply the percentage boost
            const boostAmount = Math.floor(appliedEffects.originalValues[attribute] * (percentage / 100));
            target.primary[attribute] += boostAmount;
            appliedEffects.boosts.push({ attribute, percentage, amount: boostAmount });
            
            addLog(`${target.name || 'Target'}'s ${attribute} increased by ${percentage}% (+${boostAmount}) (${appliedEffects.originalValues[attribute]} → ${target.primary[attribute]})`);
        } else {
            addLog(`${target.name || 'Target'} does not have ${attribute} attribute - percentage boost ignored`);
        }
    });

    return appliedEffects;
}

/** Generic Effect Application System
 * Applies multiple types of effects from a single configuration object
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Object} effectConfig - Configuration object with different effect types
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} All applied effects for tracking/removal
 */
export function applySpecialEffects(target, effectConfig, addLog = () => {}) {
    const allAppliedEffects = {
        type: 'combinedEffects',
        effects: []
    };

    // Apply primary attribute boosts
    if (effectConfig.primaryAttributeBoosts && effectConfig.primaryAttributeBoosts.length > 0) {
        const primaryBoostEffects = applyPrimaryAttributeBoost(target, effectConfig.primaryAttributeBoosts, addLog);
        if (primaryBoostEffects.boosts.length > 0) {
            allAppliedEffects.effects.push(primaryBoostEffects);
        }
    }

    // Apply primary attribute debuffs
    if (effectConfig.primaryAttributeDebuffs && effectConfig.primaryAttributeDebuffs.length > 0) {
        const primaryDebuffEffects = applyPrimaryAttributeDebuff(target, effectConfig.primaryAttributeDebuffs, addLog);
        if (primaryDebuffEffects.debuffs.length > 0) {
            allAppliedEffects.effects.push(primaryDebuffEffects);
        }
    }

    // Apply secondary attribute boosts
    if (effectConfig.secondaryAttributeBoosts && effectConfig.secondaryAttributeBoosts.length > 0) {
        const secondaryBoostEffects = applySecondaryAttributeBoost(target, effectConfig.secondaryAttributeBoosts, addLog);
        if (secondaryBoostEffects.boosts.length > 0) {
            allAppliedEffects.effects.push(secondaryBoostEffects);
        }
    }

    // Apply secondary attribute debuffs
    if (effectConfig.secondaryAttributeDebuffs && effectConfig.secondaryAttributeDebuffs.length > 0) {
        const secondaryDebuffEffects = applySecondaryAttributeDebuff(target, effectConfig.secondaryAttributeDebuffs, addLog);
        if (secondaryDebuffEffects.debuffs.length > 0) {
            allAppliedEffects.effects.push(secondaryDebuffEffects);
        }
    }

    // Apply percentage attribute boosts
    if (effectConfig.percentageAttributeBoosts && effectConfig.percentageAttributeBoosts.length > 0) {
        const percentageBoostEffects = applyPercentageAttributeBoost(target, effectConfig.percentageAttributeBoosts, addLog);
        if (percentageBoostEffects.boosts.length > 0) {
            allAppliedEffects.effects.push(percentageBoostEffects);
        }
    }

    return allAppliedEffects;
}

/** Remove All Special Effects
 * Removes all effects applied by applySpecialEffects
 * 
 * @param {Object} allAppliedEffects - The effects object returned from applySpecialEffects
 * @param {Function} addLog - Logging function for feedback
 */
export function removeSpecialEffects(allAppliedEffects, addLog = () => {}) {
    if (!allAppliedEffects || allAppliedEffects.type !== 'combinedEffects') {
        addLog('Invalid or missing special effects to remove');
        return;
    }

    // Remove each effect in reverse order
    allAppliedEffects.effects.reverse().forEach(effect => {
        switch (effect.type) {
            case 'primaryAttributeBoost':
                removePrimaryAttributeBoost(effect, addLog);
                break;
            case 'primaryAttributeDebuff':
                removePrimaryAttributeDebuff(effect, addLog);
                break;
            case 'secondaryAttributeBoost':
                removeSecondaryAttributeBoost(effect, addLog);
                break;
            case 'secondaryAttributeDebuff':
                removeSecondaryAttributeDebuff(effect, addLog);
                break;
            case 'percentageAttributeBoost':
                removePrimaryAttributeBoost(effect, addLog); // Same removal logic as primary attributes
                break;
            default:
                addLog(`Unknown effect type: ${effect.type}`);
        }
    });
}

/** Example Usage and Configuration Objects
 */

// Example: Focus Attack ability configuration
export const EXAMPLE_FOCUS_ATTACK = {
    primaryAttributeBoosts: [
        { attribute: 'dexterity', amount: 5 },
        { attribute: 'strength', amount: 3 }
    ]
};

// Example: Magical Enhancement configuration
export const EXAMPLE_MAGICAL_ENHANCEMENT = {
    primaryAttributeBoosts: [
        { attribute: 'intelligence', amount: 4 },
        { attribute: 'wisdom', amount: 2 }
    ],
    secondaryAttributeBoosts: [
        { attribute: 'maxMana', amount: 20 },
        { attribute: 'magicDamage', amount: 10 }
    ]
};

// Example: Percentage-based buff
export const EXAMPLE_BERSERKER_RAGE = {
    percentageAttributeBoosts: [
        { attribute: 'strength', percentage: 50 },
        { attribute: 'constitution', percentage: 25 }
    ],
    secondaryAttributeBoosts: [
        { attribute: 'speed', amount: -5 } // Berserker gets slower but stronger
    ]
};

/** Primary Attribute Debuff Effect
 * Reduces one or more primary attributes of a character dynamically
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} attributeDebuffs - Array of debuff objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applyPrimaryAttributeDebuff(target, attributeDebuffs, addLog = () => {}) {
    const appliedEffects = {
        type: 'primaryAttributeDebuff',
        target: target,
        debuffs: [],
        originalValues: {}
    };

    // Validate target structure
    if (!validatePrimaryAttributes(target, addLog)) {
        addLog(`Cannot apply primary attribute debuff: invalid target structure`);
        return appliedEffects;
    }

    // Process each attribute debuff
    attributeDebuffs.forEach(debuff => {
        const { attribute, amount } = debuff;
        
        // Check if target has this primary attribute
        if (target.primary.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = target.primary[attribute];
            }
            
            // Apply the debuff (reduce the attribute)
            target.primary[attribute] = Math.max(0, target.primary[attribute] - amount);
            appliedEffects.debuffs.push({ attribute, amount });
            
        } else {
        }
    });

    return appliedEffects;
}

/** Remove Primary Attribute Debuff Effect
 * Removes previously applied attribute debuffs
 * 
 * @param {Object} appliedEffects - The effects object returned from applyPrimaryAttributeDebuff
 * @param {Function} addLog - Logging function for feedback
 */
export function removePrimaryAttributeDebuff(appliedEffects, addLog = () => {}) {
    if (!appliedEffects || appliedEffects.type !== 'primaryAttributeDebuff') {
        addLog('Invalid or missing primary attribute debuff effects to remove');
        return;
    }

    const { target, originalValues } = appliedEffects;
    
    // Restore original values
    Object.keys(originalValues).forEach(attribute => {
        if (target.primary && target.primary.hasOwnProperty(attribute)) {
            const oldValue = target.primary[attribute];
            target.primary[attribute] = originalValues[attribute];
        }
    });
}

// ============================================================================
// DAMAGE IMMUNITY AND RESISTANCE SYSTEM
// ============================================================================

/** Centralized Damage Immunity System
 * Handles all forms of damage immunity, resistance, and damage calculations
 */
export const DamageImmunitySystem = {
    /**
     * Check if a character is immune to a specific damage type
     * This function considers all sources of immunity: type, status effects, equipment, etc.
     */
    isImmuneToDamage(character, damageType, damageSource = 'general', addLog = () => {}) {
        // Type-based immunities
        if (this.checkTypeImmunity(character, damageType, addLog)) {
            return true;
        }

        // Status-based immunities  
        if (this.checkStatusImmunity(character, damageType, damageSource, addLog)) {
            return true;
        }

        // Environmental immunities
        if (this.checkEnvironmentalImmunity(character, damageType, damageSource, addLog)) {
            return true;
        }

        // Equipment-based immunities (future feature)
        if (this.checkEquipmentImmunity(character, damageType, addLog)) {
            return true;
        }

        return false;
    },

    /**
     * Check type-based damage immunities
     */
    checkTypeImmunity(character, damageType, addLog = () => {}) {
        if (!character.type) return false;

        const typeImmunities = {
            // Elemental immunities
            'fire': ['fire', 'burn'],
            'water': ['water', 'drowning'],
            'earth': ['earth', 'rock', 'sand'],
            'air': ['air', 'wind', 'lightning'],
            'ice': ['ice', 'cold', 'frost', 'freeze'],
            'poison': ['poison', 'toxic', 'venom'],
            'lightning': ['lightning', 'electric', 'shock'],
            'acid': ['acid', 'corrosion'],
            
            // Special type immunities
            'undead': ['poison', 'disease', 'fear', 'charm'],
            'construct': ['poison', 'disease', 'bleed', 'fatigue'],
            'elemental': ['poison', 'disease', 'bleed'],
            'ghost': ['physical', 'poison', 'disease'],
            'metal': ['poison', 'acid'], // Partial resistance to acid
            'plant': ['poison'], // Plants often resist toxins
            'slime': ['acid', 'poison', 'disease']
        };

        const immunities = typeImmunities[character.type.toLowerCase()];
        if (immunities && immunities.includes(damageType.toLowerCase())) {
            addLog(`${character.name || 'Character'} is immune to ${damageType} damage (${character.type} type)!`);
            return true;
        }

        return false;
    },

    /**
     * Check status effect-based immunities
     */
    checkStatusImmunity(character, damageType, damageSource, addLog = () => {}) {
        if (!character.statusEffects) return false;

        // Check active status effects for immunities
        for (const status of character.statusEffects) {
            // Flying immunity to physical/ground attacks
            if (status.statusTag === 'flying' || status.name === 'Flying') {
                if (['physical', 'ground', 'earth'].includes(damageType.toLowerCase())) {
                    addLog(`${character.name || 'Character'} is flying and immune to ${damageType} damage!`);
                    return true;
                }
            }

            // Frozen immunity to water/ice
            if (status.statusTag === 'frozen' || status.name === 'Frozen') {
                if (['water', 'ice', 'cold'].includes(damageType.toLowerCase())) {
                    addLog(`${character.name || 'Character'} is frozen solid and immune to ${damageType} damage!`);
                    return true;
                }
            }

            // Incorporeal/ghost form immunity to physical
            if (status.statusTag === 'incorporeal' || status.statusTag === 'ghost-form') {
                if (['physical', 'weapon', 'melee'].includes(damageType.toLowerCase())) {
                    addLog(`${character.name || 'Character'} is incorporeal and immune to ${damageType} damage!`);
                    return true;
                }
            }

            // Shield/barrier effects
            if (status.statusTag === 'fire-shield' && damageType.toLowerCase() === 'fire') {
                addLog(`${character.name || 'Character'}'s fire shield absorbs the ${damageType} damage!`);
                return true;
            }

            if (status.statusTag === 'ice-armor' && ['ice', 'cold'].includes(damageType.toLowerCase())) {
                addLog(`${character.name || 'Character'}'s ice armor absorbs the ${damageType} damage!`);
                return true;
            }
        }

        return false;
    },

    /**
     * Check environmental immunities (for environmental damage)
     */
    checkEnvironmentalImmunity(character, damageType, damageSource, addLog = () => {}) {
        if (!damageSource.includes('environment')) return false;

        // Fire types are immune to volcanic/fire environments
        if (character.type === 'fire' && ['fire', 'heat', 'volcanic', 'lava'].includes(damageType.toLowerCase())) {
            addLog(`${character.name || 'Character'} thrives in the ${damageSource} environment!`);
            return true;
        }

        // Water types are immune to underwater/drowning
        if (character.type === 'water' && ['water', 'drowning', 'pressure'].includes(damageType.toLowerCase())) {
            addLog(`${character.name || 'Character'} is at home in aquatic environments!`);
            return true;
        }

        // Air types are immune to storm/wind damage
        if (character.type === 'air' && ['wind', 'storm', 'pressure'].includes(damageType.toLowerCase())) {
            addLog(`${character.name || 'Character'} rides the winds unharmed!`);
            return true;
        }

        // Earth types are immune to cave/underground hazards
        if (character.type === 'earth' && ['cave-in', 'rock-fall', 'underground'].includes(damageType.toLowerCase())) {
            addLog(`${character.name || 'Character'} is one with the earth!`);
            return true;
        }

        // Ice types are immune to cold environments
        if (character.type === 'ice' && ['cold', 'freeze', 'arctic'].includes(damageType.toLowerCase())) {
            addLog(`${character.name || 'Character'} is unaffected by the cold!`);
            return true;
        }

        return false;
    },

    /**
     * Check equipment-based immunities (future feature)
     */
    checkEquipmentImmunity(character, damageType, addLog = () => {}) {
        if (!character.equipment) return false;

        // Check equipped items for immunity properties
        for (const [slot, item] of Object.entries(character.equipment)) {
            if (!item || !item.immunities) continue;

            if (item.immunities.includes(damageType.toLowerCase())) {
                addLog(`${character.name || 'Character'}'s ${item.name} grants immunity to ${damageType} damage!`);
                return true;
            }
        }

        return false;
    },

    /**
     * Calculate damage reduction from resistances (not immunity, but reduced damage)
     */
    calculateDamageReduction(character, damageType, damage, damageSource = 'general', addLog = () => {}) {
        let finalDamage = damage;
        let reductionReasons = [];

        // Type-based resistances
        const typeReduction = this.getTypeResistance(character, damageType);
        if (typeReduction > 0) {
            finalDamage = Math.round(finalDamage * (1 - typeReduction));
            reductionReasons.push(`${character.type} type resistance`);
        }

        // Status-based resistances
        const statusReduction = this.getStatusResistance(character, damageType);
        if (statusReduction > 0) {
            finalDamage = Math.round(finalDamage * (1 - statusReduction));
            reductionReasons.push('status effects');
        }

        // Equipment-based resistances
        const equipReduction = this.getEquipmentResistance(character, damageType);
        if (equipReduction > 0) {
            finalDamage = Math.round(finalDamage * (1 - equipReduction));
            reductionReasons.push('equipment');
        }

        // Log resistance if damage was reduced
        if (finalDamage < damage) {
            const reduction = damage - finalDamage;
            addLog(`${character.name || 'Character'} resists ${reduction} ${damageType} damage (${reductionReasons.join(', ')})!`);
        }

        return Math.max(1, finalDamage); // Minimum 1 damage
    },

    /**
     * Get type-based damage resistance multiplier
     */
    getTypeResistance(character, damageType) {
        if (!character.type) return 0;

        const typeResistances = {
            'fire': { 'ice': 0.5, 'water': 0.3 },
            'water': { 'fire': 0.5, 'electric': 0.3 },
            'earth': { 'lightning': 0.7, 'wind': 0.3 },
            'air': { 'earth': 0.5, 'physical': 0.2 },
            'ice': { 'fire': -0.5, 'physical': 0.3 }, // Note: negative = vulnerability
            'metal': { 'physical': 0.4, 'acid': 0.3 },
            'plant': { 'water': 0.6, 'earth': 0.4 },
            'undead': { 'dark': 0.8, 'light': -0.5 },
            'construct': { 'physical': 0.5, 'magic': 0.3 }
        };

        const resistances = typeResistances[character.type.toLowerCase()];
        return resistances ? (resistances[damageType.toLowerCase()] || 0) : 0;
    },

    /**
     * Get status-based damage resistance
     */
    getStatusResistance(character, damageType) {
        if (!character.statusEffects) return 0;

        let totalResistance = 0;

        for (const status of character.statusEffects) {
            // Stone skin reduces physical damage
            if (status.statusTag === 'stone-skin' && damageType.toLowerCase() === 'physical') {
                totalResistance += 0.5;
            }

            // Fire aura reduces fire damage
            if (status.statusTag === 'fire-aura' && damageType.toLowerCase() === 'fire') {
                totalResistance += 0.3;
            }

            // Protection spells
            if (status.statusTag === 'protection' || status.statusTag === 'shield') {
                totalResistance += 0.2; // General damage reduction
            }
        }

        return Math.min(0.8, totalResistance); // Cap at 80% resistance
    },

    /**
     * Get equipment-based damage resistance
     */
    getEquipmentResistance(character, damageType) {
        if (!character.equipment) return 0;

        let totalResistance = 0;

        for (const [slot, item] of Object.entries(character.equipment)) {
            if (!item || !item.resistances) continue;

            const resistance = item.resistances[damageType.toLowerCase()];
            if (resistance) {
                totalResistance += resistance;
            }
        }

        return Math.min(0.7, totalResistance); // Cap at 70% equipment resistance
    }
};

/** Quick immunity check for general damage
 * Use this in battle.js and other systems for any damage dealing
 */
export function checkDamageImmunity(character, damageType, damageSource = 'general', addLog = () => {}) {
    return DamageImmunitySystem.isImmuneToDamage(character, damageType, damageSource, addLog);
}

/** Apply damage with full immunity and resistance checking
 * Returns the final damage dealt (0 if immune)
 */
export function applyDamageWithImmunity(character, damage, damageType, damageSource = 'general', addLog = () => {}) {
    // Check immunity first
    if (DamageImmunitySystem.isImmuneToDamage(character, damageType, damageSource, addLog)) {
        return 0; // Immune = no damage
    }

    // Apply resistance calculations
    const finalDamage = DamageImmunitySystem.calculateDamageReduction(character, damageType, damage, damageSource, addLog);
    
    // Apply the damage
    character.life = Math.max(0, character.life - finalDamage);
    
    return finalDamage;
}

/** Check if character has any damage resistance (not immunity)
 * Returns the resistance multiplier (0.0 to 1.0, where 0.5 = 50% resistance)
 */
export function getDamageResistance(character, damageType) {
    const typeResistance = DamageImmunitySystem.getTypeResistance(character, damageType);
    const statusResistance = DamageImmunitySystem.getStatusResistance(character, damageType);
    const equipResistance = DamageImmunitySystem.getEquipmentResistance(character, damageType);
    
    // Combine resistances (don't stack multiplicatively to avoid overpowered combinations)
    const totalResistance = Math.min(0.9, typeResistance + statusResistance + equipResistance);
    return Math.max(0, totalResistance);
}

/** Environmental damage application with immunity checking
 * Use this for environmental hazards, traps, etc.
 */
export function applyEnvironmentalDamage(character, damage, damageType, environmentName, addLog = () => {}) {
    const damageSource = `environment_${environmentName}`;
    return applyDamageWithImmunity(character, damage, damageType, damageSource, addLog);
}

// ============================================================================
// TRAPPED STATUS STRUGGLE MECHANICS
// ============================================================================

/** Calculate struggle success based on strength vs strength+weight (enemy-based)
 * Used for pinned status where opponent stats matter
 */
export function calculateEnemyBasedStruggle(character, opponent, status, addLog = () => {}) {
    const characterStrength = character.primary?.strength || 10;
    const opponentStrength = opponent.primary?.strength || 10;
    const opponentWeight = opponent.weight || 65; // Default weight: 65kg
    
    // Opponent's resistance = strength + (weight bonus: 1 point per 20kg)
    const weightBonus = Math.floor(opponentWeight / 20);
    const opponentResistance = opponentStrength + weightBonus;
    
    // Roll for struggle (d20 + strength vs d20 + resistance)
    const characterRoll = Math.floor(Math.random() * 20) + 1 + characterStrength;
    const opponentRoll = Math.floor(Math.random() * 20) + 1 + opponentResistance;
    
    const success = characterRoll > opponentRoll;
    
    if (success) {
        addLog(`${character.name} struggles free! (${characterRoll} vs ${opponentRoll})`);
    } else {
        addLog(`${character.name} fails to break free! (${characterRoll} vs ${opponentRoll})`);
    }
    
    return success;
}

/** Calculate struggle success against status difficulty (status-based)
 * Used for pinned status - contested roll between player and enemy
 */
export function calculateStatusBasedStruggle(character, status, addLog = () => {}, opponent = null) {
    const characterStrength = character.primary?.strength || 10;
    
    // If we have an opponent and this is a pinned status, use contested roll
    if (opponent && (status.statusTag === 'pinned' || status.name === 'Pinned')) {
        const opponentStrength = opponent.primary?.strength || 10;
        const opponentWeight = opponent.weight || 65; // Default weight: 65kg
        
        // Player roll: d20 + strength
        const playerRoll = Math.floor(Math.random() * 20) + 1;
        const playerTotal = playerRoll + characterStrength;
        
        // Enemy roll: d20 + strength + weight bonus (1 point per 20kg)
        const enemyRoll = Math.floor(Math.random() * 20) + 1;
        const weightBonus = Math.floor(opponentWeight / 20);
        const enemyTotal = enemyRoll + opponentStrength + weightBonus;
        
        const success = playerTotal > enemyTotal;
        
        // Show detailed breakdown in the log
        addLog(`${character.name} struggles against ${status.name}!`);
        addLog(`Player Roll: ${playerRoll} + Strength: ${characterStrength} = ${playerTotal}`);
        addLog(`${opponent.name} Roll: ${enemyRoll} + Strength: ${opponentStrength} + Weight Bonus: ${weightBonus} = ${enemyTotal}`);
        
        if (success) {
            addLog(`${character.name} breaks free! (${playerTotal} vs ${enemyTotal})`);
        } else {
            const difference = enemyTotal - playerTotal;
            addLog(`${character.name} fails to break free! (${playerTotal} vs ${enemyTotal}) - Needed ${difference} more!`);
        }
        
        return success;
    } else {
        // Fallback to static difficulty for other statuses
        const statusDifficulty = status.struggleDC || status.difficulty || 15;
        
        // Roll d20 + strength vs difficulty
        const baseRoll = Math.floor(Math.random() * 20) + 1;
        const roll = baseRoll + characterStrength;
        const success = roll >= statusDifficulty;
        
        // Show detailed breakdown in the log
        addLog(`${character.name} struggles against ${status.name}!`);
        addLog(`Roll: ${baseRoll} + Strength: ${characterStrength} = ${roll} vs DC ${statusDifficulty}`);
        
        if (success) {
            addLog(`${character.name} breaks free!`);
        } else {
            const needed = statusDifficulty - roll;
            addLog(`${character.name} fails to break free! Needed ${needed} more!`);
        }
        
        return success;
    }
}

/** Enhanced struggle calculation that considers usesEnemyStats property
 * This is the unified function that determines which type of struggle to use
 */
export function calculateStruggleWithStats(character, opponent, statusDef, addLog = () => {}) {
    // Check if this status uses enemy stats for struggle calculations
    if (statusDef.usesEnemyStats && opponent) {
        return calculateEnemyBasedStruggle(character, opponent, statusDef, addLog);
    } else {
        return calculateStatusBasedStruggle(character, statusDef, addLog);
    }
}

/** Handle forceful break free when trapped character successfully hits an attack
 * This automatically removes trapped status and may apply effects to opponent
 */
export function forcefulBreakFreeEffect(attacker, target, addLog = () => {}, applyStatusFunction = null) {
    addLog(`${attacker.name} breaks free with a powerful attack!`);
    
    // Apply stun or other effect to the opponent if specified
    if (applyStatusFunction && target) {
        applyStatusFunction(target, 'stunned', 1, addLog);
        addLog(`${target.name} is stunned by the forceful break!`);
    }
    
    return true; // Indicates trapped status should be removed
}

/** Check if trapped status should end when opponent attacks without maintaining trap
 * Used for pinned status - attacks without pin effect release the pin
 */
export function checkTrapRelease(ability, target, addLog = () => {}) {
    // If opponent's attack has a pinned effect, maintain the pin (it will be refreshed)
    if (ability.effect && ability.effect.statusTag === 'pinned') {
        return false; // Keep the pin, it will be refreshed by the attack
    }
    
    // If opponent's attack doesn't have pinned effect, release the pin
    addLog(`${target.name} is released from being pinned as the opponent uses a different attack!`);
    return true; // Should release the pin
}

// ============================================================================
// FLYING STATUS MECHANICS
// ============================================================================

/** Check if a character is currently flying
 */
export function isCharacterFlying(character) {
    if (!character.statusEffects) return false;
    
    return character.statusEffects.some(status => 
        status.statusTag === 'flying' || status.name === 'Flying'
    );
}

/** Handle diving attack when flying character uses close/physical attack
 * Applies damage multiplier and removes flying status
 */
export function handleDivingAttack(attacker, target, ability, baseDamage, addLog = () => {}) {
    if (!isCharacterFlying(attacker)) {
        return { isDivingAttack: false, finalDamage: baseDamage };
    }

    // Check if it's a close/physical attack
    if (ability.range === 'close' || ability.type === 'physical') {
        const divingMultiplier = 1.6; // Diving attack multiplier
        const finalDamage = Math.floor(baseDamage * divingMultiplier);
        
        addLog(`${attacker.name} dives down with ${ability.name} for extra damage!`);
        addLog(`Diving attack bonus: ${baseDamage} → ${finalDamage} damage!`);
        
        return {
            isDivingAttack: true,
            finalDamage: finalDamage,
            shouldRemoveFlying: true
        };
    }
    
    return { isDivingAttack: false, finalDamage: baseDamage };
}

/** Handle fall damage when flying character is hit by ranged attack
 * Calculates fall damage and determines if flying should end
 */
export function handleFlyingRangedHit(target, ability, addLog = () => {}) {
    if (!isCharacterFlying(target)) {
        return { shouldFall: false, fallDamage: 0 };
    }

    // Check if it's a ranged/magic attack
    if (ability.range === 'ranged' || ability.type === 'magic') {
        const fallDamage = Math.max(5, Math.floor(target.secondary.maxLife * 0.08)); // 8% of max life
        
        addLog(`${target.name} is struck from the sky by ${ability.name}!`);
        addLog(`${target.name} falls and takes ${fallDamage} fall damage!`);
        
        // Apply fall damage
        target.secondary.life = Math.max(0, target.secondary.life - fallDamage);

        return {
            shouldFall: true,
            fallDamage: fallDamage,
            shouldRemoveFlying: true
        };
    }
    
    return { shouldFall: false, fallDamage: 0 };
}

/** Check if flying character should be immune to close attacks
 * Returns true if the attack should be blocked due to flying immunity
 */
export function checkFlyingImmunity(target, ability, addLog = () => {}) {
    if (!isCharacterFlying(target)) {
        return false;
    }

    // Flying grants immunity to close/physical attacks
    if (ability.range === 'close' || ability.type === 'physical') {
        addLog(`${target.name} is flying too high - ${ability.name} can't reach them!`);
        return true; // Immune to attack
    }
    
    return false; // Not immune
}

/** Remove flying status from character
 * Handles proper cleanup of flying effects
 */
export function removeFlyingStatus(character, addLog = () => {}) {
    if (!character.statusEffects) return false;
    
    const flyingIndex = character.statusEffects.findIndex(status => 
        status.statusTag === 'flying' || status.name === 'Flying'
    );
    
    if (flyingIndex >= 0) {
        character.statusEffects.splice(flyingIndex, 1);
        addLog(`${character.name} lands on the ground!`);
        return true;
    }
    
    return false;
}

// =============================================================================
// NEW MODULAR FUNCTIONS FOR isHigh STATUS SYSTEM
// =============================================================================

/** Check if character has any status with isHigh property
 * @param {Object} character - Character to check
 * @returns {boolean} - True if character has any status with isHigh: true
 */
export function hasIsHighStatus(character) {
    // console.log("🔧 DEBUG: hasIsHighStatus called for", character.name);
    if (!character.statusEffects || !Array.isArray(character.statusEffects)) {
        // console.log("🔧 No status effects or not array");
        return false;
    }
    
    // console.log("🔧 Status effects:", character.statusEffects);
    
    for (const statusEffect of character.statusEffects) {
        // Use statusTag (which contains the ID) instead of statusId
        const statusId = statusEffect.statusTag || statusEffect.statusId;
        // console.log("🔧 Checking status:", statusId || statusEffect.name);
        const statusDef = StatusRegistry[statusId];
        // console.log("🔧 Status definition:", statusDef);
        if (statusDef && statusDef.isHigh === true) {
            // console.log("🔧 Found isHigh status!", statusId);
            return true;
        }
    }
    
    // console.log("🔧 No isHigh status found");
    return false;
}

/** Check dynamic range immunity based on elevation status
 * @param {Object} target - Target character
 * @param {Object} ability - Ability being used
 * @param {Object} caster - Character using the ability
 * @returns {boolean} - True if immune to this range
 */
export function checkDynamicRangeImmunity(target, ability, caster) {
// Remove debug logging after testing
// console.log("🔧 DEBUG: checkDynamicRangeImmunity called");
// console.log("Target:", target.name, "Ability:", ability.name, "Range:", ability.range, "Caster:", caster?.name);
    
    if (!ability.range || ability.range !== 'close') {
        // console.log("🔧 Not a close range ability, no immunity");
        return false;
    }
    
    // Check if target has isHigh status
    const targetIsHigh = hasIsHighStatus(target);
    const casterIsHigh = hasIsHighStatus(caster);
    
    // console.log("🔧 Target isHigh:", targetIsHigh, "Caster isHigh:", casterIsHigh);
    
    // If target is high and caster is not high, target is immune to close range
    if (targetIsHigh && !casterIsHigh) {
        console.log("🔧 IMMUNITY TRIGGERED: Target is high, caster is not");
        return true;
    }
    
    // If both are high or both are ground level, no immunity
    // console.log("🔧 No immunity: both same level");
    return false;
}

/** Apply swoop down attack modifier for elevated attackers
 * @param {Object} attacker - Character performing the attack
 * @param {Object} ability - Ability being used
 * @param {number} baseDamage - Base damage before modifiers
 * @param {Function} addLog - Logging function
 * @returns {Object} - {damage: number, effects: Array, shouldRemoveStatus: boolean}
 */
export function applySwoopDownModifier(attacker, ability, baseDamage, addLog = () => {}) {
    // console.log("🔧 DEBUG: applySwoopDownModifier called");
    // console.log("🔧 Attacker:", attacker.name, "Ability:", ability.name, "Range:", ability.range);
    
    // Check if attacker has isHigh status
    const attackerIsHigh = hasIsHighStatus(attacker);
    // console.log("🔧 Attacker isHigh:", attackerIsHigh);
    
    if (!attackerIsHigh || ability.range !== 'close') {
        // console.log("🔧 No swoop: not high or not close range");
        return { damage: baseDamage, effects: [], shouldRemoveStatus: false };
    }
    
    // Apply swoop down damage multiplier for close range attacks from elevated position
    const swoopMultiplier = 1.5; // 50% damage bonus for swooping down
    const modifiedDamage = Math.floor(baseDamage * swoopMultiplier);
    
    console.log("🔧 SWOOP ATTACK DETECTED! Damage:", baseDamage, "→", modifiedDamage);
    addLog(`${attacker.name} swoops down for extra damage! (+${modifiedDamage - baseDamage} damage)`);
    
    return { 
        damage: modifiedDamage, 
        effects: ['swoop_down'], 
        shouldRemoveStatus: true // Remove elevated status after swooping down
    };
}

/** Calculate fall damage when elevated character takes damage
 * @param {Object} character - Character taking fall damage
 * @param {number} triggeringDamage - Original damage that caused the fall
 * @param {Function} addLog - Logging function
 * @returns {Object} - {damage: number, effects: Array, shouldRemoveStatuses: boolean}
 */
export function calculateFallDamage(character, triggeringDamage = 0, addLog = () => {}) {
    // Check if character has isHigh status
    const characterIsHigh = hasIsHighStatus(character);
    
    if (!characterIsHigh) {
        return { damage: 0, effects: [], shouldRemoveStatuses: false };
    }
    
    // Calculate fall damage based on character weight
    const characterWeight = character.weight || 65; // Default weight
    const baseFallDamage = Math.floor(characterWeight / 10); // 1 damage per 10kg
    
    // Add bonus damage based on triggering damage (represents harder fall from stronger hit)
    const fallDamageBonus = Math.floor(triggeringDamage / 5);
    const totalFallDamage = baseFallDamage + fallDamageBonus;
    
    addLog(`${character.name} falls from height! Takes ${totalFallDamage} fall damage (Weight: ${characterWeight}kg)`);
    
    return { 
        damage: totalFallDamage, 
        effects: ['fall_impact', 'stunned'], 
        shouldRemoveStatuses: true // Remove all isHigh statuses
    };
}

/** Remove all statuses that have isHigh property set to true
 * @param {Object} character - Character to remove statuses from
 * @param {Function} addLog - Logging function
 * @returns {Array} - Array of removed status IDs
 */
export function removeIsHighStatuses(character, addLog = () => {}) {
    console.log("🔧 DEBUG: removeIsHighStatuses called for", character.name);
    if (!character.statusEffects || !Array.isArray(character.statusEffects)) {
        console.log("🔧 No status effects to remove");
        return [];
    }
    
    console.log("🔧 Current status effects:", character.statusEffects);
    const removedStatuses = [];
    
    // Create a copy of the array to avoid modification during iteration
    const statusEffectsCopy = [...character.statusEffects];
    
    for (const statusEffect of statusEffectsCopy) {
        // Use statusTag (which contains the ID) instead of statusId
        const statusId = statusEffect.statusTag || statusEffect.statusId;
        console.log("🔧 Checking status for removal:", statusId);
        const statusDef = StatusRegistry[statusId];
        console.log("🔧 Status definition:", statusDef);
        if (statusDef && statusDef.isHigh === true) {
            console.log("🔧 Removing isHigh status:", statusId);
            removeStatus(character, statusId, addLog);
            removedStatuses.push(statusId);
        }
    }
    
    if (removedStatuses.length > 0) {
        addLog(`${character.name} loses elevated position (${removedStatuses.join(', ')})`);
    }
    
    console.log("🔧 Removed statuses:", removedStatuses);
    return removedStatuses;
}

/** Handle falling interactions when character takes damage
 * @param {Object} character - Character that took damage
 * @param {number} damage - Amount of damage taken
 * @param {Function} addLog - Logging function
 * @returns {Object} - {additionalDamage: number, statusesApplied: Array, statusesRemoved: Array}
 */
export function handleFallingInteractions(character, damage, addLog = () => {}) {
    const fallResult = calculateFallDamage(character, damage, addLog);
    
    if (fallResult.damage === 0) {
        return { additionalDamage: 0, statusesApplied: [], statusesRemoved: [] };
    }
    
    // Apply fall damage
    character.life = Math.max(0, character.life - fallResult.damage);
    
    // Remove isHigh statuses
    const removedStatuses = removeIsHighStatuses(character, addLog);
    
    // Apply stunned status for 1 turn
    addStatus(character, 'stunned', 1, null, addLog);
    
    return {
        additionalDamage: fallResult.damage,
        statusesApplied: ['stunned'],
        statusesRemoved: removedStatuses
    };
}

/** Handle modular battle interactions (replaces hardcoded flying/pinned functions)
 * @param {Object} ability - Ability being used
 * @param {Object} attacker - Character performing the attack
 * @param {Object} target - Target character
 * @param {Function} addLog - Logging function
 * @returns {Object} - {canHit: boolean, damageMultiplier: number, shouldRemoveStatus: boolean, messages: Array}
 */
export function handleModularBattleInteractions(ability, attacker, target, addLog = () => {}) {
    const results = {
        canHit: true,
        damageMultiplier: 1.0,
        shouldRemoveStatus: false,
        messages: []
    };
    
    // Check dynamic range immunity (replaces old flying immunity check)
    if (checkDynamicRangeImmunity(target, ability, attacker)) {
        results.canHit = false;
        results.messages.push(`${attacker.name} cannot reach the elevated ${target.name} with a ${ability.range} attack!`);
        return results;
    }
    
    // Check for swoop down attack (replaces old diving attack logic)
    const swoopResult = applySwoopDownModifier(attacker, ability, 100); // Use base 100 to get multiplier
    if (swoopResult.shouldRemoveStatus) {
        results.damageMultiplier = swoopResult.damage / 100; // Extract multiplier
        results.shouldRemoveStatus = true;
        results.messages.push(`${attacker.name} swoops down with ${ability.name} for extra damage!`);
    }
    
    return results;
}

/** Handle forceful break-free when trapped character successfully attacks
 * @param {Object} attacker - Character that attacked (potentially trapped)
 * @param {Object} target - Target that was attacked
 * @param {Function} addLog - Logging function
 */
export function handleForcefulBreakFree(attacker, target, addLog = () => {}) {
    console.log("🔧 DEBUG: handleForcefulBreakFree called for", attacker.name);
    
    // Check if attacker is trapped
    const trapInfo = isCharacterTrapped(attacker);
    if (!trapInfo) {
        console.log("🔧 No trap to break free from");
        return;
    }
    
    const { status } = trapInfo;
    const trapConfig = status.trapped;
    
    // Check if this trap allows breaking free by force
    if (!trapConfig.canBreakByForce) {
        console.log("🔧 Trap doesn't allow breaking free by force");
        return;
    }
    
    console.log("🔧 Breaking free by force!");
    
    // Remove the trapped status
    removeStatus(attacker, trapInfo.statusId, addLog);
    addLog(`${attacker.name} breaks free with a powerful attack!`);
    
    // Apply stunned effect to the target (the one who was trapping)
    addStatus(target, 'stunned', 1, attacker, addLog);
    addLog(`${target.name} is stunned by the forceful break!`);
}

/** Check if character is trapped (uses status system)
 * @param {Object} character - Character to check
 * @returns {Object|null} - Trap info or null if not trapped
 */
export function isCharacterTrapped(character) {
    if (!character.statusEffects || !Array.isArray(character.statusEffects)) return null;
    
    for (const statusEffect of character.statusEffects) {
        const statusId = statusEffect.statusTag || statusEffect.statusId;
        const statusDef = StatusRegistry[statusId];
        if (statusDef && statusDef.trapped && statusDef.trapped.isTrapped) {
            return {
                statusId,
                status: statusDef,
                instance: statusEffect
            };
        }
    }
    
    return null;
}

/** Clean up trapped statuses when a character dies
 * @param {Object} deadCharacter - Character that died
 * @param {Function} addLog - Logging function
 */
export function cleanupTrappedStatusesOnDeath(deadCharacter, addLog = () => {}) {
    console.log("🔧 DEBUG: cleanupTrappedStatusesOnDeath called for", deadCharacter.name);
    
    // If the dead character was trapping others, free them
    if (deadCharacter.statusEffects) {
        // Check all other characters for trapped statuses caused by this character
        const allCharacters = [...(window.playerCharacters || []), ...(window.enemies || [])];
        
        for (const character of allCharacters) {
            if (character === deadCharacter) continue;
            
            if (character.statusEffects) {
                const trappedStatuses = character.statusEffects.filter(effect => {
                    const statusId = effect.statusTag || effect.statusId;
                    const statusDef = StatusRegistry[statusId];
                    return statusDef && statusDef.trapped && statusDef.trapped.isTrapped;
                });
                
                for (const trappedEffect of trappedStatuses) {
                    const statusId = trappedEffect.statusTag || trappedEffect.statusId;
                    removeStatus(character, statusId, addLog);
                    addLog(`${character.name} is freed as ${deadCharacter.name} can no longer maintain the pin!`);
                }
            }
        }
    }
    
    // Remove any trapped statuses from the dead character itself
    if (deadCharacter.statusEffects) {
        const trappedStatuses = deadCharacter.statusEffects.filter(effect => {
            const statusId = effect.statusTag || effect.statusId;
            const statusDef = StatusRegistry[statusId];
            return statusDef && statusDef.trapped && statusDef.trapped.isTrapped;
        });
        
        for (const trappedEffect of trappedStatuses) {
            const statusId = trappedEffect.statusTag || trappedEffect.statusId;
            removeStatus(deadCharacter, statusId, addLog);
        }
    }
}

/** Clean up all trapped statuses when battle ends
 * @param {Function} addLog - Logging function
 */
export function cleanupAllTrappedStatuses(addLog = () => {}) {
    console.log("🔧 DEBUG: cleanupAllTrappedStatuses called");
    
    const allCharacters = [...(window.playerCharacters || []), ...(window.enemies || [])];
    
    for (const character of allCharacters) {
        if (character.statusEffects) {
            const trappedStatuses = character.statusEffects.filter(effect => {
                const statusId = effect.statusTag || effect.statusId;
                const statusDef = StatusRegistry[statusId];
                return statusDef && statusDef.trapped && statusDef.trapped.isTrapped;
            });
            
            for (const trappedEffect of trappedStatuses) {
                const statusId = trappedEffect.statusTag || trappedEffect.statusId;
                removeStatus(character, statusId, addLog);
                console.log(`🔧 Cleaned up trapped status ${statusId} from ${character.name}`);
            }
        }
    }
}
