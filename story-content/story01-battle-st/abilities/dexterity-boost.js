export default {
    name: "Agility",
    type: "buff",
    range: "self",
    attribute: "dexterity",
    amount: 4,
    turns: 3,
    mpCost: 12,
    description: "Temporarily increases dexterity.",
    onHit: "Agility boosted!",
    onMiss: null
};
