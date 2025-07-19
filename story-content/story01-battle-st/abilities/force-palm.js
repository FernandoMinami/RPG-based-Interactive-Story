export default {
    name: "Force Palm",
    type: "physical",
    range: "close",
    minDamage: 15,
    maxDamage: 22,
    accuracy: 90,
    mpCost: 12,
    cooldown: 2,                            // 2 turn cooldown
    effect: { type: "stunned", chance: 0.4, turns: 1 },
    description: "A powerful palm strike that may stun the target but requires recovery time.",
    onHit: "The force palm connects with tremendous force!",
    onMiss: "The force palm misses!"
};
