export default {
    name: "Stunning Blow",
    type: "physical",
    range: "close",
    minDamage: 0,
    maxDamage: 0,
    accuracy: 95,
    mpCost: 0,
    statusToApply: "stunned",
    statusChance: 1.0, // 100% chance
    statusDuration: 2, // 2 turns
    description: "A blow that stuns the target.",
    onHit: "The stunning blow connects and dazes the target!",
    onMiss: "The stunning blow misses!"
};
