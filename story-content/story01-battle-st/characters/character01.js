const baseAttributes = {
  strength: 5,
  dexterity: 5,
  constitution: 5,
  charisma: 5,
  wisdom: 5,
  intelligence: 5
};

const baseSecondary = {
  defence: 0, // Total defence stat (don't change this value)
  natDefense: 0, // initial natural defense
  speed: 0,
  physicDamage: 0,
  magicDamage: 0
};

export const player = {
  name: "Character01",
  id: "character01",
  height: 140, // Height in cm (small category: 120-150cm)
  weight: 60, // Weight in kg (used to do calculations like pin or fall damage)
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
  attributes: { ...baseAttributes },
  secondary: { ...baseSecondary },
  height: 175, // Height in cm (medium category: 150-190cm)
  weight: 70, // Weight in kg

  // List of ability IDs that this character can use
  abilityIds: [
    "quickAttack",
    "powerSurge",
    "finishingBlow",
    "flameBurst",
    "frostSpike",
    "defenseBoost",
    "dexterityBoost",
    "constitutionBoost",
    "charismaBoost",
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