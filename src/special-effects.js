/**
 * Special Effects System - Modular effects for Interactive Story
 * 
 * This system provides dynamic effects that can be applied to any character
 * without hard-coding specific attributes or secondary stats. Each story
 * can define its own attributes and this system will adapt accordingly.
 */

/**
 * Base Attribute Boost Effect
 * Boosts one or more base attributes of a character dynamically
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} attributeBoosts - Array of boost objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applyBaseAttributeBoost(target, attributeBoosts, addLog = () => {}) {
    const appliedEffects = {
        type: 'baseAttributeBoost',
        target: target,
        boosts: [],
        originalValues: {}
    };

    // Ensure target has attributes object
    if (!target.attributes) {
        addLog(`${target.name || 'Target'} has no attributes to boost`);
        return appliedEffects;
    }

    // Process each attribute boost
    attributeBoosts.forEach(boost => {
        const { attribute, amount } = boost;
        
        // Check if target has this base attribute
        if (target.attributes.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = target.attributes[attribute];
            }
            
            // Apply the boost
            target.attributes[attribute] += amount;
            appliedEffects.boosts.push({ attribute, amount });
            
            
            addLog(`${target.name || 'Target'}'s ${attribute} increased by ${amount} (${appliedEffects.originalValues[attribute]} → ${target.attributes[attribute]})`);
        } else {
            addLog(`${target.name || 'Target'} does not have ${attribute} attribute - boost ignored`);
        }
    });

    return appliedEffects;
}

/**
 * Remove Base Attribute Boost Effect
 * Removes previously applied attribute boosts
 * 
 * @param {Object} appliedEffects - The effects object returned from applyBaseAttributeBoost
 * @param {Function} addLog - Logging function for feedback
 */
export function removeBaseAttributeBoost(appliedEffects, addLog = () => {}) {
    if (!appliedEffects || appliedEffects.type !== 'baseAttributeBoost') {
        addLog('Invalid or missing base attribute boost effects to remove');
        return;
    }

    const { target, originalValues } = appliedEffects;
    
    // Restore original values
    Object.keys(originalValues).forEach(attribute => {
        if (target.attributes && target.attributes.hasOwnProperty(attribute)) {
            const oldValue = target.attributes[attribute];
            target.attributes[attribute] = originalValues[attribute];
        }
    });
}

/**
 * Secondary Attribute Boost Effect
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

/**
 * Remove Secondary Attribute Boost Effect
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

/**
 * Secondary Attribute Debuff
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

/**
 * Remove Secondary Attribute Debuff Effect
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

/**
 * Percentage-Based Attribute Boost
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

    // Ensure target has attributes object
    if (!target.attributes) {
        addLog(`${target.name || 'Target'} has no attributes to boost`);
        return appliedEffects;
    }

    // Process each percentage boost
    percentageBoosts.forEach(boost => {
        const { attribute, percentage } = boost;
        
        // Check if target has this base attribute
        if (target.attributes.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = target.attributes[attribute];
            }
            
            // Calculate and apply the percentage boost
            const boostAmount = Math.floor(appliedEffects.originalValues[attribute] * (percentage / 100));
            target.attributes[attribute] += boostAmount;
            appliedEffects.boosts.push({ attribute, percentage, amount: boostAmount });
            
            addLog(`${target.name || 'Target'}'s ${attribute} increased by ${percentage}% (+${boostAmount}) (${appliedEffects.originalValues[attribute]} → ${target.attributes[attribute]})`);
        } else {
            addLog(`${target.name || 'Target'} does not have ${attribute} attribute - percentage boost ignored`);
        }
    });

    return appliedEffects;
}

/**
 * Generic Effect Application System
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

    // Apply base attribute boosts
    if (effectConfig.baseAttributeBoosts && effectConfig.baseAttributeBoosts.length > 0) {
        const baseBoostEffects = applyBaseAttributeBoost(target, effectConfig.baseAttributeBoosts, addLog);
        if (baseBoostEffects.boosts.length > 0) {
            allAppliedEffects.effects.push(baseBoostEffects);
        }
    }

    // Apply base attribute debuffs
    if (effectConfig.baseAttributeDebuffs && effectConfig.baseAttributeDebuffs.length > 0) {
        const baseDebuffEffects = applyBaseAttributeDebuff(target, effectConfig.baseAttributeDebuffs, addLog);
        if (baseDebuffEffects.debuffs.length > 0) {
            allAppliedEffects.effects.push(baseDebuffEffects);
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

/**
 * Remove All Special Effects
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
            case 'baseAttributeBoost':
                removeBaseAttributeBoost(effect, addLog);
                break;
            case 'baseAttributeDebuff':
                removeBaseAttributeDebuff(effect, addLog);
                break;
            case 'secondaryAttributeBoost':
                removeSecondaryAttributeBoost(effect, addLog);
                break;
            case 'secondaryAttributeDebuff':
                removeSecondaryAttributeDebuff(effect, addLog);
                break;
            case 'percentageAttributeBoost':
                removeBaseAttributeBoost(effect, addLog); // Same removal logic as base attributes
                break;
            default:
                addLog(`Unknown effect type: ${effect.type}`);
        }
    });
}

/**
 * Example Usage and Configuration Objects
 */

// Example: Focus Attack ability configuration
export const EXAMPLE_FOCUS_ATTACK = {
    baseAttributeBoosts: [
        { attribute: 'dexterity', amount: 5 },
        { attribute: 'strength', amount: 3 }
    ]
};

