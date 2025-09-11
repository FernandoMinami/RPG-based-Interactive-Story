export default {
    id: "versatility",
    name: "Versatility",
    type: "special",
    range: "self",
    
    // Passive ability that provides balanced bonuses
    attribute: "charisma",
    amount: 1,
    turns: 0, // Permanent during battle
    
    mpCost: 0, // Free ability
    
    effect: {
        type: "versatile",
        target: "self",
        chance: 1.0,
        turns: 0, // Permanent during battle
        permanent: true
    },
    
    // Special mechanics for versatility
    critChance: 0.05, // +5% critical hit chance
    accuracy: 105, // Slight accuracy bonus
    
    description: "Your versatile nature grants you flexibility in combat, improving your charisma and overall effectiveness in various situations.",
    
    // This is a passive ability that activates automatically for hybrids
    passive: true
};
