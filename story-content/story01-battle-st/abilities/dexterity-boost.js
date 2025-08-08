import { applyEffects } from '../../../src/status.js';

export default {
    name: "Agility",
    type: "buff",
    range: "self",
    turns: 3,
    mpCost: 12,
    description: "Temporarily increases dexterity by 4 points.",
    onHit: "Agility boosted!",
    onMiss: "",
    statusTag: "dexterityBoost",
    statusDesc: "Agility Up",
    
    // Special effects configuration
    effects: {
        baseAttributeBoosts: [
            { attribute: 'dexterity', amount: 4 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
