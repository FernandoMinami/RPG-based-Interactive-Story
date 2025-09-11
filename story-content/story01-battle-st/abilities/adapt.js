export default {
    id: "adapt",
    name: "Adapt",
    type: "special",
    range: "self",
    
    // Passive ability that provides bonuses based on situation
    attribute: "intelligence",
    amount: 1,
    turns: 0, // Permanent during battle
    
    mpCost: 0, // Free ability
    
    effect: {
        type: "adaptation",
        target: "self",
        chance: 1.0,
        turns: 0, // Permanent during battle
        permanent: true
    },
    
    // Special mechanics for adaptation
    critChance: 0.05, // +5% critical hit chance
    accuracy: 105, // Slight accuracy bonus
    
    description: "Your hybrid nature allows you to adapt to different situations, providing slight bonuses to intelligence and adaptability in combat.",
    
    // This is a passive ability that activates automatically for hybrids
    passive: true
};
