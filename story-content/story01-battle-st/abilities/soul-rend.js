export default {
    name: "Soul Rend",
    type: "magic",
    range: "ranged",
    minDamage: 20,
    maxDamage: 30,
    accuracy: 80,
    mpCost: 20,
    usesPerBattle: 2,                       // Can only be used twice per battle
    breaksDefense: true,
    lifeSteal: 0.4,
    description: "An ultimate dark magic attack that bypasses defenses and drains life. Limited uses.",
    onHit: "Dark magic tears through defenses and drains life!",
    onMiss: "The soul rending magic dissipates harmlessly!",
    onCrit: "The soul is torn asunder!"
};
