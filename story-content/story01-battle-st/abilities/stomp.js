export default {
    name: "Stomp",
    type: "physical",
    elementalType: "earth",
    range: "close",
    minDamage: 3,
    maxDamage: 8,
    accuracy: 90,
    usesWeight: true, // This ability benefits from attacker's weight
    requiresStatusTarget: "stunned", // Can only be used if target is stunned
    effect: { target: "enemy", type: "pinned", chance: 1 },
    description: "Rises up and crashes down with full body weight!",
    onHit: "The massive stomp crushes down!",
    onMiss: "You dodged the crushing stomp!"
};
