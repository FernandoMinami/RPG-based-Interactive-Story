// Acid Burn DoT Status Definition
// Pure data configuration for the DoT system

export default {
    name: 'Acid Burn',
    statusTag: 'acid',
    statusDesc: 'Melting',
    type: 'dot',
    damage: 4,
    damageType: 'acid',
    turns: 3,
    durationType: 'turns',
    description: 'Target is being dissolved by acid, taking acid damage each turn.',
    
    // Visual/UI properties
    color: '#32CD32',
    icon: '🧪',
    
    // Balance properties
    stackable: false,
    refreshable: true,
    
    // Resistance/immunity tags
    immuneTypes: ['acid', 'slime'],
    resistantTypes: ['metal', 'rock'],
    vulnerableTypes: ['organic', 'flesh']
}
