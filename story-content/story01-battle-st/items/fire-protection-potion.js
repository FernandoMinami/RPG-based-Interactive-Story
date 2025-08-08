export default {
    name: "Fire Protection Potion",
    displayName: "Fire Protection Potion",
    type: "potion",
    category: "consumable",
    price: 150,
    description: "A magical potion that grants temporary immunity to fire and volcanic environments. Effects last for 5 turns in battle.",
    onUse: function(player) {
        player.temporaryProtection = {
            type: "volcanic",
            duration: 5,
            description: "Protected from volcanic effects"
        };
        return "You feel a cool, protective barrier form around you!";
    },
    effectType: "temporary",
    stats: {},
    environmentalProtection: {
        volcanic: "temporary",
        duration: 5,
        description: "Provides temporary volcanic protection"
    },
    weight: 1,
    stackable: true,
    consumable: true,
    equipable: false,
    rarity: "uncommon"
};
