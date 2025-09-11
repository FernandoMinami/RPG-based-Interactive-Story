export default {
    id: "stomp",
    name: "Stomp",
    type: "physical",
    elementalType: "earth",
    range: "close",
    minDamage: 3,
    maxDamage: 8,
    accuracy: 90,
    usesWeight: true, // This ability benefits from attacker's weight
    requiresStatusTarget: "stunned", // Can only be used if target is stunned
    statusToApply: "pinned",
    statusChance: 1.0, // 100% chance
    statusDuration: 0, // Permanent until removed
    img: "stomp-attack.svg", // Image for this ability
    description: "Rises up and crashes down with full body weight!",
    onHit: "The massive stomp crushes down!",
    onMiss: "You dodged the crushing stomp!"
};
