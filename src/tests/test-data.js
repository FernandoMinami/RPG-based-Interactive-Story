/**
 * Test Data for Battle System Tests
 */

// Updated Mock Player Character - Updated for new character structure
export const testPlayer = {
    id: "test-player",
    name: "Test Hero",
    level: 5,
    attributePoints: 30,
    exp: 0,
    imagePath: "../story-content/story01-battle-st/img/players/character00.jpg",

    // Primary attributes
    primary: {
        strength: 15,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 8,
        charisma: 11
    },

    // Secondary attributes
    secondary: {
        maxLife: 100,
        life: 100,
        lifeRegen: 5,
        maxMp: 50,
        mp: 50,
        mpRegen: 5,
        maxStamina: 120,
        stamina: 120,
        physicalDamage: 0,
        magicDamage: 0,
        physicalDefense: 8,
        magicDefense: 6,
        speed: 25,
        accuracy: 0
    },

    // Misc attributes
    misc: {
        availableRaces: [],
        races: ["human"],
        elementalAlignments: ["neutral"],
        weight: 70,
        height: 175,
        professions: ["warrior", "mage"]
    },

    // Equipment slots
    equipment: {
        body: null,
        legs: null,
        head: null,
        foot: null,
        hand: null,
        weapon: null,
        mount: null
    },

    // Status system integration
    statusEffects: [],

    // Character linking system
    linkedCharacters: {
        linkedTo: [],
        trappedBy: [],
        mounting: null,
        mountedBy: null
    },

    // Abilities and quests
    abilityIds: ["test-attack", "test-fireball", "test-heal"],
    activeQuests: [],
    completedQuests: []
};

// Updated Mock Enemy Character - Updated for new character structure
export const testEnemy = {
    id: "test-enemy",
    name: "Test Goblin",
    level: 3,
    exp: 300,
    imagePath: "../story-content/story01-battle-st/img/enemies/goblin.jpg",

    // Primary attributes
    primary: {
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 6,
        wisdom: 8,
        charisma: 4
    },

    // Secondary attributes
    secondary: {
        maxLife: 60,
        life: 60,
        lifeRegen: 2,
        maxMp: 20,
        mp: 20,
        mpRegen: 1,
        maxStamina: 80,
        stamina: 80,
        physicalDamage: 0,
        magicDamage: 0,
        physicalDefense: 5,
        magicDefense: 3,
        speed: 30,
        accuracy: 0
    },

    // Misc attributes
    misc: {
        availableRaces: [],
        races: ["goblin"],
        elementalAlignments: ["earth"], // Changed from fire to earth for proper testing
        weight: 40,
        height: 120,
        professions: ["warrior"]
    },

    // Equipment slots
    equipment: {
        body: null,
        legs: null,
        head: null,
        foot: null,
        hand: null,
        weapon: null,
        mount: null
    },

    // Status system integration
    statusEffects: [],

    // Character linking system
    linkedCharacters: {
        linkedTo: [],
        trappedBy: [],
        mounting: null,
        mountedBy: null
    },

    // Enemy-specific properties
    drops: [
        { item: "potion", chance: 0.5 },
        { item: "mp-potion", chance: 0.1 }
    ],
    loot: [
        { item: "smallBone", chance: 0.7 },
        { item: "sharpClaw", chance: 0.1 }
    ],
    abilityIds: [
        { id: "test-attack", rate: "preferred" },
        { id: "test-rock-throw", rate: "frequent" }
    ]
};

// Mock Water Enemy (for type effectiveness tests) - Updated for new character structure
export const testWaterEnemy = {
    id: "test-water-enemy",
    name: "Test Water Elemental",
    level: 4,
    exp: 400,
    imagePath: "../story-content/story01-battle-st/img/enemies/water_elemental.jpg",

    // Primary attributes
    primary: {
        strength: 12,
        dexterity: 14,
        constitution: 16,
        intelligence: 13,
        wisdom: 15,
        charisma: 8
    },

    // Secondary attributes
    secondary: {
        maxLife: 80,
        life: 80,
        lifeRegen: 3,
        maxMp: 40,
        mp: 40,
        mpRegen: 2,
        maxStamina: 100,
        stamina: 100,
        physicalDamage: 0,
        magicDamage: 0,
        physicalDefense: 6,
        magicDefense: 8,
        speed: 20,
        accuracy: 0
    },

    // Misc attributes
    misc: {
        availableRaces: [],
        races: ["elemental"],
        elementalAlignments: ["water"],
        weight: 60,
        height: 180,
        professions: ["elemental"]
    },

    // Equipment slots
    equipment: {
        body: null,
        legs: null,
        head: null,
        foot: null,
        hand: null,
        weapon: null,
        mount: null
    },

    // Status system integration
    statusEffects: [],

    // Character linking system
    linkedCharacters: {
        linkedTo: [],
        trappedBy: [],
        mounting: null,
        mountedBy: null
    },

    // Abilities
    abilityIds: ["test-attack", "test-water-blast"]
};

