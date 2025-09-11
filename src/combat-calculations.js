// combat-calculations.js - Combat damage, accuracy, and critical hit calculations

import { isStatusActive, addStatus, removeStatus, applyStunnedStatus, isCharacterTrapped, StatusRegistry, equipMount, tameMount, linkCharacters, removeMountPartnership } from './status.js';
import { updateLifeBar } from './ui.js';
import { calculateTypeEffectiveness, calculateAbilityTypeBonus } from './elements.js';
import { calculateBestTypeEffectiveness, calculateBestAbilityTypeBonus, getPrimaryElementalAlignment, getWeight, getHeight } from './element-helpers.js';
// Import fall damage and swoop down systems
import { handleFallingInteractions, applySwoopDownModifier, cleanupTrappedStatusesOnDeath } from './special-effects.js';
import { getActiveEnvironment, modifyAbilityByEnvironment } from './environments.js';
import { isTargetAlly } from './abilities.js';

/**
 * Calculate final accuracy for an attack including size and weight factors
 * 🎯 HIT DETECTION SYSTEM: This calculates the % chance to hit (30-100%)
 * The battle system then rolls 1-100 and compares: roll <= accuracy = HIT
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @param {Object} defender - The defending character
 * @param {number} attackerSpeed - Attacker's effective speed
 * @param {number} defenderSpeed - Defender's effective speed
 * @param {number} accuracyMultiplier - Accuracy multiplier (for status effects)
 * @returns {number} - Final accuracy percentage (minimum 30%, maximum 100%)
 */
export function calculateAccuracy(ability, attacker, defender, attackerSpeed, defenderSpeed, accuracyMultiplier = 1) {
    const baseAccuracy = ability.accuracy !== undefined ? ability.accuracy : 100;
    
    // Base accuracy from speed difference
    let finalAccuracy = baseAccuracy + (attackerSpeed - defenderSpeed) * 2;
    
    // Size-based accuracy modifiers
    const attackerHeight = getHeight(attacker, 175); // Default: 175cm (medium)
    const defenderHeight = getHeight(defender, 175); // Default: 175cm (medium)
    
    // Convert height to size categories for accuracy calculations
    const heightToSizeCategory = (height) => {
        if (height < 85) return 'tiny';
        if (height < 150) return 'small';
        if (height < 220) return 'medium';
        if (height < 290) return 'large';
        if (height < 360) return 'huge';
        if (height < 500) return 'massive';
        return 'colossal';
    };
    
    const attackerSize = heightToSizeCategory(attackerHeight);
    const defenderSize = heightToSizeCategory(defenderHeight);
    
    // Target size modifier (smaller = harder to hit, larger = easier to hit)
    let targetSizeModifier = 0;
    switch(defenderSize) {
        case 'tiny': targetSizeModifier = -15; break;    // Tiny targets are very hard to hit
        case 'small': targetSizeModifier = -8; break;    // Small targets are harder to hit
        case 'medium': targetSizeModifier = 0; break;    // Medium is baseline
        case 'large': targetSizeModifier = +5; break;    // Large targets are easier to hit
        case 'huge': targetSizeModifier = +10; break;    // Huge targets are much easier to hit
        case 'massive': targetSizeModifier = +15; break; // Massive targets are very easy to hit
        case 'colossal': targetSizeModifier = +20; break; // Colossal targets are extremely easy to hit
    }
    
    // Weight-based agility modifiers
    const attackerWeight = getWeight(attacker, 65); // Default: 65kg (average human)
    const defenderWeight = getWeight(defender, 65); // Default: 65kg (average human)
    
    // Attacker weight modifier (heavier = less accurate)
    let attackerAgilityModifier = 0;
    if (attackerWeight < 50) attackerAgilityModifier = +8;      // Very light = more agile
    else if (attackerWeight < 70) attackerAgilityModifier = +3; // Light = slightly more agile
    else if (attackerWeight < 90) attackerAgilityModifier = 0;  // Medium weight = baseline
    else if (attackerWeight < 120) attackerAgilityModifier = -3; // Heavy = less agile
    else attackerAgilityModifier = -8;                          // Very heavy = much less agile
    
    // Defender weight modifier (heavier = easier to hit, lighter = harder to hit)
    let defenderAgilityModifier = 0;
    if (defenderWeight < 50) defenderAgilityModifier = -8;      // Very light = harder to hit
    else if (defenderWeight < 70) defenderAgilityModifier = -3; // Light = slightly harder to hit
    else if (defenderWeight < 90) defenderAgilityModifier = 0;  // Medium weight = baseline
    else if (defenderWeight < 120) defenderAgilityModifier = +3; // Heavy = easier to hit
    else defenderAgilityModifier = +8;                          // Very heavy = much easier to hit
    
    // Apply all modifiers
    finalAccuracy += targetSizeModifier + attackerAgilityModifier + defenderAgilityModifier;
    
    // Apply environmental accuracy penalties
    const activeEnv = getActiveEnvironment();
    if (activeEnv && attacker.misc?.elementalAlignments) {
        // Use a mock ability to check environmental modifications
        const mockAbility = { element: getPrimaryElementalAlignment(attacker) || 'neutral' };
        const envModification = modifyAbilityByEnvironment(mockAbility, attacker, attacker, 100, finalAccuracy);
        finalAccuracy = envModification.accuracy;
    }
    
    // Apply status multiplier and clamp to valid range (minimum 30%, maximum 100%)
    finalAccuracy = Math.max(30, Math.min(100, finalAccuracy * accuracyMultiplier));
    

    
    return Math.floor(finalAccuracy);
}

