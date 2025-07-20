// Tough Hide - Common loot from Enemy02
export default {
    name: "Tough Hide",
    description: "A piece of thick, durable hide from a large creature. Popular with leather workers.",
    type: "loot",
    value: 12,
    rarity: "common",
    category: "monster_part",
    source: "enemy02",
    icon: "🪣",
    sellMessage: "The merchant feels the hide's texture and offers a fair price.",
    
    sell(quantity = 1) {
        return this.value * quantity;
    }
};
