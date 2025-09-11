// Defense Up Status - Temporary physical defense boost

export default {
    id: "defenseUp",
    name: "Physical Defense Up",
    turns: 5, // Lasts 5 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase physical defense
    increaseSecondary: {
        amount: 10,
        secondary: "physicalDefense"
    },
    
    description: "Physical defense temporarily increased."
};
