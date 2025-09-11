export default {
    name: "Power Up",
    type: "buff",
    range: "self",
    targetType: "self",
    mpCost: 12,
    statusToApply: "strengthUp",
    statusChance: 1.0, // 100% chance
    statusDuration: 3, // 3 turns
    description: "Temporarily increases strength by 4 points.",
    onHit: "Strength boosted!",
    onMiss: null
};
