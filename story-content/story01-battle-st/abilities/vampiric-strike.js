export default {
    name: "Vampiric Strike",
    type: "physical",
    range: "close",
    minDamage: 8,
    maxDamage: 14,
    accuracy: 90,
    mpCost: 10,
    lifeSteal: 0.5,
    description: "A dark attack that steals life force from the enemy, healing the user for half the damage dealt.",
    onHit: "Dark energy drains the enemy's life force!",
    onMiss: "The vampiric strike fails to connect!"
};
