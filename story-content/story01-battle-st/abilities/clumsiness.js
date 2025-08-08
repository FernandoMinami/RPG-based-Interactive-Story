import { applyEffects } from '../../../src/status.js';

export default {
    name: "Clumsiness",
    type: "debuff", 
    range: "target",
    turns: 4,
    mpCost: 6,
    description: "Makes the target clumsy, reducing their dexterity significantly.",
    onHit: "The target becomes unsteady and clumsy!",
    onMiss: "The clumsiness spell fails!",
    statusTag: "clumsiness",
    statusDesc: "Clumsy",
    durationType: "turns",
    
    // Special effects configuration
    effects: {
        baseAttributeDebuffs: [
            { attribute: 'dexterity', amount: 3 }
        ]
    },
    
    // Simple apply function - all logic handled by src/status.js
    apply(caster, target, addLog = () => {}) {
        return applyEffects(caster, target, this, addLog);
    }
};
