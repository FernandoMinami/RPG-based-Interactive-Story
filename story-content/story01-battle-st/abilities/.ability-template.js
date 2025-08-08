/**
 * ABILITY TEMPLATE
 * This template shows all possible properties an ability can have.
 * Copy this file and modify as needed for new abilities.
 * Remove properties that are not needed for your specific ability.
 */

export default {
    // === BASIC PROPERTIES ===
    name: "Ability Name",                    // Display name of the ability
    type: "physical",                        // "physical", "magic", "heal", "buff", "status", "special"
    range: "close",                          // "close", "ranged", "self", "area"
    
    // === DAMAGE PROPERTIES ===
    minDamage: 0,                           // Minimum damage dealt (0 for non-damage abilities)
    maxDamage: 0,                           // Maximum damage dealt (0 for non-damage abilities)
    accuracy: 100,                          // Base hit chance percentage (1-100)
    usesWeight: false,                      // If true, uses attacker's weight in calculations
    
    // === RESOURCE COSTS ===
    mpCost: 0,                              // Mana/MP cost to use this ability
    hpCost: 0,                              // Health cost to use this ability (rare)
    
    // === HEALING PROPERTIES ===
    amount: 0,                              // Fixed healing amount or buff amount
    
    // === BUFF/DEBUFF PROPERTIES ===
    attribute: "strength",                   // "strength", "physicDamage", "magicDamage", "physicDefense", "magicDefense", "speed", "charisma", "constitution", "dexterity", "wisdom", "intelligence"
    turns: 0,                               // Duration in turns (0 = permanent until battle ends)
    
    // === STATUS EFFECTS ===
    effect: {
        type: "poisoned",                   // Status effect type: "poisoned", "stunned", "burned", "frozen", "flying", "pinned"
        target: "enemy",                    // "enemy", "self" - who gets the effect
        chance: 1.0,                        // Probability of effect occurring (0.0-1.0)
        turns: 3,                           // Duration in turns
        permanent: false,                   // If true, lasts until battle ends
        damage: 5                           // Damage per turn (for DoT effects like poison)
    },
    
    // === SPECIAL CONDITIONS ===
    requiresStatusSelf: "flying",           // Only usable when user has this status
    requiresStatusTarget: "stunned",        // Only usable when target has this status
    removesStatusSelf: ["pinned", "frozen"], // Status effects this ability removes from user
    removesStatusTarget: ["stunned", "pinned"], // Status effects this ability removes from target
    breaksDefense: true,                    // Ignores target's defense
    
    // === SPECIAL MECHANICS ===
    multiHit: 2,                           // Number of times this ability hits
    lifeSteal: 0.5,                        // Percentage of damage dealt returned as healing (0.0-1.0)
    critChance: 0.1,                       // Critical hit chance (0.0-1.0)
    critMultiplier: 2.0,                   // Critical hit damage multiplier
    
    // === COOLDOWN SYSTEM ===
    cooldown: 0,                           // Turns before ability can be used again
    usesPerBattle: 3,                      // Maximum uses per battle (0 = unlimited)
    
    // === COMBO SYSTEM ===
    combo: {                               // Combo system
        followsFrom: ["quick-attack", "fly", "power-surge"]  // Can combo after any of these!
    },
    
    // === DISPLAY PROPERTIES ===
    description: "A detailed description of what this ability does.",
    onHit: "Message shown when the ability successfully hits.",
    onMiss: "Message shown when the ability misses.",
    onCrit: "Message shown on critical hit.",
    onOverkill: "The crushing weight completely overwhelms the target!",
    learnMessage: "Message shown when this ability is learned.",

    /*
    // === ANIMATION/VISUAL ===
    animation: "slash",                     // Animation type for UI
    color: "#ff0000",                        // Color for ability display
    icon: "sword",                           // Icon identifier
    */

    /*
    // === WEATHER PROPERTIES ===
    environmental: {                       // Environmental effects
        weather: "rain",                   // Works better in certain weather
        terrain: "water",                  // Works better on certain terrain
        timeOfDay: "night"                // Works better at certain times
    }
    */
};

/*
 * PROPERTY USAGE NOTES:
 * 
 * DAMAGE ABILITIES:
 * - Use minDamage, maxDamage, accuracy
 * - Set type to "physical" or "magic"
 * - Add effect for status infliction
 * 
 * HEALING ABILITIES:
 * - Use amount or healPercent
 * - Set type to "heal"
 * - Set onMiss to null (healing doesn't miss)
 * 
 * BUFF ABILITIES:
 * - Use attribute, amount, turns
 * - Set type to "buff"
 * - Set range to "self" for self-buffs
 * 
 * STATUS ABILITIES:
 * - Use effect with appropriate status type
 * - Set minDamage/maxDamage to 0 if no damage
 * - Set type to "status"
 * 
 * SPECIAL ABILITIES:
 * - Combine multiple properties as needed
 * - Use special conditions for unique mechanics
 * - Set type to "special" for unique abilities
 */