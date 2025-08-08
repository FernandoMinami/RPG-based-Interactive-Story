import { applyEffects } from '../../../src/status.js';

export default {
    name: "Weakness Curse",
    type: "debuff",
    range: "target",
    turns: 3,
    mpCost: 8,
    description: "Weakens the target, reducing their strength and constitution.",
    onHit: "Dark energy weakens the enemy!",
    onMiss: "The curse misses its target!",
    statusTag: "weaknessCurse",
    statusDesc: "Weakened",
    durationType: "turns", // Debuff that wears off after turns
    
    // Special effects configuration - demonstrates debuff effects
    effects: {
        baseAttributeDebuffs: [
            { attribute: 'strength', amount: 2 },
            { attribute: 'constitution', amount: 1 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
