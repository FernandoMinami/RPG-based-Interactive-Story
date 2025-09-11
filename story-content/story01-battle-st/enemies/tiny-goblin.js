// Enemy definition for battle system
const primaryAttributes = {
  strength: 8,
  dexterity: 15, // Fast and agile
  constitution: 8,
  intelligence: 12,
  charisma: 14,
  wisdom: 10
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
  races: ["goblin"], // Goblin species
  elementalAlignments: ["earth"], // Earth type
  height: 120, // cm - Very small
  weight: 40, // kg - Very light
  isTamable: true, // Can be tamed
  turnsToBeTamed: 2 // Easy to tame
};

export const enemy = {
  name: "Tiny Goblin",
  id: "tiny-goblin",
  imagePath: "../story-content/story01-battle-st/img/enemies/tiny-goblin.jpg", // Optional: path to enemy image
  
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
  // Small goblin strategy: Mount big enemies for advantage, use quick attacks
  abilityIds: [
    { id: "quickAttack", rate: "preferred" }, // Fast strikes
    { id: "mount", rate: "frequent", preferredTarget: "ally" }, // Tries to mount big enemies
    { id: "precisionStrike", rate: "normal" } // Accurate attacks
  ],

  exp: 150, // EXP reward
  drops: [
    { item: "potion", chance: 0.3 }, // 30% chance to drop a potion
    { item: "mp-potion", chance: 0.2 } // 20% chance to drop a mp potion
  ],
  loot: [
    { item: "goblin-tooth", chance: 0.9 }, // 90% chance to drop goblin tooth
    { item: "small-leather", chance: 0.6 } // 60% chance to drop small leather
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
