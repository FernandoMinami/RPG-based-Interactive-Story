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
    purchase: "A fine choice! That piece will serve you well in battle.",
    selling: "Excellent craftsmanship! I'll give you a fair price for that.",
    sellingMonsterParts: "Ah, fresh from the hunt! These materials will be perfect for my next creation.",
    cantBuy: "I appreciate the offer, but that's not really my specialty. I only deal in weapons and armor."
  },
  
  // What types of items this NPC will buy from the player
  buyingPreferences: {
    // Item categories this NPC is interested in
    acceptedCategories: ["head", "body", "legs", "foot", "hand", "weapon"],
    acceptedTypes: ["armor", "equipable", "weapon"],
    // Percentage of original price they'll pay (0.5 = 50% of original price)
    priceMultiplier: 0.6,
    // Custom prices for specific items (overrides priceMultiplier)
    customPrices: {
      "metal-armor": 45,
      "metal-helmet": 30,
      "leather-helmet": 20
    }
  },
  
  inventory: {
    "metal-helmet": { price: 45, stock: 2 }, // Better armor
    "metal-armor": { price: 80, stock: 1 }, // High-end armor
    "scroll-of-armor-pierce": { price: 30, stock: 1 }, // Combat scrolls
    "scroll-of-precision-strike": { price: 35, stock: 1 },
    "scroll-of-vampiric-strike": { price: 50, stock: 1 } // Rare scroll
  }
};
