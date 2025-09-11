export const item = {
  id: "beast-horn",
  name: "Beast Horn",
  description: "A massive horn from an Iron Beast. Could be fashioned into a powerful weapon.",
  type: "material", // Crafting material
  value: 75, // High value as weapon material
  weight: 8, // Very heavy horn
  stackable: true,
  maxStack: 10, // Limited due to size
  
  // Crafting properties
  craftingMaterial: true,
  materialType: "bone", // Bone/horn type material
  durability: 90, // High durability
  weaponMaterial: true, // Specifically good for weapons
  
  // Usage effects (none for basic material)
  effects: [],
  
  // Potential crafting recipes (for future expansion)
  canCraftInto: ["horn-spear", "horn-club", "horn-dagger"],
  
  // Flavor text
  lore: "The horn of an Iron Beast is as hard as steel and twice as sharp. Master craftsmen prize these for creating weapons of exceptional quality and piercing power."
};
