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