// Weakness Curse Status - Temporary strength and constitution debuff

export default {
    id: "weaknessCurse",
    name: "Weakened",
    turns: 3, // Lasts 3 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Reduce strength (primary effect)
    reduceAtributes: {
        amount: 2,
        attribute: "strength"
    },
    
    // Note: This status focuses on strength reduction as primary effect
    // Constitution reduction would need a separate status or custom handling
    
    description: "Strength temporarily reduced by dark magic. Physical power weakened."
};
