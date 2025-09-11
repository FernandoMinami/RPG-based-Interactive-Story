export default {
    id: "bodySlam",
    name: "Body Slam",
    type: "physical",
    range: "close",
    minDamage: 10,
    maxDamage: 20,
    accuracy: 85,
    mpCost: 5,
    usesWeight: true, // This ability gets major benefit from weight
    cooldown: 2, // Takes 2 turns to recover
    img: "body-slam-attack.svg", // Image for this ability
    description: "Throws entire body weight at the enemy with crushing force, potentially pinning them down!",
    onHit: "A massive body slam crushes the target and pins them under the weight!",
    onMiss: "The heavy attack misses as the target dodges!",
    onCrit: "The full weight crashes down with devastating impact, completely pinning the target!",
    onOverkill: "The crushing weight completely overwhelms and traps the target!",
    
    // New status system integration
    statusToApply: "pinned",
    statusChance: 0.7, // 70% chance to pin
    statusDuration: 0, // Permanent until broken free
    
    // Secondary effect - stun chance
    secondaryStatusToApply: "stunned",
    secondaryStatusChance: 0.3, // 30% chance to stun
    secondaryStatusDuration: 1 // 1 turn stun
};
