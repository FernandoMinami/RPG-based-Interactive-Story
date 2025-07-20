export const npc = {
  id: "blacksmith",
  name: "Master Blacksmith Gareth",
  type: "merchant",
  description: "An experienced blacksmith who crafts fine weapons and armor",
  dialogue: {
    greeting: "Ah, a warrior! I have the finest weapons and armor in the land.",
    farewell: "May your blade stay sharp and your armor strong!",
    noMoney: "Quality work costs gold, friend. Come back when you have more coin.",
    soldOut: "I'm still working on more of those. Check back later!",
    purchase: "A fine choice! That piece will serve you well in battle."
  },
  
  inventory: {
    "metal-helmet": { price: 45, stock: 2 }, // Better armor
    "metal-armor": { price: 80, stock: 1 }, // High-end armor
    "scroll-of-armor-pierce": { price: 30, stock: 1 }, // Combat scrolls
    "scroll-of-precision-strike": { price: 35, stock: 1 },
    "scroll-of-vampiric-strike": { price: 50, stock: 1 } // Rare scroll
  }
};
