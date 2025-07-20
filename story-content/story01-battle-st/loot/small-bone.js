// Small Bone - Common loot from Enemy01
export default {
    name: "Small Bone",
    description: "A small, sturdy bone from a defeated creature. Could be useful for crafting or trade.",
    type: "loot",
    value: 5,
    rarity: "common",
    category: "monster_part",
    source: "enemy01",
    icon: "🦴",
    sellMessage: "The merchant examines the bone and nods approvingly.",
    
    sell(quantity = 1) {
        return this.value * quantity;
    }
};
