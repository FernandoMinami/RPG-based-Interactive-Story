import { applyEffects } from '../../../src/status.js';

export default {
    name: "Focus Attack",
    type: "buff",
    range: "self",
    turns: 2,
    mpCost: 18,
    description: "Increases focus and precision, boosting dexterity by 5 and strength by 3 for 2 turns.",
    onHit: "Focus sharpened! Ready to strike with precision!",
    onMiss: "",
    statusTag: "focusAttack",
    statusDesc: "Focused",
    
    // Special effects configuration - Multiple attribute boosts (your example!)
    effects: {
        baseAttributeBoosts: [
            { attribute: 'dexterity', amount: 5 },
            { attribute: 'strength', amount: 3 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
