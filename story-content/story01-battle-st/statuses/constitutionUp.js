// Constitution Up Status - Temporary constitution boost

export default {
    id: "constitutionUp",
    name: "Constitution Up",
    turns: 3, // Lasts 3 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase constitution
    increaseAtributes: {
        amount: 4,
        attribute: "constitution"
    },
    
    // Also increase max life
    increaseSecondary: {
        amount: 15,
        secondary: "maxLife"
    },
    
    description: "Constitution temporarily increased. Max life also boosted."
};
