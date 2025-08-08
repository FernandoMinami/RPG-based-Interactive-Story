import { applyEffects } from '../../../src/status.js';

export default {
    name: "Physical Guard",
    type: "buff",
    range: "self",
    turns: 5,
    mpCost: 10,
    description: "Increases physical defense for several turns.",
    onHit: "Physical defense increased!",
    onMiss: "",
    statusTag: "physicalDefenseBoost",
    statusDesc: "Physical Defense Up",
    durationType: "turns",
    
    // Special effects configuration
    effects: {
        secondaryAttributeBoosts: [
            { attribute: 'physicalDefense', amount: 10 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
