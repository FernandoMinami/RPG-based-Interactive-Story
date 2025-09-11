// Pinned Status - Character is pinned down and cannot move effectively

export default {
    id: "pinned",
    name: "Pinned",
    turns: 0, // Permanent until broken free
    immuneTypes: ["flying"], // Flying types are immune to pinning
    endsWithBattle: true, // Pinned status ends when battle is over
    
    type: "physical",
    
    // Reduce speed to almost nothing
    reduceSecondary: {
        amount: 99,
        secondary: "speed"
    },
    
    // Reduce dexterity due to being held down
    reduceAtributes: {
        amount: 5,
        attribute: "dexterity"
    },
    
    // Trapped configuration
    trapped: {
        isTrapped: true,
        attributeToBreakFree: "strength",
        statusName: "Pinned",
        buttonText: "Struggle",
        usesWeight: true,
        canBreakByForce: true
    },
    
    description: "Pinned down and unable to move effectively. Must break free to escape."
};