// Mock Fire Enemy (for type effectiveness tests) - Updated for new character structure
export const testFireEnemy = {
    id: "test-fire-enemy",
    name: "Test Fire Elemental",
    level: 4,
    exp: 400,
    imagePath: "../story-content/story01-battle-st/img/enemies/fire_elemental.jpg",

    // Primary attributes
    primary: {
        strength: 14,
        dexterity: 12,
        constitution: 15,
        intelligence: 16,
        wisdom: 10,
        charisma: 8
    },

    // Secondary attributes
    secondary: {
        maxLife: 85,
        life: 85,
        lifeRegen: 4,
        maxMp: 45,
        mp: 45,
        mpRegen: 3,
        maxStamina: 110,
        stamina: 110,
        physicalDamage: 0,
        magicDamage: 0,
        physicalDefense: 5,
        magicDefense: 9,
        speed: 25,
        accuracy: 0
    },

    // Misc attributes
    misc: {
        availableRaces: [],
        races: ["elemental"],
        elementalAlignments: ["fire"],
        weight: 55,
        height: 175,
        professions: ["elemental"]
    },

    // Equipment slots
    equipment: {
        body: null,
        legs: null,
        head: null,
        foot: null,
        hand: null,
        weapon: null,
        mount: null
    },

    // Status system integration
    statusEffects: [],

    // Character linking system
    linkedCharacters: {
        linkedTo: [],
        trappedBy: [],
        mounting: null,
        mountedBy: null
    },

    // Abilities
    abilityIds: ["test-attack", "test-fireball"]
};

// Mock Abilities
export const testAbilities = {
    "test-attack": {
        id: "test-attack",
        name: "Basic Attack",
        type: "physical",
        elementalType: "physical",
        minDamage: 12,
        maxDamage: 18,
        damage: 15,
        accuracy: 90,
        mpCost: 0,
        cooldown: 0,
        usesWeight: true,
        description: "A basic physical attack"
    },
    "test-fireball": {
        id: "test-fireball",
        name: "Fireball",
        type: "magic",
        elementalType: "fire",
        minDamage: 20,
        maxDamage: 30,
        damage: 25,
        accuracy: 85,
        mpCost: 10,
        cooldown: 2,
        description: "A fiery magical attack"
    },
    "test-heal": {
        id: "test-heal",
        name: "Heal",
        type: "magic",
        elementalType: "light",
        healing: 20,
        accuracy: 100,
        mpCost: 8,
        cooldown: 3,
        description: "Restores health"
    },
    "test-rock-throw": {
        id: "test-rock-throw",
        name: "Rock Throw",
        type: "physical",
        elementalType: "earth",
        minDamage: 15,
        maxDamage: 21,
        damage: 18,
        accuracy: 80,
        mpCost: 5,
        cooldown: 1,
        description: "Throws a rock"
    },
    "test-water-blast": {
        id: "test-water-blast",
        name: "Water Blast",
        type: "magic",
        elementalType: "water",
        minDamage: 18,
        maxDamage: 26,
        damage: 22,
        accuracy: 85,
        mpCost: 8,
        cooldown: 1,
        description: "A pressurized water attack"
    }
};

// Mock Type Effectiveness Data (updated to match actual game type system)
export const testTypeData = {
    "fire": {
        id: "fire",
        name: "Fire",
        combatProperties: {
            weaknesses: ["water", "ice"], // Fire is weak to water and ice
            resistances: ["fire", "earth"], // Fire resists fire and earth
            immunities: []
        }
    },
    "water": {
        id: "water", 
        name: "Water",
        combatProperties: {
            weaknesses: ["earth", "lightning"], // Water is weak to earth and lightning
            resistances: ["water", "fire"], // Water resists water and fire
            immunities: []
        }
    },
    "earth": {
        id: "earth",
        name: "Earth", 
        combatProperties: {
            weaknesses: ["water"], // Earth is weak to water (according to water.json bonusDamageTypes)
            resistances: ["earth", "physical"], // Earth resists earth and physical
            immunities: []
        }
    },
    "air": {
        id: "air",
        name: "Air",
        combatProperties: {
            weaknesses: [], // Air has no specific weaknesses in the files
            resistances: ["air"], // Air resists air
            immunities: []
        }
    },
    "physical": {
        id: "physical",
        name: "Physical",
        combatProperties: {
            weaknesses: [],
            resistances: [],
            immunities: []
        }
    }
};

// Environmental Test Data
export const testEnvironments = {
    volcanic: { type: "volcanic", intensity: 6 },
    underwater: { type: "underwater", intensity: 4 },
    storm: { type: "storm", intensity: 8 },
    cave: { type: "cave", intensity: 5 },
    neutral: { type: "neutral", intensity: 1 }
};

// Helper function to create a deep copy of test characters
export function createTestCharacter(template) {
    return JSON.parse(JSON.stringify(template));
}
