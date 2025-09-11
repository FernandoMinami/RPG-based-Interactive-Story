export default {
    name: "Grounding Boots",
    displayName: "Grounding Boots",
    type: "armor",
    category: "foot",  // Changed from "feet" to "foot" to match character slots
    price: 220,
    description: "Heavy boots with copper soles that ground electrical currents. Provides basic protection from lightning and improves stability in storms.",
    onUse: null,
    effectType: "permanent",
    stats: {
        physicalDefense: 6,
        lightningResistance: 40, // 40% lightning resistance
        stability: 15 // Reduces chance of being stunned by storms
    },
    environmentalProtection: {
        storm: "partial",
        reduction: 0.3, // Reduces storm effects by 30%
        description: "Provides basic storm protection and lightning grounding"
    },
    weight: 8,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "common"
};
