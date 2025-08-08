export default {
    name: "Storm Cloak",
    displayName: "Storm Cloak",
    type: "armor",
    category: "cloak",
    price: 550,
    description: "A mystical cloak woven with air magic and lightning rods. Provides complete protection from storm environments and electrical attacks.",
    onUse: null,
    effectType: "permanent",
    stats: {
        magicDefense: 18,
        lightningResistance: 100, // 100% lightning resistance
        accuracy: 0.1 // 10% accuracy bonus
    },
    environmentalProtection: {
        storm: "full",
        description: "Completely negates storm environmental effects and lightning strikes"
    },
    weight: 4,
    stackable: false,
    consumable: false,
    equipable: true,
    rarity: "rare"
};
