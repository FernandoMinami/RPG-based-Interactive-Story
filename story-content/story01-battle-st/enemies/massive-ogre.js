// Enemy definition for battle system
const primaryAttributes = {
  strength: 18,
  dexterity: 6,
  constitution: 16,
  intelligence: 6,
  charisma: 4,
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
  races: ["ogre"], // Ogre species
  elementalAlignments: ["earth"], // Earth type
  height: 280, // cm - Enormous
  weight: 350, // kg - Extremely heavy
  isTamable: true, // Can be tamed as mount
  turnsToBeTamed: 7 // Very difficult to tame
};

export const enemy = {
  name: "Massive Ogre",
  id: "massive-ogre",
  imagePath: "../story-content/story01-battle-st/img/enemies/massive-ogre.jpg", // Optional: path to enemy image
  
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
  // Massive ogre strategy: Crush enemies with weight and size
  abilityIds: [
    { id: "bodySlam", rate: "normal" }, // Devastating weight attacks
    { id: "mount", rate: "preferred", preferredTarget: "ally" }, // Crushes small enemies when mounting
    { id: "stomp", rate: "normal" } // Area damage
  ],

  exp: 400, // EXP reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mp-potion", chance: 0.1 } // 10% chance to drop a mp potion
  ],
  loot: [
    { item: "ogre-bone", chance: 0.8 }, // 80% chance to drop ogre bone
    { item: "thick-hide", chance: 0.7 }, // 70% chance to drop thick hide
    { item: "giant-club", chance: 0.3 } // 30% chance to drop giant club
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
