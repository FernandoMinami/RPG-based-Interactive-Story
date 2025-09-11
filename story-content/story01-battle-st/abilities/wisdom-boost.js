export default {
    name: "Focus",
    type: "buff",
    range: "self",
    targetType: "self",
    mpCost: 8,
    statusToApply: "wisdomUp",
    statusChance: 1.0, // 100% chance
    statusDuration: 3, // 3 turns
    description: "Increases wisdom by 4 for 3 turns.",
    onHit: "Wisdom boosted!",
    onMiss: ""
};
