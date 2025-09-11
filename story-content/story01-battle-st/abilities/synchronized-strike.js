// Synchronized Strike - A combo ability that works with any ally body slam
export default {
    id: "synchronizedStrike",
    name: "Synchronized Strike",
    type: "physical",
    range: "close",
    minDamage: 15,
    maxDamage: 25,
    accuracy: 90,
    mpCost: 8,
    cooldown: 1,
    usesWeight: true,
    combo: {
        type: "ally", // Requires an ally to have used the prerequisite
        followsFrom: ["body-slam"], // Must follow from ally using body slam
        description: "Can only be used when an ally has recently used Body Slam"
    },
    statusToApply: "stunned",
    statusChance: 0.4, // 40% chance
    statusDuration: 1, // 1 turn
    description: "A perfectly timed strike that follows up on an ally's body slam, dealing extra damage and potentially stunning the target.",
    onHit: "The synchronized strike lands perfectly, capitalizing on the ally's attack!",
    onMiss: "The timing was off and the synchronized strike misses!",
    onCrit: "A flawless synchronized strike delivers devastating combo damage!"
};
