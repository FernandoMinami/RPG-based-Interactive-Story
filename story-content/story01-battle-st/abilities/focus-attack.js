export default {
    id: "focusAttack",
    name: "Focus Attack",
    type: "buff",
    range: "self",
    targetType: "self",
    mpCost: 18,
    statusToApply: "focusAttack",
    statusChance: 1.0, // 100% chance
    statusDuration: 2, // 2 turns
    description: "Increases focus and precision, boosting dexterity by 5 and strength by 3 for 2 turns.",
    onHit: "Focus sharpened! Ready to strike with precision!",
    onMiss: ""
};