/**
 * Calculate damage for an attack using organized step-by-step formula
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @param {Object} defender - The defending character
 * @returns {Object} - Object containing damage info
 */
export function calculateDamage(ability, attacker, defender) {
    // Step 1: Calculate base damage from ability's min/max damage
    const baseDamage = Math.floor(Math.random() * (ability.maxDamage - ability.minDamage + 1)) + ability.minDamage;
    
    // Step 2: Initialize damage components
    let weightBonusDamage = 0;
    let sizeDifferenceDamage = 0;
    let elevationMultiplier = 1.0;
    let defense = 0;
    
    // Step 3: Check if ability is physical
    if (ability.type === "physical") {
        // Use physical defense
        defense = ability.breaksDefense ? 0 : (defender.secondary?.physicalDefense || 0);
        
        // Step 4: Calculate weight bonus if ability uses weight
        if (ability.usesWeight) {
            weightBonusDamage = calculateWeightBonus(ability, attacker);
        }
        
        // Step 5: Calculate size difference damage
        sizeDifferenceDamage = calculateSizeBonus(attacker, defender);
        
        // ✨ NEW: Step 6: Check for elevation-based attacks (swoop down)
        const swoopResult = applySwoopDownModifier(attacker, ability, baseDamage);
        if (swoopResult.shouldRemoveStatus) {
            elevationMultiplier = swoopResult.damage / baseDamage; // Get the multiplier
        }
    }
    // Step 7: Check if ability is magic
    else if (ability.type === "magic") {
        // Use magic defense
        defense = ability.breaksDefense ? 0 : (defender.secondary?.magicDefense || 0);
    }
    
    // Step 8: Calculate type effectiveness multiplier
    let typeMultiplier = 1.0;
    let typeEffectivenessText = "";
    if (ability.elementalType && defender.misc?.elementalAlignments) {
        const effectiveness = calculateBestTypeEffectiveness(ability.elementalType, defender);
        typeMultiplier = effectiveness.multiplier;
        if (typeMultiplier === 0) {
            typeEffectivenessText = "It has no effect!";
        } else if (typeMultiplier === 0.7) {
            typeEffectivenessText = "It's not very effective...";
        } else if (typeMultiplier === 1.5) {
            typeEffectivenessText = "It's super effective!";
        }
    }
    
    // Step 9: Calculate ability type bonus (mastery bonus)
    let abilityTypeBonus = 1.0;
    let abilityBonusText = "";
    if (ability.elementalType && attacker.misc?.elementalAlignments) {
        const bonusResult = calculateBestAbilityTypeBonus(attacker, ability.elementalType);
        abilityTypeBonus = bonusResult.bonus;
        if (abilityTypeBonus > 1.0 && bonusResult.matchedType) {
            abilityBonusText = `${bonusResult.matchedType} type mastery enhances the ${ability.elementalType} ability!`;
        }
    }
    
    // Step 10: Calculate environmental damage reduction
    let environmentalMultiplier = 1.0;
    let environmentalEffectText = "";
    
    // Check if there's an active battle environment that affects the attacker
    const activeEnv = getActiveEnvironment();
    if (activeEnv && attacker.misc?.elementalAlignments) {
        const primaryType = getPrimaryElementalAlignment(attacker);
        // Use a mock ability to check environmental modifications
        const mockAbility = { element: primaryType || 'neutral' };
        const envModification = modifyAbilityByEnvironment(mockAbility, attacker, attacker, 100, 100);
        
        if (envModification.damage < 100) {
            environmentalMultiplier = envModification.damage / 100;
            environmentalEffectText = `${activeEnv.name} environment reduces ${primaryType} attack power!`;
        }
    }
    
    // Step 11: Apply the complete damage formula
    // ((((baseDamage + weightBonusDamage + sizeDifferenceDamage) * elevationMultiplier) * typeMultiplier * abilityTypeBonus * environmentalMultiplier) - defense)
    const preDefenseDamage = (baseDamage + weightBonusDamage + sizeDifferenceDamage) * elevationMultiplier * typeMultiplier * abilityTypeBonus * environmentalMultiplier;
    const finalDamage = Math.max(0, Math.floor(preDefenseDamage - defense));
    
    
    return {
        baseDamage,
        weightBonusDamage,
        sizeDifferenceDamage,
        elevationMultiplier,
        typeMultiplier,
        abilityTypeBonus,
        environmentalMultiplier,
        defense,
        preDefenseDamage: Math.floor(preDefenseDamage),
        finalDamage,
        defenseBypass: ability.breaksDefense,
        typeEffectivenessText,
        abilityBonusText,
        environmentalEffectText,
        // Legacy properties for compatibility
        attackStat: weightBonusDamage + sizeDifferenceDamage,
        defenseStat: defense,
        sizeBonus: sizeDifferenceDamage,
        weightBonus: weightBonusDamage
    };
}

