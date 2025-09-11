export default {
    name: "Iron Body",
    type: "buff",
    range: "self",
    mpCost: 12,
    description: "Temporarily increases constitution by 4 points and maximum life by 15 points.",
    onHit: "Constitution boosted!",
    onMiss: "",
    
    // New status system integration
    statusToApply: "constitutionUp",
    statusDuration: 3, // 3 turns
    statusChance: 1.0  // Always applies (100% chance)
};
