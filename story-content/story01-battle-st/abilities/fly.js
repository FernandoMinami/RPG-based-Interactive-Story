export default {
    name: "Fly",
    type: "status",
    range: "self",
    minDamage: 0,
    maxDamage: 0,
    accuracy: 100,
    removesPin: true,
    effect: { target: "self", type: "flying", chance: 1, permanent: true },
    favorite: true, // Enemy AI prefers this ability
    description: "Leaps up, soaring to the sky.",
    onHit: "Takes flight and soars high into the sky!",
    onMiss: ""
};