/**
 * Calculate size-based damage bonus for physical attacks
 * @param {Object} attacker - The attacking character
 * @param {Object} defender - The defending character
 * @returns {number} - Size bonus damage
 */
function calculateSizeBonus(attacker, defender) {
    const attackerHeight = getHeight(attacker, 175); // Default height: 175cm (medium)
    const defenderHeight = getHeight(defender, 175); // Default height: 175cm (medium)
    
    // Convert height to size category values
    // Height ranges: tiny(<120), small(120-150), medium(150-190), large(190-230), huge(230-270), massive(>270)
    const heightToSizeValue = (height) => {
        if (height < 85) return 1; // tiny
        if (height < 150) return 2; // small
        if (height < 220) return 3; // medium
        if (height < 290) return 4; // large
        if (height < 360) return 5; // huge
        if (height < 500) return 6; // massive
        return 7; // colossal
    };
    
    const attackerValue = heightToSizeValue(attackerHeight);
    const defenderValue = heightToSizeValue(defenderHeight);
    const sizeDifference = attackerValue - defenderValue;
    
    // Each size category difference adds +/-5 damage
    return sizeDifference * 5;
}

/**
 * Calculate weight-based damage bonus for specific abilities
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @returns {number} - Weight bonus damage
 */
function calculateWeightBonus(ability, attacker) {
    // Only abilities with usesWeight property benefit from weight
    if (!ability.usesWeight) {
        return 0;
    }
    
    let weight = getWeight(attacker, 65); // Default weight: 65kg (average human)
    
    // Check if attacker is in a mount formation
    if (isStatusActive(attacker, 'rider') && attacker.mountPartner) {
        // Rider using abilities gets combined weight of rider + mount
        const mountWeight = getWeight(attacker.mountPartner, 65);
        weight += mountWeight;
    } else if (isStatusActive(attacker, 'mount') && attacker.riderPartner) {
        // Mount using abilities gets combined weight of mount + rider
        const riderWeight = getWeight(attacker.riderPartner, 65);
        weight += riderWeight;
    }

    // Weight bonus: 1 point per 15 kg, with minimum of 1
    return Math.max(1, Math.floor(weight / 15));
}

/**
 * Calculate critical hit
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @param {number} baseDamage - Base damage before crit
 * @param {boolean} isPlayer - Whether attacker is player (affects crit calculation)
 * @returns {Object} - Object containing crit info
 */
