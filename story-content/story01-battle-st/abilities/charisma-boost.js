export default {
    name: "Inspire",
    type: "buff",
    range: "self",
    targetType: "self",
    mpCost: 12,
    statusToApply: "charismaUp",
    statusChance: 1.0, // 100% chance
    statusDuration: 3, // 3 turns
    description: "Temporarily increases charisma.",
    onHit: "Charisma boosted!",
    onMiss: ""
};
