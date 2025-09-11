// Charisma Up Status - Temporary charisma boost

export default {
    id: "charismaUp",
    name: "Charisma Up",
    turns: 3, // Lasts 3 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase charisma
    increaseAtributes: {
        amount: 4,
        attribute: "charisma"
    },
    
    description: "Charisma temporarily increased."
};
