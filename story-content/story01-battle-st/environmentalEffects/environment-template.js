/**
 * Template for creating new environmental effects
 * Copy this file and rename it to your environment name (e.g., desert.json)
 * Fill in all the properties according to your environment's characteristics
 */

export const environmentTemplate = {
  // Basic Information
  "id": "template",                    // REQUIRED: Unique identifier (lowercase, no spaces)
  "name": "Template Environment",      // REQUIRED: Display name
  "description": "Template description for your environmental effect", // REQUIRED: Short description
  "icon": "🌍",                        // Emoji or symbol representing this environment
  
  // Global Effects - Effects that apply to all characters regardless of type
  "globalEffects": {
    "description": "General environmental conditions that affect everyone",
    "damagePerTurn": 0,                // Base damage all characters take per turn (can be negative for healing)
    "healingPerTurn": 0,               // Base healing all characters receive per turn
    "statusEffects": [],               // Array of status effects applied to all characters
    "visibilityModifier": 1.0,         // Multiplier for accuracy/visibility
    "movementModifier": 1.0            // Multiplier for movement speed
  },
  
  // Type Interactions - How different elemental types interact with this environment
  "typeInteractions": {
    "neutral": {
      "environmentalDamageMultiplier": 1.0,  // 1.0 = normal, 0.5 = resistant, 2.0 = vulnerable
      "description": "How neutral types react to this environment",
      "bonusRegeneration": 0,                 // Additional HP regeneration per turn (can be negative)
      "statusEffect": null,                   // Optional status effect for this type
      "bonusEffects": {}                      // Additional type-specific bonuses
    },
    "fire": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How fire types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {
        // "damageBonus": 1.1,              // Example: 10% damage bonus
        // "defenseBonus": 0.9,             // Example: 10% defense penalty
        // "criticalBonus": 0.05            // Example: 5% additional critical chance
      }
    },
    "water": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How water types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    },
    "earth": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How earth types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    },
    "air": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How air types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    },
    "ice": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How ice types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    },
    "lightning": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How lightning types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    },
    "light": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How light types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    },
    "dark": {
      "environmentalDamageMultiplier": 1.0,
      "description": "How dark types react to this environment",
      "bonusRegeneration": 0,
      "statusEffect": null,
      "bonusEffects": {}
    }
  },
  
  // Combat Modifiers - How this environment affects combat mechanics
  "combatModifiers": {
    "accuracyModifier": 1.0,           // Multiplier for hit chance (0.8 = 20% harder to hit)
    "criticalChanceModifier": 1.0,     // Multiplier for critical hit chance
    "speedModifier": 1.0,              // Multiplier for combat speed/initiative
    "damageModifier": 1.0,             // Global damage multiplier for all attacks
    "healingModifier": 1.0,            // Multiplier for all healing effects
    "manaRegenerationModifier": 1.0    // Multiplier for mana regeneration
  },
  
  // Visual Effects - How this environment appears and sounds
  "visualEffects": {
    "background": "normal",            // Background style/color scheme
    "particles": [],                   // Array of particle effects
    "lighting": "normal",              // Lighting style (bright, dim, colored, etc.)
    "ambientSound": "peaceful",        // Background audio
    "weatherEffects": [],              // Weather-related visual effects
    "animationSpeed": 1.0              // Speed multiplier for animations
  },
  
  // Scenario Integration - How this environment integrates with story scenarios
  "scenarioEffects": {
    "explorationModifier": 1.0,        // Affects exploration/discovery chances
    "merchantPriceModifier": 1.0,      // Affects shop prices in this environment
    "encounterRateModifier": 1.0,      // Affects random encounter frequency
    "lootQualityModifier": 1.0,        // Affects quality of found items
    "restEffectiveness": 1.0           // Affects how well characters can rest/recover
  },
  
  // Lore and Flavor
  "lore": "Extended description of this environment's background, history, and significance in the world. This helps with immersion and story integration."
};

/**
 * INSTRUCTIONS FOR CREATING A NEW ENVIRONMENTAL EFFECT:
 * 
 * 1. Copy this file and rename it to your environment name (e.g., desert.json)
 * 2. Change the file extension from .js to .json
 * 3. Remove the 'export const environmentTemplate = ' part and the closing semicolon
 * 4. Fill in all the properties:
 *    - Change "id" to your environment's unique identifier
 *    - Update "name", "description", "icon", and "lore"
 *    - Configure global effects that affect all characters
 *    - Set up type interactions for each elemental type
 *    - Define combat modifiers
 *    - Configure visual and audio effects
 *    - Set scenario integration effects
 * 5. Add your new environment to the _environmentalEffects.json manifest file
 * 6. Test your environment in scenarios to ensure balance
 * 
 * EXAMPLE ENVIRONMENTS:
 * - Desert: Hot, fire types gain bonuses, water types suffer, low visibility from sandstorms
 * - Frozen Tundra: Cold, ice types thrive, fire types struggle, movement penalties
 * - Electric Storm: Lightning everywhere, lightning types empowered, metal equipment dangerous
 * - Corrupted Zone: Dark energy, dark types benefit, light types weakened, constant damage
 * - Sacred Grove: Holy ground, light types enhanced, dark types penalized, healing bonuses
 * 
 * BALANCE TIPS:
 * - Environmental damage should be scaled for per-turn application (2-5 damage typical)
 * - Regeneration bonuses should be modest (3-8 HP per turn)
 * - Damage multipliers: 0.5-0.8 for resistance, 1.2-2.0 for vulnerability
 * - Combat modifiers should be subtle (0.8-1.2 range typically)
 * - Consider both positive and negative effects for balance
 */
