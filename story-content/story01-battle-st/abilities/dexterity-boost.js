export default {
    name: "Agility",
    type: "buff",
    range: "self",
    targetType: "self",
    mpCost: 12,
    statusToApply: "dexterityUp",
    statusChance: 1.0, // 100% chance
    statusDuration: 3, // 3 turns
    description: "Temporarily increases dexterity by 4 points.",
    onHit: "Agility boosted!",
    onMiss: ""
};
