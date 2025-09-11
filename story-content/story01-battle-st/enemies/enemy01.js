// Enemy definition for battle system
const primaryAttributes = {
  strength: 12,
  dexterity: 8,
  constitution: 10,
  intelligence: 14,
  charisma: 5,
  wisdom: 8
};

//enemy secondary attributes
const secondaryAttributes = {
  maxLife: 0,
  life: 0, // Basic life for enemies
  lifeRegen: 0, // Basic life regeneration
  maxMp: 0,     // Basic max MP
  mp: 0,        // Basic MP for enemies
  mpRegen: 0,    // Basic MP regeneration
  maxStamina: 0,
  stamina: 0,    // Basic stamina for enemies
  physicalDamage: 0,
  magicDamage: 0,
  physicalDefense: 0,
  magicDefense: 0, // initial magic defense
  speed: 0,
  accuracy: 0
};

const miscAttributes = {
  races: ["undead"], // Example
  elementalAlignments: ["fire"], // Example
  height: 230, // in cm
  weight: 200,  // in kg
  isTamable: false, // Can be tamed as mount
  turnsToBeTamed: 0 // Takes 5 successful mounts to tame (very strong willed)
};

export const enemy = {
  name: "Enemy01",
  id: "enemy01",
  imagePath: "../story-content/story01-battle-st/img/enemies/enemy01.jpg", // Optional: path to enemy image

  // Ensure attributes exist for status system
  primary: { ...primaryAttributes },
  secondary: { ...secondaryAttributes },
  misc: { ...miscAttributes },

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
  ],

  exp: 300, // EXP reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mp-potion", chance: 0.1 } // 10% chance to drop a mp potion
  ],
  loot: [
    { item: "smallBone", chance: 0.7 }, // 70% chance to drop small bone
    { item: "sharpClaw", chance: 0.1 } // 10% chance to drop sharp claw
  ],

  // Status system integration
  statusEffects: [], // UI compatibility for status display

  // Character linking system for mounts, trapping, etc.
  linkedCharacters: {
    linkedTo: [],      // General character links
    trappedBy: [],     // Characters trapping this one
    mounting: null,    // Character this one is mounting
    mountedBy: null    // Character mounting this one
  }
};