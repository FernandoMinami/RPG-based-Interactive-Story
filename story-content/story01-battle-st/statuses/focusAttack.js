// Focus Attack Status - Temporary multi-attribute boost

export default {
    id: "focusAttack",
    name: "Focused",
    turns: 2, // Lasts 2 turns by default
    immuneTypes: [],
    
    type: "magic",
    
    // Increase dexterity (primary effect)
    increaseAtributes: {
        amount: 5,
        attribute: "dexterity"
    },
    
    // Note: This status focuses on dexterity boost as primary effect
    // Additional effects like strength boost would need separate status or custom handling
    
    description: "Dexterity greatly increased through focused concentration. Precision enhanced."
};
