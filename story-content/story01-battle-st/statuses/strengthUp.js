// Strength Up Status - Temporary strength boost

export default {
    id: "strengthUp",
    name: "Strength Up",
    turns: 3, // Lasts 3 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase strength
    increaseAtributes: {
        amount: 4,
        attribute: "strength"
    },
    
    description: "Strength temporarily increased. Better physical damage and break free chance."
};
