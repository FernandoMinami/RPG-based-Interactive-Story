// Wisdom Up Status - Temporary wisdom boost

export default {
    id: "wisdomUp",
    name: "Wisdom Up",
    turns: 3, // Lasts 3 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase wisdom
    increaseAtributes: {
        amount: 4,
        attribute: "wisdom"
    },
    
    description: "Wisdom temporarily increased."
};
