
const primaryAttributeTemplate = {
  strength: 14,
  dexterity: 7,
  constitution: 11,
  intelligence: 5,
  charisma: 4,
  wisdom: 6
};


const baseSecondary = {
  maxLife: 0,
  life: 0, // Basic life for enemies
  lifeRegen: 0,  // Basic life regeneration
  maxMp: 0,     // Basic max MP
  mp: 0,        // Basic MP for abilities
  mpRegen: 0,    // Basic MP regeneration
  maxStamina: 0,
  stamina: 0,    // Basic stamina for abilities
  physicalDamage: 0,
  magicDamage: 0,
  physicalDefense: 0, // Physical defense stat that will be calculated
  magicDefense: 0, // Magic defense stat that will be calculated
  speed: 0,
  accuracy: 0
};

const miscAttributes = {
  races: ["undead"], // Example
  elementalAlignments: ["fire"], // Example
  height: 210, // Height in cm (large category: 190-230cm)
  weight: 120,  // Heavier than Enemy01, more effective with weight-based abilities
  isTamable: true, // Can be tamed as mount
  turnsToBeTamed: 5 // Takes 5 successful mounts to tame (very strong willed)
};

export const enemy = {
  name: "Enemy02",
  id: "enemy02",
  imagePath: "../story-content/story01-battle-st/img/enemies/enemy02.jpg", // Optional: path to enemy image

  // Ensure attributes exist for status system
  primary: { ...primaryAttributeTemplate },
  secondary: { ...baseSecondary },
  misc: { ...miscAttributes },

  // Status system integration
  statusEffects: [], // UI compatibility for status display

  // Character linking system for mounts, trapping, etc.
  linkedCharacters: {
    linkedTo: [],      // General character links
    trappedBy: [],     // Characters trapping this one
    mounting: null,    // Character this one is mounting
    mountedBy: null    // Character mounting this one
  },
  exp: 300, // EXP reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mp-potion", chance: 0.1 } // 10% chance to drop a mp potion
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