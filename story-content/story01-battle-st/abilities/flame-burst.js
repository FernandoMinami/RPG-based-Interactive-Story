export default {
    name: "Flame Burst",
    type: "magic",
    elementalType: "fire",
    range: "range",
    minDamage: 90,
    maxDamage: 90,
    accuracy: 95,
    mpCost: 10,
    cooldown: 1,
    description: "A burst of magical fire that can start elemental combinations.",
    onHit: "Flames engulf the target!",
    onMiss: "The flames miss their mark!",
    onCrit: "A torrential blaze erupts around the enemy!",
    onOverkill: "The overwhelming inferno completely incinerates the enemy!"
};
