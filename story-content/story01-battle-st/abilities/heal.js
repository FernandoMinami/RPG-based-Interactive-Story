export default {
    name: "Quick Heal",
    type: "heal",
    range: "self",
    amount: 20,
    mpCost: 8,
    description: "Restores a moderate amount of health.",
    onHit: "Health restored!",
    onMiss: null // Healing abilities don't miss
};
