// Dexterity Up Status - Temporary dexterity boost

export default {
    id: "dexterityUp",
    name: "Dexterity Up",
    turns: 3, // Lasts 3 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase dexterity
    increaseAtributes: {
        amount: 4,
        attribute: "dexterity"
    },
    
    description: "Dexterity temporarily increased. Better accuracy and dodge chance."
};
