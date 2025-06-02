export const POTION_HEAL = 20;

const baseAttributes = {
  strength: 8,
  dexterity: 17,
  constitution: 10,
  charisma: 13,
  wisdom: 10,
  intelligence: 12
};

export const player = {
  maxLife: 0,
  potions: 0,
  attributes: { ...baseAttributes },
  abilities: {
    defense: {
      name: "Defense Curl",
      turns: 5,
      amount: 10
    },
    heal: {
      name: "Quick Heal",
      amount: 20
    },
    strengthBoost: {
      name: "Power Up",
      attribute: "strength",
      amount: 4,
      turns: 3
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
    wisdomBoost: {
      name: "Focus",
      attribute: "wisdom",
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
  activeBoosts: {},
  reset() {
    // Reset attributes to base values
    for (const key in baseAttributes) {
      this.attributes[key] = baseAttributes[key];
    }
    this.maxLife = this.attributes.constitution * 10;
    this.life = this.maxLife;
    this.maxMana = this.attributes.intelligence * 10;
    this.mana = this.maxMana;
    this.potions = 0;
    this.activeBoosts = {};
  }
};