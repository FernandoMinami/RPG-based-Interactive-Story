// High Ground Status - Character has positional advantage from elevated terrain

export default {
    id: "high-ground",
    name: "High Ground",
    turns: 0, // Permanent until removed or moved
    immuneTypes: [],
    
    type: "physical",
    
    // Provides minor accuracy bonus due to better positioning
    increaseAtributes: {
        amount: 2,
        attribute: "dexterity"
    },
    
    // NEW: Marks this status as providing elevation
    isHigh: true,
    
    description: "Standing on elevated terrain. Provides better positioning and slight agility boost."
};
