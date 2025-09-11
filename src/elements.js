/**
 * Elemental Type/Combat Type management system
 */

let elements = {};

/**
 * Load elemental type data from manifest
 * @param {string} storyFolder - The story folder path
 */
export async function loadElements(storyFolder) {
  try {
    const manifestUrl = `../story-content/${storyFolder}/elements.json?v=${Date.now()}`;
    const elementManifest = await fetch(manifestUrl).then(res => res.json());
    
    // Load each element file
    for (const elementInfo of elementManifest) {
      const elementUrl = `../story-content/${storyFolder}/elements/${elementInfo.file}?v=${Date.now()}`;
      const elementData = await fetch(elementUrl).then(res => res.json());
      elements[elementData.id] = elementData;
    }
    
  } catch (error) {
    console.error("Error loading elements:", error);
    // No fallback - elements will remain empty and functions will handle gracefully
    elements = {};
  }
}

/**
 * Get element by ID
 * @param {string} elementId - The element identifier
 * @returns {Object|null} Element data or null if not found
 */
export function getElementById(elementId) {
  return elements[elementId] || null;
}

/**
 * Get all available elements
 * @returns {Object} All loaded elements
 */
export function getAllElements() {
  return elements;
}

/**
 * Calculate damage multiplier based on attacker and defender elemental types
 * @param {string} attackerType - The attacker's elemental type
 * @param {string} defenderType - The defender's elemental type
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
  
  const attackerElementData = getElementById(attackerType);
  const defenderElementData = getElementById(defenderType);
  
  if (!attackerElementData || !defenderElementData) {
    return 1.0; // Normal damage if element not found
  }
  
  // Access combat properties
  const defenderCombat = defenderElementData.combatProperties;
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
 * @param {string} attackType - The attack elemental type
 * @param {string} defenderType - The defender elemental type
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
 * Check if an elemental type has environmental effects
 * @param {string} elementId - The element to check
 * @param {string} environmentType - The environment type (fire, water, ice, etc.)
 * @returns {Object} Environmental effect info
 */
export function getEnvironmentalEffect(elementId, environmentType) {
  const elementData = getElementById(elementId);
  
  if (!elementData || !elementData.environmentalEffects) {
    return { hasEffect: false };
  }
  
  const effect = elementData.environmentalEffects[environmentType];
  
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
 * Calculate ability type bonus for when user's elemental type matches ability's elemental type
 * @param {string} userType - The user's elemental type
 * @param {string} abilityType - The ability's elemental type
 * @returns {number} Damage multiplier (1.0 = no bonus, 1.2 = 20% bonus)
 */
export function calculateAbilityTypeBonus(userType, abilityType) {
  const userElementData = getElementById(userType);
  
  if (!userElementData || !userElementData.abilityTypeBonus) {
    return 1.0; // No bonus
  }
  
  // Check if user's elemental type provides bonus for this ability type
  if (userElementData.abilityTypeBonus[abilityType]) {
    return userElementData.abilityTypeBonus[abilityType];
  }
  
  return 1.0; // No bonus
}

/**
 * Check status effect interaction for a character's elemental type
 * @param {string} characterType - The character's elemental type
 * @param {string} statusEffect - The status effect to check
 * @returns {Object} Status effect interaction info
 */
export function getStatusEffectInteraction(characterType, statusEffect) {
  const elementData = getElementById(characterType);
  
  if (!elementData || !elementData.statusEffectInteractions) {
    return { hasInteraction: false };
  }
  
  const interaction = elementData.statusEffectInteractions[statusEffect];
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

// Export elements object for direct access if needed
export { elements };

// Legacy exports for backward compatibility (can be removed later)
export const types = elements;
export const loadTypes = loadElements;
export const getTypeById = getElementById;
export const getAllTypes = getAllElements;
