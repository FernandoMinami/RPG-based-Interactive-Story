// Paralyzed Status - Character cannot act temporarily

export default {
    id: "paralyzed",
    name: "Paralyzed",
    turns: 2, // Lasts 2 turns
    immuneTypes: ["lightning", "electric"], // Electric types are immune
    
    type: "magic",
    
    // Prevents actions
    prevents: {
        actions: true,
        movement: true
    },
    
    // Attribute modifications  
    modifiers: {
        secondary: [
            { attribute: "speed", amount: -20, description: "paralyzed" },
            { attribute: "accuracy", amount: -50, description: "muscle control lost" }
        ]
    },
    
    description: "Paralyzed by electricity! Cannot act effectively."
};