export function calculateCriticalHit(ability, attacker, baseDamage, isPlayer = true) {
    if (baseDamage <= 0 || (ability.type !== "physical" && ability.type !== "magic")) {
        return { isCritical: false, finalDamage: baseDamage, critChance: 0 };
    }

    let baseCritChance = 5;
    let dexterityBonus = 0;

    if (isPlayer) {
        // Player crit calculation: 1% per 2 points of dexterity after 10
        dexterityBonus = Math.floor((attacker.primary?.dexterity || 0 - 10) / 2);
        dexterityBonus = Math.max(0, dexterityBonus);
    } else {
        // Enemy crit calculation: direct dexterity bonus
        dexterityBonus = attacker.primary?.dexterity || 0;
    }

    const totalCritChance = baseCritChance + dexterityBonus;
    const abilityCritBonus = ability.critChance ? (ability.critChance * 100) : 0;
    const finalCritChance = Math.min(isPlayer ? 100 : 50, totalCritChance + abilityCritBonus);

    const critRoll = Math.floor(Math.random() * 100) + 1;
    const isCritical = critRoll <= finalCritChance;

    if (isCritical) {
        const critMultiplier = ability.critMultiplier || 2.0;
        const finalDamage = Math.floor(baseDamage * critMultiplier);
        return { isCritical: true, finalDamage, critChance: finalCritChance };
    }

    return { isCritical: false, finalDamage: baseDamage, critChance: finalCritChance };
}

/**
 * Apply damage and handle special effects
 * @param {Object} target - The target receiving damage
 * @param {number} damage - Amount of damage
 * @param {Object} ability - The ability used
 * @param {Object} attacker - The attacking character
 * @param {Function} addLog - Logging function
 * @returns {Object} - Object containing overkill info
 */
export function applyDamage(target, damage, ability, attacker, addLog) {
    let isOverkill = false;
    
    if (damage > 0) {
        const originalLife = target.secondary.life;
        target.secondary.life -= damage;
        
        // ✨ NEW: Handle falling interactions if target has isHigh status
        const fallResult = handleFallingInteractions(target, damage, addLog);
        if (fallResult.additionalDamage > 0) {
            addLog(`💥 Fall damage adds ${fallResult.additionalDamage} more damage!`);
        }
        
        // Check for overkill (damage would leave target below -20 HP)
        if (target.secondary.life < -20) {
            isOverkill = true;
        }
        
        // Clamp life to 0 for visual display (no negative life shown to players)
        if (target.secondary.life < 0) {
            target.secondary.life = 0;
        }
        
        // Clean up mount partnerships when character dies
        if (target.secondary.life <= 0) {
            removeMountPartnership(target, addLog);
            
            // Clean up trapped statuses when character dies
            cleanupTrappedStatusesOnDeath(target, addLog);
        }

        updateLifeBar(target.secondary.life, target.secondary.maxLife);        // Life steal mechanic
        if (ability.lifeSteal && ability.lifeSteal > 0) {
            const healAmount = Math.floor(damage * ability.lifeSteal);
            // Don't heal dead characters unless it's a revive ability
            if (healAmount > 0 && (attacker.secondary.life > 0 || ability.revive)) {
                attacker.secondary.life = Math.min(attacker.secondary.maxLife, attacker.secondary.life + healAmount);
                addLog(`${attacker.name} steals ${healAmount} health!`);
                updateLifeBar(attacker.secondary.life, attacker.secondary.maxLife);
            }
        }
    }
    
    return { isOverkill };
}

/**
 * Handle status effects from abilities
 * @param {Object} ability - The ability used
 * @param {Object} attacker - The attacking character
 * @param {Object} target - The target character
 * @param {Function} addLog - Logging function
 */
