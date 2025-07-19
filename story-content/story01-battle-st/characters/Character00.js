// Character base atributes (Player will start with 30 points to distribute among these attributes)
const baseAttributes = {
  strength: 5,
  dexterity: 5,
  constitution: 5,
  charisma: 5,
  wisdom: 5,
  intelligence: 5
};

// Character secondary attributes (These will be calculated based on the base attributes or items equipped)
const baseSecondary = {
  maxLife: 0,
  maxMana: 0,
  manaRegen: 0,
  physicDamage: 0,
  magicDamage: 0,
  physicDefense: 0, // Physical defense stat that will be calculated
  magicDefense: 0, // Magic defense stat that will be calculated
  speed: 0
};

export let player = {
  name: "Character00",
  id: "character00",
  height: 140, // Height in cm (small category: 120-150cm)
  weight: 60, // Weight in kg (used to do calculations like pin or fall damage)
  life: 0,
  mana: 0,
  level: 1,
  attributePoints: 30, // Points to distribute among attributes at level 1
  exp: 0,
  attributes: { ...baseAttributes },
  secondary: { ...baseSecondary },

  // List of ability IDs that this character can use
  abilityIds: [
    "quickAttack",
    "forcePalm",
    "heal",
    "defenseBoost",
    "magicShield",
    "strengthBoost",
    "dexterityBoost",
    "constitutionBoost",
    "charismaBoost",
    "poison",
    "stun"
  ],
  // equipment slots
  equipment: {
    body: null,
    legs: null,
    head: null,
    foot: null,
    hand: null,
    weapon: null
  },
  //checks the buffs
  activeBoosts: {},
  //resets the character
  reset() {
    for (const key in baseAttributes) {
      this.attributes[key] = baseAttributes[key];
    }
    for (const key in baseSecondary) {
      this.secondary[key] = baseSecondary[key];
    }
    this.life = this.maxLife;
    this.mana = this.maxMana;
    this.activeBoosts = {};
    // Unequip all equipment
    for (const slot in this.equipment) {
      this.equipment[slot] = null;
    }
  }
};