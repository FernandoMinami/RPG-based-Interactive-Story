// combat-calculations.js - Combat damage, accuracy, and critical hit calculations

import { isStatusActive, applyStatus, applyPinnedStatus, applyStunnedStatus, isCharacterTrapped, BuffRegistry, StatusRegistry, applyStatusDoT } from './status.js';
import { updateLifeBar } from './ui.js';
import { calculateTypeEffectiveness, calculateAbilityTypeBonus } from './types.js';
import { getEnvironmentalPenalties } from './environmental.js';

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
    const attackerHeight = attacker.height || 175; // Default: 175cm (medium)
    const defenderHeight = defender.height || 175; // Default: 175cm (medium)
    
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
    const attackerWeight = attacker.weight || 65; // Default: 65kg (average human)
    const defenderWeight = defender.weight || 65; // Default: 65kg (average human)
    
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
    if (window.battleEnvironment && attacker.type) {
        const penalties = getEnvironmentalPenalties(attacker, window.battleEnvironment.type, window.battleEnvironment.intensity);
        if (penalties.accuracyPenalty > 0) {
            finalAccuracy *= (1 - penalties.accuracyPenalty);
        }
    }
    
    // Apply status multiplier and clamp to valid range (minimum 30%, maximum 100%)
    finalAccuracy = Math.max(30, Math.min(100, finalAccuracy * accuracyMultiplier));
    
    // Debug log for accuracy calculation
    /*console.log(`🎯 ACCURACY CALCULATION:
    Base Accuracy: ${baseAccuracy}%
    Speed Modifier: ${(attackerSpeed - defenderSpeed) * 2} (${attackerSpeed} - ${defenderSpeed})
    Target Size: ${defenderSize} = ${targetSizeModifier}%
    Attacker Agility: ${attackerWeight}kg = ${attackerAgilityModifier}%
    Defender Agility: ${defenderWeight}kg = ${defenderAgilityModifier}%
    Status Multiplier: ${accuracyMultiplier}x
    FINAL ACCURACY: ${Math.floor(finalAccuracy)}%`);*/
    
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
    let flyingMultiplier = 1.0;
    let defense = 0;
    
    // Step 3: Check if ability is physical
    if (ability.type === "physical") {
        // Use physical defense
        defense = ability.breaksDefense ? 0 : (defender.secondary?.physicDefense || 0);
        
        // Step 4: Calculate weight bonus if ability uses weight
        if (ability.usesWeight) {
            weightBonusDamage = calculateWeightBonus(ability, attacker);
        }
        
        // Step 5: Calculate size difference damage
        sizeDifferenceDamage = calculateSizeBonus(attacker, defender);
        
        // Step 6: Check if attacker is flying (diving attack)
        if (isStatusActive(attacker, 'flying')) {
            flyingMultiplier = 1.6;
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
    if (ability.elementalType && defender.type) {
        typeMultiplier = calculateTypeEffectiveness(ability.elementalType, defender.type);
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
    if (ability.elementalType && attacker.type) {
        abilityTypeBonus = calculateAbilityTypeBonus(attacker.type, ability.elementalType);
        if (abilityTypeBonus > 1.0) {
            abilityBonusText = `${attacker.type} type mastery enhances the ${ability.elementalType} ability!`;
        }
    }
    
    // Step 10: Calculate environmental damage reduction
    let environmentalMultiplier = 1.0;
    let environmentalEffectText = "";
    
    // Check if there's an active battle environment that affects the attacker
    if (window.battleEnvironment && attacker.type) {
        const penalties = getEnvironmentalPenalties(attacker, window.battleEnvironment.type, window.battleEnvironment.intensity);
        if (penalties.damagePenalty > 0) {
            environmentalMultiplier = 1.0 - penalties.damagePenalty;
            environmentalEffectText = `${window.battleEnvironment.type} environment reduces ${attacker.type} attack power!`;
        }
    }
    
    // Step 11: Apply the complete damage formula
    // ((((baseDamage + weightBonusDamage + sizeDifferenceDamage) * flyingMultiplier) * typeMultiplier * abilityTypeBonus * environmentalMultiplier) - defense)
    const preDefenseDamage = (baseDamage + weightBonusDamage + sizeDifferenceDamage) * flyingMultiplier * typeMultiplier * abilityTypeBonus * environmentalMultiplier;
    const finalDamage = Math.max(0, Math.floor(preDefenseDamage - defense));
    
    // Debug log for damage calculation (temporarily disabled)
    /*console.log(`🔥 DAMAGE CALCULATION BREAKDOWN:
    Base Damage: ${baseDamage}
    Weight Bonus: ${weightBonusDamage}
    Size Difference: ${sizeDifferenceDamage}
    Flying Multiplier: ${flyingMultiplier}x
    Type Multiplier: ${typeMultiplier}x
    Ability Type Bonus: ${abilityTypeBonus}x
    Defense: ${defense}
    
    Formula: ((((${baseDamage} + ${weightBonusDamage} + ${sizeDifferenceDamage}) * ${flyingMultiplier}) * ${typeMultiplier} * ${abilityTypeBonus}) - ${defense})
    Step 1: ${baseDamage} + ${weightBonusDamage} + ${sizeDifferenceDamage} = ${baseDamage + weightBonusDamage + sizeDifferenceDamage}
    Step 2: ${baseDamage + weightBonusDamage + sizeDifferenceDamage} * ${flyingMultiplier} = ${(baseDamage + weightBonusDamage + sizeDifferenceDamage) * flyingMultiplier}
    Step 3: ${(baseDamage + weightBonusDamage + sizeDifferenceDamage) * flyingMultiplier} * ${typeMultiplier} = ${(baseDamage + weightBonusDamage + sizeDifferenceDamage) * flyingMultiplier * typeMultiplier}
    Step 4: ${(baseDamage + weightBonusDamage + sizeDifferenceDamage) * flyingMultiplier * typeMultiplier} * ${abilityTypeBonus} = ${preDefenseDamage}
    Step 5: ${preDefenseDamage} - ${defense} = ${finalDamage}
    
    FINAL DAMAGE (before crit): ${finalDamage}`)*/;
    
    return {
        baseDamage,
        weightBonusDamage,
        sizeDifferenceDamage,
        flyingMultiplier,
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
    const attackerHeight = attacker.height || 175; // Default height: 175cm (medium)
    const defenderHeight = defender.height || 175; // Default height: 175cm (medium)
    
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
    
    const weight = attacker.weight || 65; // Default weight: 65kg (average human)

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
        dexterityBonus = Math.floor((attacker.attributes?.dexterity || 0 - 10) / 2);
        dexterityBonus = Math.max(0, dexterityBonus);
    } else {
        // Enemy crit calculation: direct dexterity bonus
        dexterityBonus = attacker.attributes?.dexterity || 0;
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
        const originalLife = target.life;
        target.life -= damage;
        
        // Check for overkill (damage would leave target below -20 HP)
        if (target.life < -20) {
            isOverkill = true;
        }
        
        // Clamp life to 0 for visual display (no negative life shown to players)
        if (target.life < 0) {
            target.life = 0;
        }
        
        updateLifeBar(target.life, target.maxLife);

        // Life steal mechanic
        if (ability.lifeSteal && ability.lifeSteal > 0) {
            const healAmount = Math.floor(damage * ability.lifeSteal);
            if (healAmount > 0) {
                attacker.life = Math.min(attacker.maxLife, attacker.life + healAmount);
                addLog(`${attacker.name} steals ${healAmount} health!`);
                updateLifeBar(attacker.life, attacker.maxLife);
            }
        }
    }
    
    return { isOverkill };
}

/**
 * Handle flying and range interactions
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @param {Object} target - The target character
 * @param {Function} addLog - Logging function
 * @returns {Object} - Object containing interaction results
 */
export function handleFlyingInteractions(ability, attacker, target, addLog) {
    let canHit = true;
    let extraDamage = 0;
    let damageMultiplier = 1.0;
    let messages = [];

    // Check if target is flying and ability is close range
    if (isStatusActive(target, 'flying') && (ability.range === "close" || ability.type === "physical")) {
        // Check if attacker is also flying (can hit flying targets with close attacks)
        if (!isStatusActive(attacker, 'flying')) {
            canHit = false;
            messages.push(`${attacker.name} cannot reach the flying ${target.name} with a close attack!`);
        }
    }

    // If attacker used a close ability while flying, they get diving attack bonus and land
    if ((ability.range === "close" || ability.type === "physical") && isStatusActive(attacker, 'flying')) {
        damageMultiplier = 1.6; // Diving attack bonus
        applyStatus(attacker, 'flying', 0);
        messages.push(`${attacker.name} dives down with ${ability.name} for extra damage!`);
    }

    // If target is flying and hit by ranged ability, they fall and take fall damage
    if (isStatusActive(target, 'flying') && (ability.range === "ranged" || ability.type === "magic") && canHit) {
        applyStatus(target, 'flying', 0);
        const fallDamage = Math.max(5, Math.floor(target.maxLife * 0.1)); // 10% of max life fall damage
        extraDamage = fallDamage;
        messages.push(`${target.name} is struck from the sky and falls!`);
        messages.push(`${target.name} takes ${fallDamage} fall damage!`);
        // Apply fall damage immediately to target
        target.life = Math.max(0, target.life - fallDamage);
    }

    // Log all messages
    messages.forEach(msg => addLog(msg));

    return { canHit, extraDamage, damageMultiplier };
}

/**
 * Handle status effects from abilities
 * @param {Object} ability - The ability used
 * @param {Object} attacker - The attacking character
 * @param {Object} target - The target character
 * @param {Function} addLog - Logging function
 */
export function handleAbilityEffects(ability, attacker, target, addLog) {
    // Apply status effects
    if (ability.effect && Math.random() < (ability.effect.chance || 1)) {
        const statusTarget = ability.effect.target === 'self' ? attacker : target;
        
        // Special handling for pinned status
        if (ability.effect.type === 'pinned') {
            applyPinnedStatus(attacker, statusTarget, addLog);
        } 
        // Special handling for stunned status
        else if (ability.effect.type === 'stunned') {
            applyStunnedStatus(attacker, statusTarget, addLog);
        }
        // Special handling for DoT effects (poisoned, burned, etc.)
        else if (ability.effect.type === 'poisoned' || ability.effect.type === 'burned') {
            // Check if this is a DoT status by looking in StatusRegistry
            const statusDef = StatusRegistry[ability.effect.type];
            if (statusDef && statusDef.type === 'dot') {
                // Use the DoT system
                applyStatusDoT(attacker, statusTarget, ability.effect.type, addLog);
            } else {
                // Fall back to legacy system
                applyStatus(
                    statusTarget,
                    ability.effect.type,
                    ability.effect.turns || 1,
                    addLog,
                    ability.effect.permanent || false
                );
            }
        } 
        else {
            // Use legacy status system for other effects
            applyStatus(
                statusTarget,
                ability.effect.type,
                ability.effect.turns || 1,
                addLog,
                ability.effect.permanent || false
            );
        }
    }

    // Handle status removal from self
    if (ability.removesStatusSelf && Array.isArray(ability.removesStatusSelf)) {
        ability.removesStatusSelf.forEach(statusType => {
            if (isStatusActive(attacker, statusType)) {
                applyStatus(attacker, statusType, 0);
                addLog(`${attacker.name} is no longer ${statusType}!`);
            }
        });
    }

    // Handle status removal from target
    if (ability.removesStatusTarget && Array.isArray(ability.removesStatusTarget)) {
        ability.removesStatusTarget.forEach(statusType => {
            if (isStatusActive(target, statusType)) {
                applyStatus(target, statusType, 0);
                addLog(`${target.name} is no longer ${statusType}!`);
            }
        });
    }

    // Backward compatibility: handle old removesPin property
    if (ability.removesPin && isStatusActive(target, 'pinned')) {
        applyStatus(target, 'pinned', 0);
        addLog(`${target.name} is no longer pinned!`);
    }
}

/**
 * Handle pinned status interactions
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @param {Object} target - The target character
 * @param {Function} addLog - Logging function
 * @returns {Object} - Object containing pinned interaction results
 */
export function handlePinnedInteractions(ability, attacker, target, addLog) {
    let shouldRemovePinFromAttacker = false;
    let shouldRemovePinFromTarget = false;
    let shouldStunTarget = false;

    // Check if attacker is trapped (including pinned) and will hit successfully
    if (isCharacterTrapped(attacker)) {
        // Trapped character breaks free and stuns opponent when hitting
        addLog(`${attacker.name} breaks free and stuns ${target.name}!`);
        shouldRemovePinFromAttacker = true;
        shouldStunTarget = true;
    }

    // Check if target is trapped and opponent attacks without pin effect
    if (isCharacterTrapped(target)) {
        // If opponent's attack doesn't have pinned effect, release the pin
        if (!ability.effect || ability.effect.type !== 'pinned') {
            addLog(`${target.name} is released from the pin!`);
            shouldRemovePinFromTarget = true;
        }
    }

    return {
        shouldRemovePinFromAttacker,
        shouldRemovePinFromTarget,
        shouldStunTarget
    };
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
    const mockCharacter = { type: characterType };
    const penalties = getEnvironmentalPenalties(mockCharacter, environmentType, intensity);
    
    // Convert to old format for backwards compatibility
    return {
        damageReduction: penalties.damagePenalty,
        description: penalties.damagePenalty > 0 ? 
            `${environmentType} environment reduces ${characterType} attack power by ${Math.round(penalties.damagePenalty * 100)}%!` : "",
        environmentType,
        intensity,
        characterType
    };
}