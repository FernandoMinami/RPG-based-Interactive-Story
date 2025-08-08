export default {
    name: "Volcanic Cloak",
    displayName: "Volcanic Cloak",
    type: "armor",
    category: "cloak",
    price: 200,
    description: "A lightweight cloak woven with salamander scales. Provides partial protection from volcanic heat.",
    onUse: null,
    effectType: "permanent",
    stats: {
        magicDefense: 8,
        fireResistance: 50 // 50% fire resistance
    },
    environmentalProtection: {
        volcanic: "partial",
        reduction: 0.5, // Reduces environmental damage by 50%
        description: "Reduces volcanic environmental effects by half"
    },
    weight: 3,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "common"
};
