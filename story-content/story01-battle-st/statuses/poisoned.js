// Poison DoT Status Definition
// Pure data configuration for the DoT system

export default {
    name: 'Poison',
    statusTag: 'poison',
    statusDesc: 'Poisoned',
    type: 'dot',
    damage: 3,
    damageType: 'poison',
    turns: 3,
    durationType: 'turns',
    description: 'Target is poisoned, taking poison damage each turn.',
    
    // Visual/UI properties
    color: '#9932CC',
    icon: '☠️',
    
    // Balance properties
    stackable: false,
    refreshable: true,
    
    // Resistance/immunity tags (optional)
    immuneTypes: ['poison'], // Poison types are immune to poison
    resistantTypes: [], 
    vulnerableTypes: ['earth'] // Earth types are more susceptible to poison
}
