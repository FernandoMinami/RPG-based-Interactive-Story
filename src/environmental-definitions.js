/**
 * Unified Environmental System - Data-driven approach for easy customization
 */

/**
 * Environmental definitions - Easy to add new environments here
 */
export const ENVIRONMENTS = {
    volcanic: {
        name: "Volcanic",
        immuneType: "fire",
        effects: {
            damage: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0 },
                    { min: 5, max: 7, value: 5 },
                    { min: 8, max: 10, value: 8 }
                ],
                description: "volcanic heat"
            },
            statusEffect: {
                intensityRanges: [
                    { min: 1, max: 7, chance: 0, type: null },
                    { min: 8, max: 10, chance: 25, type: "burned" }
                ]
            },
            accuracyPenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.2 },
                    { min: 5, max: 7, value: 0.4 },
                    { min: 8, max: 10, value: 0.5 }
                ]
            },
            damagePenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.2 },
                    { min: 5, max: 7, value: 0.4 },
                    { min: 8, max: 10, value: 0.5 }
                ]
            }
        },
        protectionItems: [
            { name: "Heat Resistant Armor", protection: "full" },
            { name: "Fire Protection Potion", protection: "temporary" },
            { name: "Volcanic Cloak", protection: "partial" }
        ]
    },
    
    underwater: {
        name: "Underwater",
        immuneType: "water",
        effects: {
            damage: {
                intensityRanges: [
                    { min: 1, max: 7, value: 0 },
                    { min: 8, max: 10, value: 4 }
                ],
                description: "water pressure"
            },
            breathLoss: {
                turnsBeforeDamage: 6,
                damagePerTurn: 8,
                intensityRanges: [
                    { min: 1, max: 4, active: false },
                    { min: 5, max: 10, active: true }
                ]
            },
            speedPenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.15 },
                    { min: 5, max: 7, value: 0.3 },
                    { min: 8, max: 10, value: 0.5 }
                ]
            },
            accuracyPenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.15 },
                    { min: 5, max: 7, value: 0.3 },
                    { min: 8, max: 10, value: 0.45 }
                ]
            },
            damagePenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.15 },
                    { min: 5, max: 7, value: 0.3 },
                    { min: 8, max: 10, value: 0.45 }
                ]
            }
        },
        protectionItems: [
            { name: "Diving Suit", protection: "full" },
            { name: "Water Breathing Potion", protection: "temporary" },
            { name: "Aquatic Gear", protection: "partial" }
        ]
    },
    
    storm: {
        name: "Storm",
        immuneType: "air",
        effects: {
            damage: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0 },
                    { min: 5, max: 7, value: 3 },
                    { min: 8, max: 10, value: 6 }
                ],
                description: "flying debris"
            },
            lightningStrike: {
                intensityRanges: [
                    { min: 1, max: 4, chance: 0, damage: 0 },
                    { min: 5, max: 7, chance: 8, damage: 8 },
                    { min: 8, max: 10, chance: 15, damage: 12 }
                ]
            },
            statusEffect: {
                intensityRanges: [
                    { min: 1, max: 4, chance: 0, type: null },
                    { min: 5, max: 7, chance: 10, type: "stunned" },
                    { min: 8, max: 10, chance: 20, type: "stunned" }
                ]
            },
            accuracyPenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.1 },
                    { min: 5, max: 7, value: 0.25 },
                    { min: 8, max: 10, value: 0.4 }
                ]
            },
            damagePenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.1 },
                    { min: 5, max: 7, value: 0.2 },
                    { min: 8, max: 10, value: 0.35 }
                ]
            }
        },
        protectionItems: [
            { name: "Storm Cloak", protection: "full" },
            { name: "Lightning Rod", protection: "partial" },
            { name: "Grounding Boots", protection: "partial" }
        ]
    },
    
    cave: {
        name: "Cave",
        immuneType: "earth",
        effects: {
            damage: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0 },
                    { min: 5, max: 7, value: 2 },
                    { min: 8, max: 10, value: 4 }
                ],
                description: "falling rocks"
            },
            tripping: {
                intensityRanges: [
                    { min: 1, max: 4, chance: 0, damage: 0 },
                    { min: 5, max: 7, chance: 6, damage: 3 },
                    { min: 8, max: 10, chance: 12, damage: 6 }
                ]
            },
            statusEffect: {
                intensityRanges: [
                    { min: 1, max: 4, chance: 0, type: null },
                    { min: 5, max: 7, chance: 8, type: "stunned" },
                    { min: 8, max: 10, chance: 15, type: "stunned" }
                ]
            },
            accuracyPenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.15 },
                    { min: 5, max: 7, value: 0.3 },
                    { min: 8, max: 10, value: 0.4 }
                ]
            },
            damagePenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.12 },
                    { min: 5, max: 7, value: 0.25 },
                    { min: 8, max: 10, value: 0.4 }
                ]
            }
        },
        protectionItems: [
            { name: "Spelunker's Helmet", protection: "full" },
            { name: "Torch", protection: "partial" },
            { name: "Climbing Boots", protection: "partial" }
        ]
    }
};

/**
 * Get environmental effect value based on intensity
 * @param {Array} intensityRanges - Array of intensity range objects
 * @param {number} intensity - Current intensity level
 * @returns {*} The effect value for the given intensity
 */
function getIntensityValue(intensityRanges, intensity) {
    for (const range of intensityRanges) {
        if (intensity >= range.min && intensity <= range.max) {
            return range;
        }
    }
    return null;
}
