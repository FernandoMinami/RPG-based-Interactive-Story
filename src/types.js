/**
 * Elemental Type/Combat Type management system
 */

let types = {};

/**
 * Load type data from manifest
 * @param {string} storyFolder - The story folder path
 */
export async function loadTypes(storyFolder) {
  try {
    const manifestUrl = `../story-content/${storyFolder}/types/_types.json?v=${Date.now()}`;
    const typeManifest = await fetch(manifestUrl).then(res => res.json());
    
    // Load each type file
    for (const typeInfo of typeManifest) {
      const typeUrl = `../story-content/${storyFolder}/types/${typeInfo.file}?v=${Date.now()}`;
      const typeData = await fetch(typeUrl).then(res => res.json());
      types[typeData.id] = typeData;
    }
    
  } catch (error) {
    console.error("Error loading types:", error);
    // No fallback - types will remain empty and functions will handle gracefully
    types = {};
  }
}

/**
 * Get type by ID
 * @param {string} typeId - The type identifier
 * @returns {Object|null} Type data or null if not found
 */
export function getTypeById(typeId) {
  return types[typeId] || null;
}

/**
 * Get all available types
 * @returns {Object} All loaded types
 */
export function getAllTypes() {
  return types;
}

/**
 * Calculate damage multiplier based on attacker and defender types
 * @param {string} attackerType - The attacker's type
 * @param {string} defenderType - The defender's type
 * @returns {number} Damage multiplier (0.0 to 2.0+)
 */
export function calculateTypeEffectiveness(attackerType, defenderType) {
  // Check for test data override
  if (typeof window !== 'undefined' && window.testTypeData) {
    const defenderTypeData = window.testTypeData[defenderType];
    if (defenderTypeData && defenderTypeData.combatProperties) {
      const defenderCombat = defenderTypeData.combatProperties;
      
      // Check if defender is immune to attacker's type
      if (defenderCombat.immunities && defenderCombat.immunities.includes(attackerType)) {
        return 0.0; // No damage
      }
      
      // Check if defender resists attacker's type
      if (defenderCombat.resistances && defenderCombat.resistances.includes(attackerType)) {
        return 0.7; // 30% less damage
      }
      
      // Check if defender is weak to attacker's type
      if (defenderCombat.weaknesses && defenderCombat.weaknesses.includes(attackerType)) {
        return 1.5; // 50% more damage
      }
      
      return 1.0; // Normal damage
    }
  }
  
  const attackerTypeData = getTypeById(attackerType);
  const defenderTypeData = getTypeById(defenderType);
  
  if (!attackerTypeData || !defenderTypeData) {
    return 1.0; // Normal damage if type not found
  }
  
  // Access combat properties
  const defenderCombat = defenderTypeData.combatProperties;
  if (!defenderCombat) {
    return 1.0;
  }
  
  // Check if defender is immune to attacker's type
  if (defenderCombat.immunities && defenderCombat.immunities.includes(attackerType)) {
    return 0.0; // No damage
  }
  
  // Check if defender resists attacker's type
  if (defenderCombat.resistances && defenderCombat.resistances.includes(attackerType)) {
    return 0.7; // 30% less damage
  }
  
  // Check if defender is weak to attacker's type
  if (defenderCombat.weaknesses && defenderCombat.weaknesses.includes(attackerType)) {
    return 1.5; // 50% more damage
  }
  
  return 1.0; // Normal damage
}

/**
 * Get type effectiveness description for UI
 * @param {string} attackType - The attack type
 * @param {string} defenderType - The defender type
 * @returns {string} Human-readable effectiveness description
 */
export function getTypeMatchupDescription(attackType, defenderType) {
  const multiplier = calculateTypeEffectiveness(attackType, defenderType);
  
  if (multiplier === 0.0) return "No effect";
  if (multiplier === 0.7) return "Not very effective";
  if (multiplier >= 1.5) return "Super effective";

  return "Unknown effectiveness";
}

/**
 * Check if a type has environmental effects
 * @param {string} typeId - The type to check
 * @param {string} environmentType - The environment type (fire, water, ice, etc.)
 * @returns {Object} Environmental effect info
 */
export function getEnvironmentalEffect(typeId, environmentType) {
  const typeData = getTypeById(typeId);
  
  if (!typeData || !typeData.environmentalEffects) {
    return { hasEffect: false };
  }
  
  const effect = typeData.environmentalEffects[environmentType];
  
  if (!effect) {
    return { hasEffect: false };
  }
  
  return {
    hasEffect: true,
    damageMultiplier: effect.environmentalDamageMultiplier || 1.0,
    bonusRegeneration: effect.bonusRegeneration || 0,
    description: effect.description || "",
    statusEffect: effect.statusEffect || null
  };
}

/**
 * Calculate ability type bonus for when user's type matches ability's type
 * @param {string} userType - The user's elemental type
 * @param {string} abilityType - The ability's elemental type
 * @returns {number} Damage multiplier (1.0 = no bonus, 1.2 = 20% bonus)
 */
export function calculateAbilityTypeBonus(userType, abilityType) {
  const userTypeData = getTypeById(userType);
  
  if (!userTypeData || !userTypeData.abilityTypeBonus) {
    return 1.0; // No bonus
  }
  
  // Check if user's type provides bonus for this ability type
  if (userTypeData.abilityTypeBonus[abilityType]) {
    return userTypeData.abilityTypeBonus[abilityType];
  }
  
  return 1.0; // No bonus
}

/**
 * Check status effect interaction for a character type
 * @param {string} characterType - The character's elemental type
 * @param {string} statusEffect - The status effect to check
 * @returns {Object} Status effect interaction info
 */
export function getStatusEffectInteraction(characterType, statusEffect) {
  const typeData = getTypeById(characterType);
  
  if (!typeData || !typeData.statusEffectInteractions) {
    return { hasInteraction: false };
  }
  
  const interaction = typeData.statusEffectInteractions[statusEffect];
  if (!interaction) {
    return { hasInteraction: false };
  }
  
  return {
    hasInteraction: true,
    immunity: interaction.immunity || false,
    resistance: interaction.resistance || false,
    vulnerability: interaction.vulnerability || false,
    durationMultiplier: interaction.durationMultiplier || 1.0,
    damageMultiplier: interaction.damageMultiplier || 1.0,
    description: interaction.description || ""
  };
}

// Export types object for direct access if needed
export { types };
