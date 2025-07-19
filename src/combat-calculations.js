// combat-calculations.js - Combat damage, accuracy, and critical hit calculations

import { isStatusActive, applyStatus } from './status.js';
import { updateLifeBar } from './ui.js';

/**
 * Calculate final accuracy for an attack
 * @param {Object} ability - The ability being used
 * @param {number} attackerSpeed - Attacker's effective speed
 * @param {number} defenderSpeed - Defender's effective speed
 * @param {number} accuracyMultiplier - Accuracy multiplier (for status effects)
 * @returns {number} - Final accuracy percentage
 */
export function calculateAccuracy(ability, attackerSpeed, defenderSpeed, accuracyMultiplier = 1) {
    const baseAccuracy = ability.accuracy !== undefined ? ability.accuracy : 100;
    let finalAccuracy = baseAccuracy + (attackerSpeed - defenderSpeed) * 2;
    finalAccuracy = Math.max(5, Math.min(100, finalAccuracy));
    return Math.floor(finalAccuracy * accuracyMultiplier);
}

/**
 * Calculate damage for an attack
 * @param {Object} ability - The ability being used
 * @param {Object} attacker - The attacking character
 * @param {Object} defender - The defending character
 * @returns {Object} - Object containing damage info
 */
export function calculateDamage(ability, attacker, defender) {
    let base = Math.floor(Math.random() * (ability.maxDamage - ability.minDamage + 1)) + ability.minDamage;
    let attackStat = 0;
    let defenseStat = 0;

    if (ability.type === "magic") {
        attackStat = base + (attacker.secondary?.magicDamage || 0);
        defenseStat = ability.breaksDefense ? 0 : (defender.secondary?.magicDefense || 0);
    } else if (ability.type === "physical") {
        attackStat = base + (attacker.secondary?.physicDamage || 0);
        defenseStat = ability.breaksDefense ? 0 : (defender.secondary?.physicDefense || 0);
        
        // Add size bonus for physical attacks
        const sizeBonus = calculateSizeBonus(attacker, defender);
        attackStat += sizeBonus;
        
        // Add weight bonus for specific abilities
        const weightBonus = calculateWeightBonus(ability, attacker);
        attackStat += weightBonus;
    }

    const damage = Math.max(0, base + attackStat - defenseStat);
    
    return {
        baseDamage: base,
        attackStat,
        defenseStat,
        finalDamage: damage,
        defenseBypass: ability.breaksDefense,
        sizeBonus: ability.type === "physical" ? calculateSizeBonus(attacker, defender) : 0,
        weightBonus: ability.type === "physical" ? calculateWeightBonus(ability, attacker) : 0
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
    
    // Weight bonus: 1 point per 10 kg, with minimum of 1
    return Math.max(1, Math.floor(weight / 10));
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
 */
export function applyDamage(target, damage, ability, attacker, addLog) {
    if (damage > 0) {
        target.life -= damage;
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
        applyStatus(
            statusTarget,
            ability.effect.type,
            ability.effect.turns || 1,
            addLog,
            ability.effect.permanent || false
        );
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

    // Check if attacker is pinned and will hit successfully (this gets called after hit confirmation)
    if (isStatusActive(attacker, 'pinned')) {
        // Pinned character breaks free and stuns opponent when hitting
        addLog(`${attacker.name} breaks free and stuns ${target.name}!`);
        shouldRemovePinFromAttacker = true;
        shouldStunTarget = true;
    }

    // Check if target is pinned and opponent attacks without pin effect
    if (isStatusActive(target, 'pinned')) {
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
