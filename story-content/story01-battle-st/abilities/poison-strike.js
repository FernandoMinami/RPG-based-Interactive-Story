// Poison Strike Ability
// Example of how to apply DoT effects using the new system

export default {
    name: "Poison Strike",
    type: "attack",
    targetType: "enemy",
    mpCost: 8,
    baseDamage: 15,
    damageType: "physical",
    statusTag: "poison-strike",
    description: "A poisoned blade that deals damage and applies poison.",
    
    // Main ability function
    apply(caster, target, addLog = () => {}) {
        // First deal the base attack damage
        const damage = this.calculateDamage(caster, target);
        target.life = Math.max(0, target.life - damage);
        addLog(`${caster.name || 'Attacker'} strikes ${target.name || 'target'} with a poisoned blade for ${damage} damage!`);
        
        // Then apply poison DoT effect
        this.applyPoisonEffect(caster, target, addLog);
        
        return true;
    },
    
    // Calculate base attack damage
    calculateDamage(caster, target) {
        let damage = this.baseDamage;
        
        // Add caster's physical damage
        if (caster.secondary && caster.secondary.physicDamage) {
            damage += Math.floor(caster.secondary.physicDamage * 0.5);
        }
        
        // Apply target's defense
        if (target.secondary && target.secondary.physicDefense) {
            damage = Math.max(1, damage - target.secondary.physicDefense);
        }
        
        return damage;
    },
    
    // Apply poison DoT using the simplified system
    applyPoisonEffect(caster, target, addLog) {
        // Use the status registry to apply poison
        import('../../../src/status.js').then(({ applyStatusDoT }) => {
            applyStatusDoT(caster, target, 'poison', addLog);
        }).catch(error => {
            console.error('Failed to apply poison effect:', error);
            addLog(`${target.name || 'Target'} resists the poison!`);
        });
    }
}
