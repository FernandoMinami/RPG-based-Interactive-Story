export default {
    name: "Water Breathing Potion",
    displayName: "Water Breathing Potion",
    type: "potion",
    category: "consumable",
    price: 200,
    description: "A magical potion that allows breathing underwater for a limited time. Prevents suffocation damage for 10 turns.",
    onUse: function(player) {
        player.temporaryProtection = {
            type: "underwater",
            duration: 10,
            description: "Can breathe underwater"
        };
        return "You feel your lungs adapt to extract oxygen from water!";
    },
    effectType: "temporary",
    stats: {},
    environmentalProtection: {
        underwater: "temporary",
        duration: 10,
        description: "Prevents underwater suffocation damage"
    },
    weight: 1,
    stackable: true,
    consumable: true,
    equipable: false,
    rarity: "uncommon"
};
