// Floating Status - Character is magically levitating

export default {
    id: "floating",
    name: "Floating",
    turns: 3, // Temporary magical effect
    immuneTypes: [],
    endsWithBattle: true, // Floating status ends when battle is over
    
    type: "magical",
    
    // Partial immunity - can still be hit by ranged attacks but not close
    rangeImmunity: "close",
    
    // Less dexterity bonus than flying since it's more controlled
    increaseAtributes: {
        amount: 3,
        attribute: "dexterity"
    },
    
    // NEW: Marks this status as providing elevation
    isHigh: true,
    
    description: "Magically levitating above the ground. Immune to close attacks but more stable than flying."
};
