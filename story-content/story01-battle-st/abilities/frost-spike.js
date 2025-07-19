export default {
    name: "Frost Spike",
    type: "magic",
    range: "ranged",
    minDamage: 100,
    maxDamage: 120,
    accuracy: 90,
    mpCost: 12,
    cooldown: 2,
    usesPerBattle: 3,
    combo: {
        followsFrom: ["Flame Burst"]  // Creates steam explosion combo
    },
    description: "Ice magic that creates explosive steam when combined with fire.",
    onHit: "The frost spike pierces through!",
    onMiss: "The icy projectile misses!",
    onCrit: "A massive steam explosion erupts from the elemental reaction!"
};
