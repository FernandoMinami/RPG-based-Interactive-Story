import { applyEffects } from '../../../src/status.js';

export default {
    name: "Power Up",
    type: "buff",
    range: "self",
    turns: 3,
    mpCost: 12,
    description: "Temporarily increases strength by 4 points.",
    onHit: "Strength boosted!",
    onMiss: null,
    statusTag: "strengthBoost",
    statusDesc: "Strength Up",
    
    // Special effects configuration
    effects: {
        baseAttributeBoosts: [
            { attribute: 'strength', amount: 4 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
