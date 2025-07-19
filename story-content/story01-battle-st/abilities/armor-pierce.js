export default {
    name: "Armor Pierce",
    type: "physical",
    range: "close",
    minDamage: 12,
    maxDamage: 18,
    accuracy: 85,
    mpCost: 8,
    breaksDefense: true,
    description: "A powerful attack that pierces through armor, ignoring enemy defenses.",
    onHit: "The attack pierces through the enemy's defenses!",
    onMiss: "The piercing attack misses its mark!"
};
