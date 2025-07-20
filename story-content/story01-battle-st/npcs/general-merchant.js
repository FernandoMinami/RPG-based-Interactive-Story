export const npc = {
  id: "general-merchant",
  name: "Traveling Merchant",
  type: "merchant",
  description: "A friendly merchant with a variety of useful items",
  dialogue: {
    greeting: "Welcome, adventurer! I have many fine wares for sale.",
    farewell: "May your journey be prosperous!",
    noMoney: "I'm afraid you don't have enough gold for that item.",
    soldOut: "Sorry, that item is currently out of stock.",
    purchase: "Excellent choice! That will serve you well."
  },
  
  inventory: {
    "potion": { price: 12, stock: -1 }, // Unlimited healing potions
    "mana-potion": { price: 18, stock: -1 }, // Unlimited mana potions
    "super-potion": { price: 35, stock: 3 }, // Limited super potions
    "super-mana-potion": { price: 40, stock: 2 }, // Limited super mana potions
    "leather-helmet": { price: 25, stock: 2 }, // Basic equipment
    "scroll-of-healing": { price: 22, stock: 5 } // Magic scrolls
  }
};
