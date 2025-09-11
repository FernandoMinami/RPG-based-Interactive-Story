// Dogpile Ability - Enhanced body slam that can combo with other enemies
export const ability = {
    id: "dogpile",
    name: "Dogpile",
    type: "physical",
    minDamage: 8,
    maxDamage: 15,
    accuracy: 85,
    usesWeight: true,
    range: "close",
    speed: 0,
    description: "Jumps on top of target with crushing weight. More effective when used in coordination with allies.",
    statusToApply: "pinned",
    statusChance: 0.35, // 35% chance
    statusDuration: 2, // 2 turns
    combo: {
        type: "ally", // Requires an ally to have used the ability
        followsFrom: ["body-slam"], // Must follow from ally using body slam
        description: "Most effective when an ally has recently used body slam on the same target"
    },
    comboBonus: {
        damageBonus: 10,
        pinChanceBonus: 0.25,
        weightMultiplier: 1.5,
        description: "When used as a combo, gains significant damage and pin chance bonus"
    }
};
