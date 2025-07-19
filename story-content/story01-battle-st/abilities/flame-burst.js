export default {
    name: "Flame Burst",
    type: "magic",
    range: "close",
    minDamage: 90,
    maxDamage: 110,
    accuracy: 95,
    mpCost: 10,
    cooldown: 1,
    description: "A burst of magical flame that can start elemental combinations.",
    onHit: "Flames engulf the target!",
    onMiss: "The flames miss their mark!",
    onCrit: "A blazing inferno erupts around the enemy!"
};
