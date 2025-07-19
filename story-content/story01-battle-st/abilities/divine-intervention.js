export default {
    name: "Divine Intervention",
    type: "heal",
    range: "self",
    amount: 50,                             // Heals 50 HP
    mpCost: 25,
    cooldown: 4,                            // 4 turn cooldown
    usesPerBattle: 1,                       // Only once per battle
    removesStatusSelf: ["poisoned", "stunned", "burned", "frozen"], // Removes all debuffs
    description: "A miraculous healing that restores health and removes all ailments. Once per battle, long recovery.",
    onHit: "Divine light restores health and purifies all ailments!",
    onMiss: null
};
