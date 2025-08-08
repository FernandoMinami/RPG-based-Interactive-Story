// Stunned Status Definition - UPDATED VERSION 2.0
// Pure data configuration for the buff system

export default {
    name: 'Stunned',
    statusTag: 'stunned',
    statusDesc: 'Stunned',
    type: 'debuff',
    turns: 1, // Default 1 turn
    durationType: 'turns',
    description: 'Unable to act for the specified number of turns.',
    version: '2.0', // Debug identifier
    
    // Visual/UI properties
    color: '#FFD700',
    icon: '😵',
    
    // Stun properties
    preventsAction: true, // This status prevents the character from acting
    
    // Effect configuration for special-effects system
    // Stunned doesn't modify attributes, so we provide empty arrays
    effects: {
        baseAttributeBoosts: [],
        baseAttributeDebuffs: [],
        secondaryAttributeBoosts: [],
        secondaryAttributeDebuffs: [],
        percentageAttributeBoosts: []
    }
}