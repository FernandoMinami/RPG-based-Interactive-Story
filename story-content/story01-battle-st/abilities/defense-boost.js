export default {
    name: "Defense Curl",
    type: "buff",
    range: "self",
    attribute: "defense",
    amount: 10,
    turns: 5,
    mpCost: 10,
    description: "Increases defense for several turns.",
    onHit: "Defense increased!",
    onMiss: null
};
