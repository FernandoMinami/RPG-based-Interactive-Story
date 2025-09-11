// Struggling Status - Character is struggling under weight or constraint

export default {
    id: "struggling",
    name: "Struggling",
    turns: 3, // Lasts 3 turns
    immuneTypes: [],
    
    type: "physical",
    
    // Reduced dexterity due to struggling
    reduceAtributes: {
        amount: 7,
        attribute: "dexterity"
    },
    
    description: "Struggling under weight or constraint. Dexterity is reduced."
};
