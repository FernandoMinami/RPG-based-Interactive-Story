/**
 * Template for creating new elemental types
 * Copy this file and rename it to your type name (e.g., poison.json)
 * Fill in all the properties according to your type's characteristics
 */

export const typeTemplate = {
  // Basic Information
  "id": "template",                    // REQUIRED: Unique identifier (lowercase, no spaces)
  "name": "Template Type",             // REQUIRED: Display name
  "description": "Template description for your elemental type", // REQUIRED: Short description
  "color": "#FFFFFF",                  // Hex color for UI elements
  "icon": "⚡",                        // Emoji or symbol representing this type
  "lore": "Extended backstory and lore about this elemental type. Describes its nature, origins, and role in the world.",

  // Combat Properties - Define how this type interacts in battle
  "combatProperties": {
    "resistances": [],                 // Array of type IDs this type resists (takes 70% damage from)
    "weaknesses": [],                  // Array of type IDs this type is weak to (takes 150% damage from)
    "immunities": [],                  // Array of type IDs this type is immune to (takes 0% damage from)
    "bonusDamageTypes": [],           // Array of type IDs this type deals extra damage to
    "baseModifier": 1.0,              // Base damage modifier for this type's attacks
    "specialProperties": {            // Optional special combat properties
      "lifeDrainBonus": 1.0,         // Multiplier for life drain abilities
      "criticalChanceBonus": 0.0,    // Additional critical hit chance
      "speedBonus": 1.0,             // Speed modifier in combat
      "defenseBonus": 1.0            // Defense modifier
    }
  },

  // Environmental Effects - How this type interacts with different environments
  "environmentalEffects": {
    "neutral": {
      "environmentalDamageMultiplier": 1.0,
      "description": "Normal conditions",
      "bonusRegeneration": 0
    },
    "fire": {
      "environmentalDamageMultiplier": 1.0,  // 1.0 = normal, 0.5 = resistant, 2.0 = vulnerable
      "description": "How this type reacts to fire environments",
      "bonusRegeneration": 0,                 // HP regeneration per turn (can be negative for damage)
      "statusEffect": null                    // Optional status effect applied in this environment
    },
    "water": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to water environments",
      "bonusRegeneration": 0
    },
    "earth": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to earth/nature environments",
      "bonusRegeneration": 0
    },
    "air": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to air/wind environments",
      "bonusRegeneration": 0
    },
    "ice": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to ice/cold environments",
      "bonusRegeneration": 0
    },
    "lightning": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to lightning/electric environments",
      "bonusRegeneration": 0
    },
    "light": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to light/holy environments",
      "bonusRegeneration": 0
    },
    "dark": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How this type reacts to dark/shadow environments",
      "bonusRegeneration": 0
    }
  },

  // Ability Type Bonus - Damage multiplier when using abilities of matching type
  "abilityTypeBonus": {
    "template": 1.2,                   // 20% bonus when using abilities of same type
    // Add other ability types this character gets bonuses with
    // "fire": 1.1,                    // Example: 10% bonus with fire abilities
    // "water": 0.9                    // Example: 10% penalty with water abilities
  },

  // Status Effect Interactions - How this type interacts with status effects
  "statusEffectInteractions": {
    "burn": {
      "immunity": false,               // true = completely immune to this status
      "resistance": false,             // true = reduced duration/damage
      "vulnerability": false,          // true = increased duration/damage
      "durationMultiplier": 1.0,       // Multiplier for status duration
      "damageMultiplier": 1.0,         // Multiplier for status damage
      "description": "How this type interacts with burn status"
    },
    "freeze": {
      "immunity": false,
      "resistance": false,
      "vulnerability": false,
      "durationMultiplier": 1.0,
      "damageMultiplier": 1.0,
      "description": "How this type interacts with freeze status"
    },
    "poison": {
      "immunity": false,
      "resistance": false,
      "vulnerability": false,
      "durationMultiplier": 1.0,
      "damageMultiplier": 1.0,
      "description": "How this type interacts with poison status"
    },
    "paralysis": {
      "immunity": false,
      "resistance": false,
      "vulnerability": false,
      "durationMultiplier": 1.0,
      "damageMultiplier": 1.0,
      "description": "How this type interacts with paralysis status"
    }
    // Add more status effects as needed
  }
};

/**
 * INSTRUCTIONS FOR CREATING A NEW TYPE:
 * 
 * 1. Copy this file and rename it to your type name (e.g., poison.json)
 * 2. Change the file extension from .js to .json
 * 3. Remove the 'export const typeTemplate = ' part and the closing semicolon
 * 4. Fill in all the properties:
 *    - Change "id" to your type's unique identifier
 *    - Update "name", "description", "color", "icon", and "lore"
 *    - Define combat properties (resistances, weaknesses, immunities)
 *    - Set environmental effects for each environment type
 *    - Configure ability type bonuses
 *    - Set up status effect interactions
 * 5. Add your new type to the _types.json manifest file
 * 6. Test your type in game to ensure balance
 * 
 * TIPS:
 * - Environmental damage multipliers: 0.5 = resistant, 1.0 = normal, 2.0 = vulnerable
 * - Ability type bonuses are typically 1.2 (20% bonus) for same type
 * - Status effect interactions should make thematic sense
 * - Test balance by playing with the type in different scenarios
 */
