export default {
    name: "Water Burst",
    type: "magic",
    elementalType: "water",
    range: "range",
    minDamage: 90,
    maxDamage: 90,
    accuracy: 95,
    mpCost: 10,
    cooldown: 1,
    description: "A burst of magical water that can start elemental combinations.",
    onHit: "Water engulfs the target!",
    onMiss: "The water misses its mark!",
    onCrit: "A torrential downpour erupts around the enemy!",
    onOverkill: "The overwhelming torrent completely drowns the enemy!"
};
