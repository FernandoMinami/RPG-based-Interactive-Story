// Clumsiness Status - Temporary dexterity debuff

export default {
    id: "clumsiness",
    name: "Clumsy",
    turns: 4, // Lasts 4 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Reduce dexterity
    reduceAtributes: {
        amount: 3,
        attribute: "dexterity"
    },
    
    description: "Dexterity temporarily reduced. Movement becomes unsteady."
};
