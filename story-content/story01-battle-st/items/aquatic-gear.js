export default {
    name: "Aquatic Gear",
    displayName: "Aquatic Gear",
    type: "armor",
    category: "accessory",
    price: 180,
    description: "Swimming fins and goggles that help with underwater movement. Reduces underwater speed penalty by half.",
    onUse: null,
    effectType: "permanent",
    stats: {
        speed: 3,
        waterResistance: 25 // 25% water resistance
    },
    environmentalProtection: {
        underwater: "partial",
        reduction: 0.5, // Reduces speed penalty by 50%
        description: "Improves underwater movement and reduces speed penalty"
    },
    weight: 2,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "common"
};
