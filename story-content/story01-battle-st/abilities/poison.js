export default {
    name: "Poison Strike",
    type: "physical",
    range: "close",
    minDamage: 0,
    maxDamage: 0,
    accuracy: 95,
    mpCost: 0,
    effect: { type: "poisoned", chance: 1, turns: 4 },
    description: "A strike that inflicts poison on the target.",
    onHit: "The poison strike hits and toxins spread!",
    onMiss: "The poison strike misses!"
};
