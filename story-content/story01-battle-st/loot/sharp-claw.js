// Sharp Claw - Uncommon loot
export default {
    name: "Sharp Claw",
    description: "A razor-sharp claw that could be fashioned into a weapon or tool. Quite valuable.",
    type: "loot",
    value: 20,
    rarity: "uncommon",
    category: "crafting_material",
    source: "various",
    icon: "🗡️",
    sellMessage: "The merchant's eyes light up as they examine the sharp claw.",
    
    sell(quantity = 1) {
        return this.value * quantity;
    }
};
