export const item = {
  id: "flight-essence",
  name: "Flight Essence",
  description: "Magical essence that grants temporary flight ability. Glows with ethereal energy.",
  type: "consumable", // Consumable item
  value: 50, // Higher value due to magical properties
  weight: 0.1, // Very light magical essence
  stackable: true,
  maxStack: 10, // Limited stacking due to magical instability
  
  // Usage effects
  effects: [
    {
      type: "temporary_ability",
      abilityId: "fly",
      duration: 3, // Grants fly ability for 3 turns
      description: "Grants the Fly ability for 3 turns"
    }
  ],
  
  // Usage requirements
  usableInCombat: true,
  usableOutOfCombat: false, // Only useful in combat situations
  
  // Flavor text
  lore: "Extracted from the wings of flying creatures, this essence temporarily grants the power of flight to those who consume it. The effect is brief but powerful."
};
