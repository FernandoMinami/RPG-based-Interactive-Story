export const ability = {
    name: "Headbutt",
    type: "physical", // Physical attack type
    minDamage: 4,
    maxDamage: 6,
    accuracy: 90, // 90% base chance to hit
    requiresStatusTarget: "stunned", // Only use if player is stunned
    effect: null
};
