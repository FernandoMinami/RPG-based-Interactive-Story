export default {
    id: "weaknessCurse",
    name: "Weakness Curse",
    type: "debuff",
    range: "target",
    targetType: "enemy",
    mpCost: 8,
    statusToApply: "weaknessCurse",
    statusChance: 1.0, // 100% chance
    statusDuration: 3, // 3 turns
    description: "Weakens the target, reducing their strength and constitution.",
    onHit: "Dark energy weakens the enemy!",
    onMiss: "The curse misses its target!"
};
