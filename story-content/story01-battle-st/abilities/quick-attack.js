export default {
    name: "Quick Attack",
    type: "physical",
    elementalType: "neutral",
    range: "close",
    minDamage: 40,
    maxDamage: 90,
    accuracy: 95,
    mpCost: 0,
    critChance: 0.05,        // +5% crit chance bonus (speed-based)
    description: "A fast physical strike that can find weak points.",
    onHit: "The quick attack hits! TEST",
    onMiss: "The quick attack misses!",
    onCrit: "A swift strike finds a weak spot!"
};
