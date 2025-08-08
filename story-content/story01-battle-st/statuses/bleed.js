// Bleed DoT Status Definition
// Pure data configuration for the DoT system

export default {
    name: 'Bleed',
    statusTag: 'bleed',
    statusDesc: 'Bleeding',
    type: 'dot',
    damage: 2,
    damageType: 'physical',
    turns: 5,
    durationType: 'turns',
    description: 'Target is bleeding, taking physical damage each turn.',
    
    // Visual/UI properties
    color: '#8B0000',
    icon: '🩸',
    
    // Balance properties
    stackable: true, // Bleed can stack (multiple wounds)
    refreshable: false, // New bleeds don't refresh old ones
    maxStacks: 3, // Maximum number of bleed stacks
    
    // Resistance/immunity tags (optional)
    immuneTypes: ['undead', 'construct'], // Undead/constructs don't bleed
    resistantTypes: ['ice'], // Ice types bleed slower
    vulnerableTypes: [] // No specific vulnerabilities
}
