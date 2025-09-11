// Burning Status - Character takes fire damage over time

export default {
    id: "burning",
    name: "Burning",
    turns: 3, // Lasts 3 turns
    immuneTypes: ["fire"], // Fire types are immune
    
    type: "magic",
    
    // DoT configuration
    DoT: {
        isDoT: true,
        DoTAmount: 4,
        DamageType: "fire"
    },
    
    description: "On fire! Takes 4 fire damage each turn."
};
