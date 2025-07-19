export default {
    name: "Magic Shield",
    type: "buff",
    range: "self",
    attribute: "magicDefense",
    amount: 10,
    turns: 5,
    mpCost: 12,
    description: "Creates a magical barrier that increases magic defense for several turns.",
    onHit: "Magic defense increased!",
    onMiss: ""
};
