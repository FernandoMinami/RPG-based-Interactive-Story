// Frostbite DoT Status Definition
// Pure data configuration for the DoT system

export default {
    name: 'Frostbite',
    statusTag: 'frostbite',
    statusDesc: 'Frostbitten',
    type: 'dot',
    damage: 2,
    damageType: 'ice',
    turns: 4,
    durationType: 'turns',
    description: 'Target is suffering from frostbite, taking ice damage and moving slower.',
    
    // Visual/UI properties
    color: '#87CEEB',
    icon: '❄️',
    
    // Balance properties
    stackable: false,
    refreshable: true,
    
    // Resistance/immunity tags
    immuneTypes: ['ice'],
    resistantTypes: ['fire'],
    vulnerableTypes: ['water']
}
