export default {
    name: "Torch",
    displayName: "Torch",
    type: "tool",
    category: "light",
    price: 50,
    description: "A simple torch that provides basic light in dark places. Reduces cave darkness penalties significantly.",
    onUse: function(player) {
        player.temporaryEffects = player.temporaryEffects || {};
        player.temporaryEffects.torchLight = 20; // 20 turns of light
        return "The torch illuminates the area around you!";
    },
    effectType: "temporary",
    stats: {
        accuracy: 0.1 // 10% accuracy bonus from light
    },
    environmentalProtection: {
        cave: "partial",
        reduction: 0.6, // Reduces cave penalties by 60%
        description: "Provides basic light to navigate cave darkness"
    },
    weight: 1,
    stackable: true,
    consumable: true,
    equipable: false,
    rarity: "common"
};
