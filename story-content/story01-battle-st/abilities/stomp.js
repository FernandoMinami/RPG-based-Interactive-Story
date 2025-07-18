export default {
    name: "Stomp",
    type: "physical",
    range: "close",
    minDamage: 3,
    maxDamage: 8,
    accuracy: 90,
    requiresStatus: "stunned", // Can only be used if target is stunned
    effect: { target: "enemy", type: "pinned", chance: 1 },
    description: "Rises paw up ready to stomp down!",
    onHit: "The paw hits!",
    onMiss: "You dodged the stomp!"
};
