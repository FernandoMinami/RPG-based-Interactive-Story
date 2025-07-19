export default {
    name: "Power Surge",
    type: "physical",
    range: "close",
    minDamage: 130,
    maxDamage: 150,
    accuracy: 90,
    mpCost: 8,
    cooldown: 2,
    usesPerBattle: 2,
    critChance: 0.1,         // +10% crit chance bonus
    combo: {
        followsFrom: ["Quick Attack"]  // Can only use after Quick Attack
    },
    description: "A powerful follow-up attack that builds on momentum from a quick strike.",
    onHit: "The power surge devastates the target!",
    onMiss: "The power surge swings wide!",
    onCrit: "A devastating surge of power crushes the enemy!"
};
