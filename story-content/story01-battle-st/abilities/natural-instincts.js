export default {
    id: "naturalInstincts",
    name: "Natural Instincts",
    type: "special",
    range: "self",
    
    // Passive ability that provides bonuses to survival and awareness
    attribute: "wisdom",
    amount: 2,
    turns: 0, // Permanent during battle
    
    mpCost: 0, // Free ability
    
    effect: {
        type: "enhanced_senses",
        target: "self",
        chance: 1.0,
        turns: 0, // Permanent during battle
        permanent: true
    },
    
    // Special mechanics for beast instincts
    critChance: 0.15, // +15% critical hit chance when this buff is active
    accuracy: 110, // Slight accuracy bonus representing keen senses
    
    description: "Your primal instincts heighten your senses and awareness, improving your wisdom and giving you better chances to detect threats and opportunities.",
    
    // This is a passive ability that activates automatically for beasts
    passive: true
};
