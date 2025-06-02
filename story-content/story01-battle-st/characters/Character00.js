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
  physicalDamage: 0,
  magicDamage: 0,
  physicalDefense: 0, // Physical defense stat that will be calculated
  magicDefense: 0, // Magic defense stat that will be calculated
  speed: 0
};

export let player = {
  name: "Character00",
  id: "character00",
  life: 0,
  mana: 0,
  level: 1,
  attributePoints: 30, // Points to distribute among attributes at level 1
  exp: 0,
  attributes: { ...baseAttributes },
  secondary: { ...baseSecondary },

  // abilities of the character
  /**
   * Abilities of the character can be of type "attack", "heal", or "buff".
   * Each ability has a name, type, minDamage, maxDamage, accuracy, mpCost,
   * description, onHit message, onMiss message, and optional effects.
   * The buff abilities will modify the character's attributes for a certain number of turns.
   */
  abilities: {
    quickAttack: {
      name: "Quick Attack",
      type: "physical", // Changed to physical for clarity
      minDamage: 80,
      maxDamage: 80,
      accuracy: 95,
      mpCost: 0,
      description: "Character00 uses a fast strike to hit the enemy.",
      onHit: "Character00's quick attack hits the enemy!",
      onMiss: "Character00's quick attack misses!"
    },
    test: {
      name: "test",
      type: "physical",
      minDamage: 80,
      maxDamage: 80,
      accuracy: 95,
      mpCost: 0,
      description: "Character00 uses a fast strike to hit the enemy.",
      onHit: "Character00's quick attack hits the enemy!",
      onMiss: "Character00's quick attack misses!"
    },
    teste2: {
      name: "teste2",
      type: "attack",
      minDamage: 80,
      maxDamage: 80,
      accuracy: 95,
      mpCost: 0,
      description: "Character00 uses a fast strike to hit the enemy.",
      onHit: "Character00's quick attack hits the enemy!",
      onMiss: "Character00's quick attack misses!"
    },
    asdawdasdafa: {
      name: "asdawdasdafa",
      type: "attack",
      minDamage: 80,
      maxDamage: 80,
      accuracy: 95,
      mpCost: 0,
      description: "Character00 uses a fast strike to hit the enemy.",
      onHit: "Character00's quick attack hits the enemy!",
      onMiss: "Character00's quick attack misses!"
    },
    forcePalm: {
      name: "Force Palm",
      type: "attack",
      minDamage: 10,
      maxDamage: 18,
      accuracy: 90,
      mpCost: 8,
      effect: { type: "stun", chance: 0.3, turns: 1 }
    },
    heal: {
      name: "Quick Heal",
      type: "heal",
      amount: 20,
      mpCost: 8
    },
    defense: {
      name: "Defense Curl",
      type: "buff",
      attribute: "defense",
      amount: 10,
      turns: 5,
      mpCost: 10
    },
    strengthBoost: {
      name: "Power Up",
      type: "buff",
      attribute: "strength",
      amount: 4,
      turns: 3,
      mpCost: 12
    },
    dexterityBoost: {
      name: "Agility",
      type: "buff",
      attribute: "dexterity",
      amount: 4,
      turns: 3,
      mpCost: 12
    },
    constitutionBoost: {
      name: "Iron Body",
      type: "buff",
      attribute: "constitution",
      amount: 4,
      turns: 3,
      mpCost: 12
    },
    charismaBoost: {
      name: "Inspire",
      type: "buff",
      attribute: "charisma",
      amount: 4,
      turns: 3,
      mpCost: 12
    }
  },
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