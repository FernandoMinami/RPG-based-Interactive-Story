// Burn DoT Status Definition
// Pure data configuration for the DoT system

export default {
    name: 'Burn',
    statusTag: 'burn',
    statusDesc: 'Burning',
    type: 'dot',
    damage: 5,
    damageType: 'fire',
    turns: 3,
    durationType: 'turns',
    description: 'Target is on fire, taking fire damage each turn.',
    
    // Visual/UI properties
    color: '#FF4500',
    icon: '🔥',
    
    // Balance properties
    stackable: false, // Whether multiple instances can stack
    refreshable: true, // Whether applying again refreshes duration
    
    // Resistance/immunity tags (optional)
    immuneTypes: ['fire'], // Fire types are immune to burn
    resistantTypes: ['water'], // Water types take reduced burn damage
    vulnerableTypes: ['earth'] // Earth types take increased burn damage
}
