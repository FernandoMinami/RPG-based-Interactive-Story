export default {
    name: "Physical Guard",
    type: "buff",
    range: "self",
    targetType: "self",
    mpCost: 10,
    statusToApply: "defenseUp",
    statusChance: 1.0, // 100% chance
    statusDuration: 5, // 5 turns
    description: "Increases physical defense for several turns.",
    onHit: "Physical defense increased!",
    onMiss: ""
};