// Example: Magical Enhancement configuration
export const EXAMPLE_MAGICAL_ENHANCEMENT = {
    baseAttributeBoosts: [
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

/**
 * Base Attribute Debuff Effect
 * Reduces one or more base attributes of a character dynamically
 * 
 * @param {Object} target - The character to apply effects to
 * @param {Array} attributeDebuffs - Array of debuff objects
 * @param {Function} addLog - Logging function for feedback
 * @returns {Object} Applied effects for tracking/removal
 */
export function applyBaseAttributeDebuff(target, attributeDebuffs, addLog = () => {}) {
    const appliedEffects = {
        type: 'baseAttributeDebuff',
        target: target,
        debuffs: [],
        originalValues: {}
    };

    // Ensure target has attributes object
    if (!target.attributes) {
        addLog(`${target.name || 'Target'} has no attributes to debuff`);
        return appliedEffects;
    }

    // Process each attribute debuff
    attributeDebuffs.forEach(debuff => {
        const { attribute, amount } = debuff;
        
        // Check if target has this base attribute
        if (target.attributes.hasOwnProperty(attribute)) {
            // Store original value for later removal
            if (!appliedEffects.originalValues[attribute]) {
                appliedEffects.originalValues[attribute] = target.attributes[attribute];
            }
            
            // Apply the debuff (reduce the attribute)
            target.attributes[attribute] = Math.max(0, target.attributes[attribute] - amount);
            appliedEffects.debuffs.push({ attribute, amount });
            
        } else {
        }
    });

    return appliedEffects;
}

/**
 * Remove Base Attribute Debuff Effect
 * Removes previously applied attribute debuffs
 * 
 * @param {Object} appliedEffects - The effects object returned from applyBaseAttributeDebuff
 * @param {Function} addLog - Logging function for feedback
 */
export function removeBaseAttributeDebuff(appliedEffects, addLog = () => {}) {
    if (!appliedEffects || appliedEffects.type !== 'baseAttributeDebuff') {
        addLog('Invalid or missing base attribute debuff effects to remove');
        return;
    }

    const { target, originalValues } = appliedEffects;
    
    // Restore original values
    Object.keys(originalValues).forEach(attribute => {
        if (target.attributes && target.attributes.hasOwnProperty(attribute)) {
            const oldValue = target.attributes[attribute];
            target.attributes[attribute] = originalValues[attribute];
        }
    });
}

// ============================================================================
// DAMAGE IMMUNITY AND RESISTANCE SYSTEM
// ============================================================================

/**
 * Centralized Damage Immunity System
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

/**
 * Quick immunity check for general damage
 * Use this in battle.js and other systems for any damage dealing
 */
export function checkDamageImmunity(character, damageType, damageSource = 'general', addLog = () => {}) {
    return DamageImmunitySystem.isImmuneToDamage(character, damageType, damageSource, addLog);
}

/**
 * Apply damage with full immunity and resistance checking
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

/**
 * Check if character has any damage resistance (not immunity)
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

/**
 * Environmental damage application with immunity checking
 * Use this for environmental hazards, traps, etc.
 */
export function applyEnvironmentalDamage(character, damage, damageType, environmentName, addLog = () => {}) {
    const damageSource = `environment_${environmentName}`;
    return applyDamageWithImmunity(character, damage, damageType, damageSource, addLog);
}

// ============================================================================
// TRAPPED STATUS STRUGGLE MECHANICS
// ============================================================================

/**
 * Calculate struggle success based on strength vs strength+weight (enemy-based)
 * Used for pinned status where opponent stats matter
 */
export function calculateEnemyBasedStruggle(character, opponent, status, addLog = () => {}) {
    const characterStrength = character.attributes?.strength || 10;
    const opponentStrength = opponent.attributes?.strength || 10;
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

/**
 * Calculate struggle success against status difficulty (status-based)
 * Used for pinned status - contested roll between player and enemy
 */
export function calculateStatusBasedStruggle(character, status, addLog = () => {}, opponent = null) {
    const characterStrength = character.attributes?.strength || 10;
    
    // If we have an opponent and this is a pinned status, use contested roll
    if (opponent && (status.statusTag === 'pinned' || status.name === 'Pinned')) {
        const opponentStrength = opponent.attributes?.strength || 10;
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

/**
 * Enhanced struggle calculation that considers usesEnemyStats property
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

/**
 * Handle forceful break free when trapped character successfully hits an attack
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

/**
 * Check if trapped status should end when opponent attacks without maintaining trap
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

/**
 * Check if a character is currently flying
 */
export function isCharacterFlying(character) {
    if (!character.statusEffects) return false;
    
    return character.statusEffects.some(status => 
        status.statusTag === 'flying' || status.name === 'Flying'
    );
}

/**
 * Handle diving attack when flying character uses close/physical attack
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

/**
 * Handle fall damage when flying character is hit by ranged attack
 * Calculates fall damage and determines if flying should end
 */
export function handleFlyingRangedHit(target, ability, addLog = () => {}) {
    if (!isCharacterFlying(target)) {
        return { shouldFall: false, fallDamage: 0 };
    }

    // Check if it's a ranged/magic attack
    if (ability.range === 'ranged' || ability.type === 'magic') {
        const fallDamage = Math.max(5, Math.floor(target.maxLife * 0.08)); // 8% of max life
        
        addLog(`${target.name} is struck from the sky by ${ability.name}!`);
        addLog(`${target.name} falls and takes ${fallDamage} fall damage!`);
        
        // Apply fall damage
        target.life = Math.max(0, target.life - fallDamage);
        
        return {
            shouldFall: true,
            fallDamage: fallDamage,
            shouldRemoveFlying: true
        };
    }
    
    return { shouldFall: false, fallDamage: 0 };
}

/**
 * Check if flying character should be immune to close attacks
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

/**
 * Remove flying status from character
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
