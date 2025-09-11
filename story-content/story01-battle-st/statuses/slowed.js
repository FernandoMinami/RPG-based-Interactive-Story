// Slowed Status - Character moves and acts slower

export default {
    id: "slowed",
    name: "Slowed",
    turns: 3, // Lasts 3 turns
    immuneTypes: ["ice", "water"], // Ice/water types are immune
    
    type: "magic",
    
    // Attribute modifications
    modifiers: {
        secondary: [
            { attribute: "speed", amount: -5, description: "movement slowed" },
            { attribute: "accuracy", amount: -10, description: "reaction time slowed" }
        ]
    },
    
    description: "Movement and reactions slowed. -5 speed, -10 accuracy."
};
