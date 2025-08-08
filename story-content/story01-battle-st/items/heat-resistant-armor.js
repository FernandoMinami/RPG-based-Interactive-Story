export default {
    name: "Heat Resistant Armor",
    displayName: "Heat Resistant Armor",
    type: "armor",
    category: "body",
    price: 500,
    description: "Heavy armor forged with fire-resistant materials. Provides complete protection from volcanic environments and heat-based attacks.",
    onUse: null,
    effectType: "permanent",
    stats: {
        physicDefense: 15,
        fireResistance: 100 // 100% fire resistance
    },
    environmentalProtection: {
        volcanic: "full",
        description: "Completely negates volcanic environmental effects"
    },
    weight: 25,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "rare"
};
