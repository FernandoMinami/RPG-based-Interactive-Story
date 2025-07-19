export default {
    name: "Finishing Blow",
    type: "physical",
    range: "close",
    minDamage: 200,
    maxDamage: 240,
    accuracy: 85,
    mpCost: 15,
    cooldown: 4,
    usesPerBattle: 1,
    critChance: 0.2,         // +20% crit chance bonus
    combo: {
        followsFrom: ["Power Surge"]  // Can only use after Power Surge
    },
    description: "A devastating final strike that completes a perfect combo sequence.",
    onHit: "The finishing blow delivers devastating damage!",
    onMiss: "The finishing blow fails to connect!",
    onCrit: "A perfect finishing blow completely overwhelms the enemy!"
};
