const baseSecondary = {
  defense: 0,
  natDefense: 0, // initial natural defense
  speed: 0,
  physicalDamage: 0,
  magicDamage: 0
};

export const enemy = {
  name: "Enemy01",
  id: "enemy01",
  weight: 60, // Weight in kg (used to do calculations like pin or fall damage)
  life: 70,
  maxLife: 70,
  secondary: { ...baseSecondary },
  exp: 300, // EXP reward
  gold: 8, // Gold reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mana-potion", chance: 0.1 } // 10% chance to drop a mana potion
  ],
  // List of ability IDs that this enemy can use  
  abilityIds: [
    "stomp",
    "tailWhip", 
    "fly"
  ]
};