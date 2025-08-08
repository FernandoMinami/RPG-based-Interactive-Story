const baseSecondary = {
  defense: 0,
  natDefense: 3, // initial natural defense
  speed: 0
};

export const enemy = {
  name: "Enemy02",
  id: "enemy02",
  type: "fire",
  imagePath: "../story-content/story01-battle-st/img/enemies/enemy02.jpg", // Optional: path to enemy image
  height: 210, // Height in cm (large category: 190-230cm)
  weight: 120, // Heavier than Enemy01, more effective with weight-based abilities
  life: 30,
  maxLife: 30,
  secondary: { ...baseSecondary },
  exp: 300, // EXP reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mana-potion", chance: 0.1 } // 10% chance to drop a mana potion
  ],
  loot: [
    { item: "toughHide", chance: 0.8 }, // 80% chance to drop tough hide
    { item: "sharpClaw", chance: 0.15 } // 15% chance to drop sharp claw
  ],
  // List of abilities with preference ratings
  // Ratings: "preferred" (5x), "frequent" (4x), "normal" (3x), "rare" (2x), "super-rare" (1x)
  abilityIds: [
    { id: "bite", rate: "normal" },
    { id: "tailWhip", rate: "preferred" },  // Was marked as favorite
    { id: "headbutt", rate: "preferred" }   // Was marked as favorite
  ]
};