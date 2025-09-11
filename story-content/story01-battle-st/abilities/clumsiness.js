export default {
    id: "clumsiness",
    name: "Clumsiness",
    type: "debuff", 
    range: "target",
    targetType: "enemy",
    mpCost: 6,
    statusToApply: "clumsiness",
    statusChance: 1.0, // 100% chance
    statusDuration: 4, // 4 turns
    description: "Makes the target clumsy, reducing their dexterity significantly.",
    onHit: "The target becomes unsteady and clumsy!",
    onMiss: "The clumsiness spell fails!"
};
