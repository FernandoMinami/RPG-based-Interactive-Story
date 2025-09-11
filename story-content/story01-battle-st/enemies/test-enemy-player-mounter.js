// Enemy definition for battle system
const primaryAttributes = {
  strength: 14,
  dexterity: 8,
  constitution: 12,
  intelligence: 5,
  charisma: 6,
  wisdom: 7
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
  races: ["beast"], // Beast species
  elementalAlignments: ["earth"], // Earth type
  height: 200, // cm - Larger than most players
  weight: 150, // kg - Heavy
  isTamable: false, // Cannot be tamed
  turnsToBeTamed: 0 // Not tamable
};

export const enemy = {
  name: "Player Mounter",
  id: "player-mounter",
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
  // This enemy prefers mounting enemies (players) over allies
  abilityIds: [
    { id: "body-slam", rate: "normal" }, // Body slam attack
    { id: "mount", rate: "preferred", preferredTarget: "enemy" } // Prefers mounting enemies (player)
  ],

  exp: 150, // EXP reward
  drops: [
    { item: "potion", chance: 0.3 } // 30% chance to drop a potion
  ],
  loot: [
    { item: "stone-fragment", chance: 0.5 } // 50% chance to drop stone fragment
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
