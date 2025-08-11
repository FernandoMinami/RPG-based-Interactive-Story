export const POTION_HEAL = 20;

const baseAttributes = {
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
  manaRegen: 0, // Will be calculated based on intelligence
  mpRegen: 0, // Will be calculated based on intelligence
  lifeRegen: 0, // Will be calculated based on constitution
  physicDamage: 0,
  magicDamage: 0,
  physicDefense: 0, // Will be calculated based on constitution
  magicDefense: 0, // Will be calculated based on intelligence
  speed: 0
};

export const player = {
  name: "Template Character",
  id: "character-template",
  race: "human", // Player race (affects story choices)
  type: "neutral", // Combat type (affects damage/resistance)
  maxLife: 0,
  life: 0,
  mp: 0,    // Primary MP property
  maxMp: 0, // Primary max MP property
  mana: 0,  // Keep for compatibility
  maxMana: 0,  // Keep for compatibility
  manaRegen: 0,
  level: 1,
  exp: 0,
  attributePoints: 30,
  potions: 0,
  attributes: { ...baseAttributes },
  secondary: { ...baseSecondary },
  
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
    weapon: null
  },
  activeBoosts: {},
  reset() {
    // Reset attributes to base values
    for (const key in baseAttributes) {
      this.attributes[key] = baseAttributes[key];
    }
    
    // Ensure secondary object exists and is properly initialized
    for (const key in baseSecondary) {
      this.secondary[key] = baseSecondary[key];
    }
    
    this.maxLife = this.attributes.constitution * 10;
    this.life = this.maxLife;
    
    // Use mp/maxMp as primary properties
    this.maxMp = this.attributes.intelligence * 10;
    this.mp = this.maxMp;
    this.maxMana = this.maxMp; // Keep for compatibility
    this.mana = this.mp; // Keep for compatibility
    
    this.manaRegen = Math.floor(this.maxMp / 10);
    this.potions = 0;
    this.activeBoosts = {};
    // Unequip all equipment
    for (const slot in this.equipment) {
      this.equipment[slot] = null;
    }
  }
};