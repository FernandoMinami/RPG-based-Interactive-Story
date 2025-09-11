export default {
    name: "Poison Strike",
    type: "physical",
    range: "close",
    minDamage: 0,
    maxDamage: 0,
    accuracy: 95,
    mpCost: 0,
    statusToApply: "poisoned",
    statusChance: 1.0, // 100% chance
    statusDuration: 4, // 4 turns
    description: "A strike that inflicts poison on the target.",
    onHit: "The poison strike hits and toxins spread!",
    onMiss: "The poison strike misses!"
};