export function handleAbilityEffects(ability, attacker, target, addLog, battleState = {}) {
    // Special handling for mount ability
    if (ability.id === 'mount') {
        return handleMountAbility(ability, attacker, target, addLog, battleState);
    }

    // Check if ability has a custom apply function (new ability system)
    if (typeof ability.apply === 'function') {
        try {
            return ability.apply(attacker, target, addLog);
        } catch (error) {
            console.error(`Error applying ability ${ability.name}:`, error);
            addLog(`${ability.name} failed to apply properly!`);
            return false;
        }
    }

    // NEW STATUS SYSTEM: Handle statusToApply format
    if (ability.statusToApply && ability.statusChance) {
        if (Math.random() < ability.statusChance) {
            const statusTarget = ability.targetType === 'self' ? attacker : target;
            // Use nullish coalescing to properly handle 0 values
            const duration = ability.statusDuration ?? 3;
            addStatus(statusTarget, ability.statusToApply, duration, attacker, addLog);
        }
    }

    // NEW STATUS SYSTEM: Handle secondary status effects
    if (ability.secondaryStatusToApply && ability.secondaryStatusChance) {
        if (Math.random() < ability.secondaryStatusChance) {
            const statusTarget = ability.targetType === 'self' ? attacker : target;
            // Use nullish coalescing to properly handle 0 values
            const duration = ability.secondaryStatusDuration ?? 1;
            addStatus(statusTarget, ability.secondaryStatusToApply, duration, attacker, addLog);
        }
    }

    // Apply status effects (legacy system)
    if (ability.effect && Math.random() < (ability.effect.chance || 1)) {
        const statusTarget = ability.effect.target === 'self' ? attacker : target;
        
        // Special handling for pinned status
        if (ability.effect.type === 'pinned') {
            // Use nullish coalescing to properly handle 0 values
            const duration = ability.effect.turns ?? 0;
            addStatus(statusTarget, 'pinned', duration, attacker, addLog);
        } 
        // Special handling for stunned status
        else if (ability.effect.type === 'stunned') {
            // Use nullish coalescing to properly handle 0 values (though stunned should typically have turns > 0)
            const duration = ability.effect.turns ?? 1;
            applyStunnedStatus(statusTarget, duration, addLog);
        }
        // Special handling for DoT effects (poison, burn, etc.)
        else if (ability.effect.type === 'poison' || ability.effect.type === 'burn' || ability.effect.type === 'poisoned' || ability.effect.type === 'burned') {
            // Check if this is a DoT status by looking in StatusRegistry
            const statusDef = StatusRegistry[ability.effect.type];
            if (statusDef && statusDef.DoT && statusDef.DoT.isDoT) {
                // Use the new DoT system
                // Use nullish coalescing to properly handle 0 values
                const duration = ability.effect.turns ?? 1;
                addStatus(statusTarget, ability.effect.type, duration, attacker, addLog);
            } else {
                // Fall back to standard status application
                addStatus(
                    statusTarget,
                    ability.effect.type,
                    ability.effect.turns || 1,
                    attacker,
                    addLog
                );
            }
        } 
        else {
            // Use new status system for other effects
            addStatus(
                statusTarget,
                ability.effect.type,
                ability.effect.turns || 1,
                attacker,
                addLog
            );
        }
    }

    // Handle status removal from self
    if (ability.removesStatusSelf && Array.isArray(ability.removesStatusSelf)) {
        ability.removesStatusSelf.forEach(statusType => {
            if (isStatusActive(attacker, statusType)) {
                removeStatus(attacker, statusType, addLog);
                addLog(`${attacker.name} is no longer ${statusType}!`);
            }
        });
    }

    // Handle status removal from target
    if (ability.removesStatusTarget && Array.isArray(ability.removesStatusTarget)) {
        ability.removesStatusTarget.forEach(statusType => {
            if (isStatusActive(target, statusType)) {
                removeStatus(target, statusType, addLog);
                addLog(`${target.name} is no longer ${statusType}!`);
            }
        });
    }

    // Backward compatibility: handle old removesPin property
    if (ability.removesPin && isStatusActive(target, 'pinned')) {
        removeStatus(target, 'pinned', addLog);
        addLog(`${target.name} is no longer pinned!`);
    }
}

/**
 * Handle mount ability - allows one character to mount another with different effects for allies/enemies
 * @param {Object} ability - The mount ability being used
 * @param {Object} attacker - The character attempting to mount (rider)
 * @param {Object} target - The character being mounted (mount)
 * @param {Function} addLog - Logging function
 * @param {Object} battleState - Battle state for ally/enemy determination
 */
