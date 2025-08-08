export default {
    name: "Spelunker's Helmet",
    displayName: "Spelunker's Helmet",
    type: "armor",
    category: "head",
    price: 450,
    description: "A sturdy mining helmet with a powerful headlamp. Provides complete protection from cave darkness and falling rocks.",
    onUse: null,
    effectType: "permanent",
    stats: {
        physicDefense: 15,
        accuracy: 0.2, // 20% accuracy bonus from light
        stability: 20 // Prevents tripping
    },
    environmentalProtection: {
        cave: "full",
        description: "Completely negates cave darkness and rockfall hazards"
    },
    weight: 6,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "rare"
};
