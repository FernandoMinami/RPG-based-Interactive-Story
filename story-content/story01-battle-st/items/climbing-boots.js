export default {
    name: "Climbing Boots",
    displayName: "Climbing Boots",
    type: "armor",
    category: "feet",
    price: 180,
    description: "Sturdy boots with excellent grip designed for rocky terrain. Reduces the chance of tripping in caves.",
    onUse: null,
    effectType: "permanent",
    stats: {
        physicDefense: 8,
        stability: 15, // Reduces trip chance
        speed: 2 // Better movement on rough terrain
    },
    environmentalProtection: {
        cave: "partial",
        reduction: 0.4, // Reduces tripping chance by 40%
        description: "Provides better grip and stability in rocky cave terrain"
    },
    weight: 4,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "uncommon"
};
