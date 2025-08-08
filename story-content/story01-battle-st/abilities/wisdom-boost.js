import { applyEffects } from '../../../src/status.js';

export default {
    name: "Focus",
    type: "buff",
    range: "self",
    turns: 3,
    mpCost: 8,
    description: "Increases wisdom by 4 for 3 turns.",
    onHit: "Wisdom boosted!",
    onMiss: "",
    statusTag: "wisdomBoost",
    statusDesc: "Wisdom Up",
    durationType: "turns",
    
    // Special effects configuration
    effects: {
        baseAttributeBoosts: [
            { attribute: 'wisdom', amount: 4 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
