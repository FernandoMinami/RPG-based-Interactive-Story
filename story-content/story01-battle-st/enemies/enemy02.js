const baseSecondary = {
  defense: 0,
  natDefense: 3, // initial natural defense
  speed: 0
};

export const enemy = {
  name: "Enemy02",
  id: "enemy02",
  weight: 60, // Weight in kg
  life: 30,
  maxLife: 30,
  secondary: { ...baseSecondary },
  exp: 300, // EXP reward
  gold: 8, // Gold reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mana-potion", chance: 0.1 } // 10% chance to drop a mana potion
  ],
  attacks: [
    {
      name: "Bite",
      minDamage: 5,
      maxDamage: 8,
      accuracy: 90, // 90% base chance to hit
      effect: null
    },
    {
      name: "Tail Whip",
      minDamage: 2,
      maxDamage: 5,
      accuracy: 60, // 90% base chance to hit
      effect: { type: "stun", chance: 1, turns: 2 },
      favorite: true // This attack is favored

    },
    {
      name: "headbutt",
      minDamage: 4,
      maxDamage: 6,
      accuracy: 90, // 90% base chance to hit

      requiresStatus: "stun", // Only use if player is stunned
      effect: null,
      favorite: true // This attack is favored
    }
  ]
};