// Flying Status - Character is airborne and gains advantages

export default {
    id: "flying",
    name: "Flying",
    turns: 0, // Permanent until removed
    immuneTypes: [],
    endsWithBattle: true, // Flying status ends when battle is over
    
    type: "physical",
    
    // REMOVED: Static range immunity (now uses dynamic isHigh system)
    // rangeImmunity: "close",
    
    // Increased dexterity while flying
    increaseAtributes: {
        amount: 6,
        attribute: "dexterity"
    },
    
    // NEW: Marks this status as providing elevation
    isHigh: true,
    
    description: "Airborne and agile. Gains dexterity and dynamic range immunity to ground-based attacks."
};
