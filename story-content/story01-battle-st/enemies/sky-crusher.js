// Enemy definition for battle system
const primaryAttributes = {
  strength: 12,
  dexterity: 14,
  constitution: 10,
  intelligence: 8,
  charisma: 6,
  wisdom: 9
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
  races: ["gargoyle"], // Gargoyle species
  elementalAlignments: ["earth"], // Heavy stone creature
  height: 220, // cm - Large and intimidating
  weight: 150, // kg - Very heavy stone creature
  isTamable: true, // Can be tamed as mount
  turnsToBeTamed: 4 // Takes 4 successful mounts to tame
};

export const enemy = {
  name: "Sky Crusher",
  id: "sky-crusher",
  imagePath: "../story-content/story01-battle-st/img/enemies/enemy02.jpg", // Optional: path to enemy image
  
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
  // COMBO STRATEGY: Uses body-slam to pin enemies, setting up dogpile combos for allies
  abilityIds: [
    { id: "fly", rate: "frequent" }, // Flying ability
    { id: "body-slam", rate: "preferred" }, // Primary attack - sets up combos
    { id: "dogpile", rate: "rare" }, // Combo follow-up when ally uses body slam
    { id: "synchronized-strike", rate: "rare" }, // Alternative combo follow-up
    { id: "mount", rate: "normal", preferredTarget: "ally" } // Prefers mounting allies over enemies
  ],

  exp: 180, // EXP reward
  drops: [
    { item: "potion", chance: 0.3 }, // 30% chance to drop a potion
    { item: "mp-potion", chance: 0.2 } // 20% chance to drop a mp potion
  ],
  loot: [
    { item: "stone-fragment", chance: 0.7 }, // 70% chance to drop stone fragment
    { item: "flight-essence", chance: 0.3 } // 30% chance to drop flight essence
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
