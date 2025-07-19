export default {
    name: "Precision Strike",
    type: "physical",
    range: "close",
    minDamage: 8,
    maxDamage: 12,
    accuracy: 95,
    mpCost: 8,
    critChance: 0.15,        // +15% crit chance bonus
    critMultiplier: 2.5,     // 2.5x damage on crit instead of 2.0x
    description: "A carefully aimed attack with increased critical hit chance and damage.",
    onHit: "A precise strike finds its mark!",
    onMiss: "The precision strike misses!",
    onCrit: "A perfectly executed strike!"
};