export function handleMountAbility(ability, attacker, target, addLog, battleState = {}) {
    // Check if already mounted - allow multiple riders on same mount
    if (isStatusActive(attacker, 'rider')) {
        addLog(`${attacker.name} is already riding another mount!`);
        return { success: false, damage: 0 };
    }

    // Determine if target is an ally
    const isAlly = isTargetAlly(attacker, target, battleState);
    
    // Calculate mount success based on size and compatibility
    const attackerSize = getWeight(attacker, 65);
    const targetSize = getWeight(target, 65);
    const sizeRatio = attackerSize / targetSize;
    
    // Size-based mount logic
    let mountResult = { success: false, damage: 0, effect: 'fail' };
    
    if (sizeRatio <= 0.5) {
        // Rider is much smaller - easy mount
        mountResult = { success: true, damage: 0, effect: 'mount', reason: `${attacker.name} easily mounts ${target.name}!` };
    } else if (sizeRatio <= 1.5) {
        // Similar sizes - mount with some struggle
        const damage = Math.floor(Math.random() * 10) + 5;
        mountResult = { success: true, damage, effect: 'mount_with_struggle', reason: `${attacker.name} manages to mount ${target.name} after a struggle!` };
    } else {
        // Rider is much larger - potential crush
        if (targetSize < attackerSize * 0.3) {
            const damage = Math.floor(attackerSize * 0.8);
            mountResult = { success: false, damage, effect: 'crush', reason: `${attacker.name} is too heavy and crushes ${target.name}!` };
        } else {
            mountResult = { success: false, damage: 0, effect: 'fail', reason: `${attacker.name} cannot mount ${target.name} - incompatible sizes!` };
        }
    }
    
    // Handle the result
    switch (mountResult.effect) {
        case 'mount':
            // Perfect mount - create partnership
            if (isAlly) {
                tameMount(attacker, target, addLog);
            } else {
                equipMount(attacker, target, addLog);
            }
            addLog(mountResult.reason);
            return { success: true, damage: 0 };
            
        case 'mount_with_struggle':
            // Mount succeeds but target takes damage and can still act
            target.secondary.life = Math.max(0, target.secondary.life - mountResult.damage);
            if (isAlly) {
                tameMount(attacker, target, addLog);
            } else {
                equipMount(attacker, target, addLog);
            }
            addLog(mountResult.reason);
            addLog(`${target.name} takes ${mountResult.damage} damage from the struggle!`);
            updateLifeBar(target.secondary.life, target.secondary.maxLife);
            return { success: true, damage: mountResult.damage };
            
        case 'crush':
            // Rider is too heavy and crushes the target
            target.secondary.life = Math.max(0, target.secondary.life - mountResult.damage);
            addLog(mountResult.reason);
            addLog(`${target.name} takes ${mountResult.damage} crushing damage!`);
            updateLifeBar(target.secondary.life, target.secondary.maxLife);
            return { success: false, damage: mountResult.damage };
            
        case 'fail':
        default:
            // Mount attempt failed
            addLog(mountResult.reason);
            return { success: false, damage: 0 };
    }
}

/**
 * Calculate environmental penalty for damage based on character type and environment (Legacy compatibility)
 * @param {string} characterType - The character's elemental type
 * @param {string} environmentType - The environment type (volcanic, underwater, etc.)
 * @param {number} intensity - Environment intensity (1-10)
 * @returns {Object} Environmental penalty information
 */
export function calculateEnvironmentalPenalty(characterType, environmentType, intensity = 1) {
    // Create a mock character object for the new system
    const mockCharacter = { 
        type: characterType,
        misc: { elementalAlignments: [characterType] }
    };
    
    // Set temporary environment and check penalties
    const currentEnv = getActiveEnvironment();
    import('./environments.js').then(({ setActiveEnvironment }) => {
        setActiveEnvironment(environmentType, intensity, () => {});
    });
    
    // Use mock ability to check environmental modifications
    const mockAbility = { element: characterType };
    const envModification = modifyAbilityByEnvironment(mockAbility, mockCharacter, mockCharacter, 100, 100);
    
    const damageReduction = envModification.damage < 100 ? (100 - envModification.damage) / 100 : 0;
    
    // Convert to old format for backwards compatibility
    return {
        damageReduction: damageReduction,
        description: damageReduction > 0 ? 
            `${environmentType} environment reduces ${characterType} attack power by ${Math.round(damageReduction * 100)}%!` : "",
        environmentType,
        intensity,
        characterType
    };
}

/**
 * Apply healing to a target character
 * @param {Object} target - The target receiving healing
 * @param {number} healAmount - Amount of healing
 * @param {Object} ability - The ability used (optional, for revive check)
 * @param {Object} caster - The character casting the heal (optional)
 * @param {Function} addLog - Logging function
 * @returns {number} - Actual amount healed
 */
export function applyHealing(target, healAmount, ability = null, caster = null, addLog = () => {}) {
    // Don't heal dead characters unless it's a revive ability
    if (target.secondary.life <= 0 && (!ability || !ability.revive)) {
        if (addLog) addLog(`${target.name} is dead and cannot be healed!`);
        return 0;
    }

    const originalLife = target.secondary.life;
    target.secondary.life = Math.min(target.secondary.maxLife, target.secondary.life + healAmount);
    const actualHealed = target.secondary.life - originalLife;

    if (actualHealed > 0) {
        if (addLog) {
            if (originalLife <= 0) {
                addLog(`${target.name} is revived with ${actualHealed} health!`);
            } else {
                addLog(`${target.name} recovers ${actualHealed} health!`);
            }
        }
        updateLifeBar(target.secondary.life, target.secondary.maxLife);
    }

    return actualHealed;
}
