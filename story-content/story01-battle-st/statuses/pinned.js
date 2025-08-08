// Pinned Status Definition
// Pure data configuration for the trapped system

export default {
    name: 'Pinned',
    statusTag: 'pinned',
    statusDesc: 'Pinned down',
    type: 'debuff',
    turns: 2, // Always 2 turns by default
    durationType: 'turns', // Turn-based duration
    description: 'Held down, movement restricted. Can struggle to break free.',
    
    // Visual/UI properties
    color: '#cc6600',
    icon: '📌',
    
    // Trapped system properties
    isTrapped: true,        // This status traps the character
    usesEnemyStats: false,  // Use status difficulty instead of enemy stats
    canStruggle: true,      // Character can attempt to break free
    struggleDC: 15,         // Difficulty to break free (strength + d20 vs 15)
    
    // Effect configuration for special-effects system
    effects: {
        baseAttributeDebuffs: [
            { attribute: 'dexterity', amount: 2 } // Reduce dexterity by 2
        ],
        secondaryAttributeDebuffs: [
            { attribute: 'speed', amount: 999 } // Set speed to 0 (effectively remove all speed)
        ]
    },
    
    // Balance properties
    stackable: false, // Pinned doesn't stack
    refreshable: true, // New pins refresh duration
    
    // Resistance/immunity tags (optional)
    immuneTypes: ['ghost', 'incorporeal'], // Incorporeal beings can't be pinned
    resistantTypes: ['air'], // Air types are harder to pin
    vulnerableTypes: ['earth'] // Earth types are easier to pin
};