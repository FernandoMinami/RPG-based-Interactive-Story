// Enemy definition for battle system
const primaryAttributes = {
  strength: 16,
  dexterity: 6,
  constitution: 18,
  intelligence: 4,
  charisma: 6,
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
  races: ["metallic-rhinoceros"], // Metallic rhinoceros species
  elementalAlignments: ["earth"], // Heavy metal creature
  height: 180, // cm - Perfect mount size
  weight: 400, // kg - Extremely heavy metallic creature, ideal stable mount
  isTamable: true, // Can be tamed as mount
  turnsToBeTamed: 5 // Takes 5 successful mounts to tame (very strong willed)
};

export const enemy = {
  name: "Iron Beast",
  id: "iron-beast",
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
  // COMBO STRATEGY: Mounts Sky Crusher for aerial attacks, or follows up on body slam combos
  abilityIds: [
    { id: "bodySlam", rate: "preferred" }, // Primary devastating attack - sets up combos
    { id: "dogpile", rate: "rare" } // Combo follow-up when ally uses body slam  
  ],

  exp: 200, // EXP reward
  drops: [
    { item: "potion", chance: 0.4 }, // 40% chance to drop a potion
    { item: "mp-potion", chance: 0.1 } // 10% chance to drop a mp potion
  ],
  loot: [
    { item: "iron-plate", chance: 0.8 }, // 80% chance to drop iron plate
    { item: "beast-horn", chance: 0.4 } // 40% chance to drop beast horn
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
