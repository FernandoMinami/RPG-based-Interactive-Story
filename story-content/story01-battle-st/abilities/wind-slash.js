export default {
    name: "Wind Slash",
    type: "magic",
    elementalType: "air",
    range: "ranged",
    minDamage: 4,
    maxDamage: 7,
    accuracy: 85,
    mpCost: 6,
    removesStatusSelf: ["pinned"],           // Breaks free from pins
    removesStatusTarget: ["flying"],         // Knocks flying enemies down
    description: "Sends a cutting wind blade that frees the user from pins and knocks flying enemies down.",
    onHit: "The wind slash cuts through the air and disrupts flight!",
    onMiss: "The wind slash misses!"
};
