// Flying status effect - simplified data format
// Character gains dexterity boost and immunity to close attacks
// Special behaviors handled by core systems in special-effects.js

export default {
    name: "Flying",
    statusTag: "flying",
    statusDesc: "Soaring high in the sky",
    turns: -1, // Permanent until specific conditions remove it
    durationType: "permanent",
    
    effects: {
        baseAttributeBoosts: [
            { attribute: 'dexterity', amount: 5 }
        ]
    },
    
    // Properties for the core systems to reference
    immuneToClose: true,
    divingAttackMultiplier: 1.6,
    fallDamagePercent: 0.08 // 8% of max life as fall damage
};
