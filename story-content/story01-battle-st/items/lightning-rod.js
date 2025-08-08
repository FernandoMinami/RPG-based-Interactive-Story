export default {
    name: "Lightning Rod",
    displayName: "Lightning Rod",
    type: "accessory",
    category: "weapon",
    price: 300,
    description: "A conductive rod that attracts and safely channels lightning strikes. Reduces lightning damage and provides partial storm protection.",
    onUse: null,
    effectType: "permanent",
    stats: {
        lightningResistance: 75, // 75% lightning resistance
        accuracy: 0.05 // 5% accuracy bonus
    },
    environmentalProtection: {
        storm: "partial",
        reduction: 0.6, // Reduces lightning strike chance by 60%
        description: "Significantly reduces lightning strike damage and chance"
    },
    weight: 3,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "uncommon"
};
