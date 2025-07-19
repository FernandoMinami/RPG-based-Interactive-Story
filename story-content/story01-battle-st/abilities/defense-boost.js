export default {
    name: "Physical Guard",
    type: "buff",
    range: "self",
    attribute: "physicDefense",
    amount: 10,
    turns: 5,
    mpCost: 10,
    description: "Increases physical defense for several turns.",
    onHit: "Physical defense increased!",
    onMiss: ""
};
