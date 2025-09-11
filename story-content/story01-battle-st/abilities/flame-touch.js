// Flame Touch Ability
// Fire attack that deals damage and applies burn DoT effect

export default {
    name: "Flame Touch",
    type: "magic",  // Changed from "attack" to "magic" so battle system handles damage
    range: "close",
    targetType: "enemy", 
    mpCost: 12,
    baseDamage: 10,
    damageType: "fire",
    description: "A fiery touch that deals fire damage and ignites the target.",
    
    // New status system integration
    statusToApply: "burning", // Use the burning status
    statusChance: 0.8, // 80% chance to apply burn
    statusDuration: 3 // 3 turns
};
