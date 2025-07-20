export const npc = {
  id: "npc-template",
  name: "NPC Template",
  type: "merchant", // or "quest", "info", etc.
  description: "A template for creating NPCs",
  dialogue: {
    greeting: "Hello, traveler!",
    farewell: "Safe travels!"
  },
  
  // For merchant NPCs
  inventory: {
    // itemId: { price: number, stock: number (-1 for unlimited) }
    "potion": { price: 10, stock: -1 },
    "mana-potion": { price: 15, stock: 5 }
  },
  
  // For quest NPCs (future)
  quests: [],
  
  // For info NPCs (future)
  information: []
};
