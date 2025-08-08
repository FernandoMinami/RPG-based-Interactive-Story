export default {
    name: "Body Slam",
    type: "physical",
    range: "close",
    minDamage: 10,
    maxDamage: 20,
    accuracy: 85,
    mpCost: 5,
    usesWeight: true, // This ability gets major benefit from weight
    cooldown: 2, // Takes 2 turns to recover
    effect: { target: "enemy", type: "stunned", chance: 0.3, turns: 1 },
    description: "Throws entire body weight at the enemy with crushing force!",
    onHit: "A massive body slam crushes the target!",
    onMiss: "The heavy attack misses as the target dodges!",
    onCrit: "The full weight crashes down with devastating impact!",
    onOverkill: "The crushing weight completely overwhelms the target!"
};
