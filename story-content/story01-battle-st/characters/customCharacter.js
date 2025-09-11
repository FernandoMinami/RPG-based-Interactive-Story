// Primary attributes for the character that will affect the secondary attributes
const primaryAttributes = {
  strength: 5,
  dexterity: 5,
  constitution: 5,
  intelligence: 5,
  charisma: 5,
  wisdom: 5
};

// Character secondary attributes (These will be calculated based on the primary attributes or items equipped)
const secondaryAttributes = {
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
  physicalDefense: 0, // Physical defense stat that will be calculated
  magicDefense: 0, // Magic defense stat that will be calculated
  speed: 0,
  accuracy: 0
};

const miscAttributes = {
  availableRaces: [], // This character can only choose these races
  races: ["human"], // Player races (can have multiple) (affects story choices)
  elementalAlignments: [], // elemental alignments (can have multiple)
  weight: 200, // Weight in kg
  height: 250, // Height in cm
  professions: ["mage", "warrior"] // Example professions
};

const bodyParts = [
  { slot: "body", item: null },
  { slot: "legs", item: null },
  { slot: "head", item: null },
  { slot: "foot", item: null },     // For boots/shoes  
  { slot: "feet", item: null },     // Alternative for foot items
  { slot: "hand", item: null },     // First hand slot
  { slot: "hand", item: null },     // Second hand slot for dual-wielding
  { slot: "weapon", item: null },   // Primary weapon slot
  { slot: "weapon", item: null },   // Secondary weapon slot
  { slot: "cloak", item: null },    // For cloaks and outer garments
  { slot: "accessory", item: null },// For accessories and misc items
  { slot: "mount", item: null }
];

export let player = {
  name: "customCharacter",
  id: "customCharacter",
  imagePath: "../story-content/story01-battle-st/img/players/character00.jpg", // Optional: path to character image

  level: 1,
  attributePoints: 30, // Points to distribute among attributes at level 1
  exp: 0,

  // List of ability IDs that this character can use
  abilityIds: [
  ],


  primary: { ...primaryAttributes },
  secondary: { ...secondaryAttributes },
  misc: { ...miscAttributes },
  basePrimary: { ...primaryAttributes }, // Store base primary stats for equipment calculations
  equipment: [...bodyParts], //equipment slots based on body parts

  // Status system integration
  statusEffects: [], // UI compatibility for status display     use this to track the activeBoosts as well

  // Character linking system for mounts, trapping, etc.
  linkedCharacters: {
    linkedTo: [],      // General character links
    trappedBy: [],     // Characters trapping this one
    mounting: null,    // Character this one is mounting
    mountedBy: null    // Character mounting this one
  },

  // Quest tracking
  activeQuests: [], // Currently active quests
  completedQuests: [], // Completed quests

  
  //resets the character
  reset() {
    // Reset to base primary attributes
    this.primary = {
      strength: 5,
      dexterity: 5,
      constitution: 5,
      intelligence: 5,
      charisma: 5,
      wisdom: 5
    };
    
    // Store base primary for equipment calculations
    this.basePrimary = { ...this.primary };
    
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
    
    this.secondary.life = this.secondary.maxLife;
    this.secondary.mp = this.secondary.maxMp;
    this.activeBoosts = {};

    // Reset status system integration
    this.statusEffects = [];
    this.linkedCharacters = {
      linkedTo: [],
      trappedBy: [],
      mounting: null,
      mountedBy: null
    };

    // Reset quest tracking
    this.activeQuests = [];
    this.completedQuests = [];
    this.professions = [];
    // Unequip all equipment
    this.equipment.forEach(slot => {
      slot.item = null;
    });
  }
};