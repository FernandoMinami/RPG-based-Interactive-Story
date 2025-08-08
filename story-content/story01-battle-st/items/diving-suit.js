export default {
    name: "Diving Suit",
    displayName: "Diving Suit",
    type: "armor",
    category: "body",
    price: 600,
    description: "A complete diving suit with oxygen supply. Provides full protection from underwater environments and pressure damage.",
    onUse: null,
    effectType: "permanent",
    stats: {
        physicDefense: 12,
        waterResistance: 100 // 100% water resistance
    },
    environmentalProtection: {
        underwater: "full",
        description: "Completely negates underwater environmental effects including breath loss"
    },
    weight: 20,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "rare"
};
