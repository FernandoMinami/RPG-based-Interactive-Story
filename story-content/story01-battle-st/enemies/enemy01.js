const baseSecondary = {
  defense: 0,
  natDefense: 0, // initial natural defense
  speed: 0,
  physicDamage: 0,
  magicDamage: 0
};

export const enemy = {
  name: "Enemy01",
  id: "enemy01",
  height: 140, // Height in cm (small category: 120-150cm)
  weight: 60, // Weight in kg (used to do calculations like pin or fall damage)
  life: 70,
  maxLife: 70,
  secondary: { ...baseSecondary },
  exp: 300, // EXP reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mana-potion", chance: 0.1 } // 10% chance to drop a mana potion
  ],
  loot: [
    { item: "smallBone", chance: 0.7 }, // 70% chance to drop small bone
    { item: "sharpClaw", chance: 0.1 } // 10% chance to drop sharp claw
  ],
  // List of abilities with preference ratings
  // Ratings determine how often an enemy uses each ability:
  // - "preferred": 5x weight (most likely to be used)
  // - "frequent": 4x weight 
  // - "normal": 3x weight (default)
  // - "rare": 2x weight
  // - "super-rare": 1x weight (least likely to be used)
  // Format: { id: "abilityId", rate: "ratingLevel" }
  abilityIds: [
    { id: "stomp", rate: "preferred" },
    { id: "tailWhip", rate: "frequent" }, 
    { id: "fly", rate: "rare" }
  ]
};