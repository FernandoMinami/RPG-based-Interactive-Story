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
  physicalDamage: 0,
  magicDamage: 0
};

export const player = {
  name: "Character01",
  id: "character01",
  maxLife: 0,
  life: 0,
  mp: 0,
  maxMp: 0,
  manaRegen: 0,
  level: 1,
  exp: 0,
  attributePoints: 30,
  attributes: { ...baseAttributes },
  secondary: { ...baseSecondary },
  abilities: {
    defense: {
      name: "Defense Curl",
      attribute: "defense",
      amount: 10,
      turns: 5,
      mpCost: 10
    },
    dexterityBoost: {
      name: "Agility",
      attribute: "dexterity",
      amount: 4,
      turns: 3
    },
    constitutionBoost: {
      name: "Iron Body",
      attribute: "constitution",
      amount: 4,
      turns: 3
    },
    charismaBoost: {
      name: "Inspire",
      attribute: "charisma",
      amount: 4,
      turns: 3
    },
    intelligenceBoost: {
      name: "Analyze",
      attribute: "intelligence",
      amount: 4,
      turns: 3
    }
  },
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
    this.maxLife = this.attributes.constitution * 10;
    this.life = this.maxLife;
    this.maxMp = this.attributes.intelligence * 5;
    this.mp = this.maxMp;
    this.manaRegen = Math.floor(this.maxMp / 10);
    this.potions = 0;
    this.activeBoosts = {};
    // Unequip all equipment
    for (const slot in this.equipment) {
      this.equipment[slot] = null;
    }
  }
};