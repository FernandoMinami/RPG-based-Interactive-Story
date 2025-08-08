import { applyEffects } from '../../../src/status.js';

export default {
    name: "Iron Body",
    type: "buff",
    range: "self",
    turns: 3,
    mpCost: 12,
    description: "Temporarily increases constitution by 4 points and maximum life by 15 points.",
    onHit: "Constitution boosted!",
    onMiss: "",
    statusTag: "constitutionBoost",
    statusDesc: "Constitution Up",
    durationType: "turns", // "turns" (default), "permanent", or "conditional"
    
    // Special effects configuration - demonstrates multiple effect types
    effects: {
        baseAttributeBoosts: [
            { attribute: 'constitution', amount: 4 }
        ],
        secondaryAttributeBoosts: [
            { attribute: 'maxLife', amount: 15 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
