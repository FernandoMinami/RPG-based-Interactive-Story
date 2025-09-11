/**
 * Validation Integration Examples
 * 
 * This file shows how the validation system integrates throughout the application
 * to prevent common character structure errors.
 */

// Example: Safe character loading from save files
export function loadCharacterFromSave(saveData) {
  try {
    const character = JSON.parse(saveData);
    
    // Validate and repair the loaded character
    if (!validateCharacter(character)) {
      character = repairCharacterStructure(character);
      
      if (!character) {
        throw new Error('Character save data is corrupted beyond repair');
      }
      
    }
    
    return character;
  } catch (error) {
    console.error('Failed to load character from save:', error);
    return null;
  }
}

// Example: Safe enemy initialization
export function initializeEnemyFromTemplate(enemyTemplate) {
  // Clone the template to avoid modifying the original
  const enemy = JSON.parse(JSON.stringify(enemyTemplate));
  
  // Ensure the enemy has proper structure
  initializeCharacterStructure(enemy);
  
  // Validate before using
  if (!validateCharacter(enemy, { requireEquipment: false })) {
    console.error(`Failed to initialize enemy: ${enemy.name || 'Unknown'}`);
    return null;
  }
  
  return enemy;
}

// Example: Safe ability application
export function applyAbilityEffects(character, abilityEffects) {
  // Validate character before applying effects
  if (!validatePrimaryAttributes(character)) {
    console.error('Cannot apply ability effects: character has invalid structure');
    return false;
  }
  
  // Apply effects with confidence that structure is valid
  if (abilityEffects.primaryAttributeBoosts) {
    applyPrimaryAttributeBoost(character, abilityEffects.primaryAttributeBoosts);
  }
  
  if (abilityEffects.secondaryAttributeBoosts) {
    applySecondaryAttributeBoost(character, abilityEffects.secondaryAttributeBoosts);
  }
  
  return true;
}

// Example: Safe character creation
export function createNewCharacter(characterTemplate) {
  const character = {
    name: characterTemplate.name || 'Unnamed Character',
    ...characterTemplate
  };
  
  // Initialize proper structure
  initializeCharacterStructure(character);
  
  // Apply any template values over defaults
  if (characterTemplate.primary) {
    Object.assign(character.primary, characterTemplate.primary);
  }
  
  // Validate the final result
  if (!validateCharacter(character)) {
    console.error('Failed to create valid character from template');
    return null;
  }
  
  // Calculate secondary stats
  updateSecondaryStats(character, true);
  
  return character;
}
