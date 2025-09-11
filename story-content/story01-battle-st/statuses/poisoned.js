// Poisoned Status - Character takes poison damage over time

export default {
    id: "poisoned",
    name: "Poisoned",
    turns: 4, // Lasts 4 turns
    immuneTypes: ["poison", "undead"], // Poison and undead types are immune
    
    type: "magic",
    
    // DoT configuration
    DoT: {
        isDoT: true,
        DoTAmount: 6,
        DamageType: "poison"
    },
    
    description: "Suffering from poison. Takes 6 poison damage each turn."
};
