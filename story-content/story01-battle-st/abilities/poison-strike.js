// Poison Strike Ability
// Physical attack that deals damage and applies poison DoT effect

export default {
    name: "Poison Strike",
    type: "physical",
    range: "close",
    targetType: "enemy",
    mpCost: 8,
    baseDamage: 15,
    damageType: "physical",
    description: "A poisoned blade that deals damage and applies poison.",
    
    // New status system integration
    statusToApply: "poisoned",
    statusChance: 0.9, // 90% chance to apply poison
    statusDuration: 4  // 4 turns of poison
};
