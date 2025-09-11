export default {
    name: "Fly",
    type: "status",
    range: "self",
    targetType: "self",
    minDamage: 0,
    maxDamage: 0,
    accuracy: 100,
    mpCost: 8,
    
    // Remove pinned status before applying flying
    removesStatusSelf: ["pinned"],
    
    // Apply flying status to self
    statusToApply: "flying",
    statusChance: 1.0, // 100% chance
    statusDuration: 0, // Permanent until removed
    
    description: "Leaps up, soaring to the sky.",
    onHit: "Takes flight and soars high into the sky!",
    onMiss: ""
};
