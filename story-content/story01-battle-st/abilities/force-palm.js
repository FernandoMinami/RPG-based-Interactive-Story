export default {
    name: "Force Palm",
    type: "physical",
    range: "close",
    minDamage: 10,
    maxDamage: 18,
    accuracy: 90,
    mpCost: 8,
    effect: { type: "stunned", chance: 0.3, turns: 1 },
    description: "A powerful palm strike that may stun the target.",
    onHit: "The force palm connects!",
    onMiss: "The force palm misses!"
};
