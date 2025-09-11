export const POTION_HEAL = 20;

const primaryAttributeTemplate = {
  strength: 8,
  dexterity: 17,
  constitution: 10,
  charisma: 13,
  wisdom: 10,
  intelligence: 12
};

const baseSecondary = {
  maxLife: 0, // Will be calculated based on constitution
  maxMp: 0, // Will be calculated based on intelligence
  mpRegen: 0, // Will be calculated based on intelligence
  lifeRegen: 0, // Will be calculated based on constitution
  physicalDamage: 0,
  magicDamage: 0,
  physicalDefense: 0, // Will be calculated based on constitution
  magicDefense: 0, // Will be calculated based on intelligence
  speed: 0
};

const miscAttributes = {
  races: ["human"], // Player race (affects story choices)
  elementalAlignments: ["neutral"], // Combat type (affects damage/resistance)
  height: 170, // in cm
  weight: 70  // in kg
};

export const player = {
  name: "Template Character",
  id: "character-template",
  maxLife: 0,
  life: 0,
  mp: 0,    // Primary MP property
  maxMp: 0, // Primary max MP property
  mp: 0,  // Keep for compatibility
  maxMp: 0,  // Keep for compatibility
  mpRegen: 0,
  level: 1,
  exp: 0,
  attributePoints: 30,
  potions: 0,
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
  
  // List of ability IDs that this character can use
  abilityIds: [
    "defenseBoost",
    "heal",
    "strengthBoost",
    "dexterityBoost", 
    "constitutionBoost",
    "charismaBoost",
    "wisdomBoost",
    "intelligenceBoost"
  ],
  equipment: {
    body: null,
    legs: null,
    head: null,
    foot: null,
    hand: null,
    weapon: null,
    mount: null
  },
  activeBoosts: {},
  reset() {
    // Reset primary attributes to base values
    this.primary = {
      strength: 5,
      dexterity: 5,
      constitution: 5,
      intelligence: 5,
      charisma: 5,
      wisdom: 5
    };
    
    // Reset secondary attributes
    this.secondary = {
      maxLife: 0,
      life: 0,
      lifeRegen: 0,
      maxMp: 0,
      mp: 0,
      mpRegen: 0,
      maxStamina: 0,
      stamina: 0,
      physicalDamage: 0,
      magicDamage: 0,
      physicalDefense: 0,
      magicDefense: 0,
      speed: 0,
      accuracy: 0
    };
    
    this.secondary.maxLife = this.primary.constitution * 10;
    this.secondary.life = this.secondary.maxLife;
    
    // Use mp/maxMp as secondary properties
    this.secondary.maxMp = this.primary.intelligence * 10;
    this.secondary.mp = this.secondary.maxMp;
    
    this.secondary.mpRegen = Math.floor(this.secondary.maxMp / 10);
    this.potions = 0;
    this.activeBoosts = {};
    
    // Reset status system integration
    this.statusEffects = [];
    this.linkedCharacters = {
      linkedTo: [],
      trappedBy: [],
      mounting: null,
      mountedBy: null
    };
    
    // Unequip all equipment
    for (const slot in this.equipment) {
      this.equipment[slot] = null;
    }
  }
};