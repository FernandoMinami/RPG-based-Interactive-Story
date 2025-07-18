export default {
    name: "Stunning Blow",
    type: "physical",
    range: "close",
    minDamage: 0,
    maxDamage: 0,
    accuracy: 95,
    mpCost: 0,
    effect: { type: "stunned", chance: 1, turns: 2 },
    description: "A blow that stuns the target.",
    onHit: "The stunning blow connects and dazes the target!",
    onMiss: "The stunning blow misses!"
};
