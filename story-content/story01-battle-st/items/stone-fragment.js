export const item = {
  id: "stone-fragment",
  name: "Stone Fragment",
  description: "A piece of hardened stone from a gargoyle's body. Can be used for crafting stone-based equipment.",
  type: "material", // Crafting material
  value: 15, // Base value in gold
  weight: 2, // Weight in kg
  stackable: true, // Can be stacked in inventory
  maxStack: 99, // Maximum stack size
  
  // Crafting properties
  craftingMaterial: true,
  materialType: "stone",
  durability: 85, // High durability for stone
  
  // Usage effects (none for basic material)
  effects: [],
  
  // Flavor text
  lore: "The remnants of a once-mighty gargoyle, these stone fragments retain some of the creature's natural toughness and could prove useful in creating defensive equipment."
};
