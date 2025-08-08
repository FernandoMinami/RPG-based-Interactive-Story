// Flame Touch Ability
// Example of how to apply burn DoT effects using the new system

export default {
    name: "Flame Touch",
    type: "attack",
    targetType: "enemy", 
    mpCost: 12,
    baseDamage: 10,
    damageType: "fire",
    statusTag: "flame-touch",
    description: "A fiery touch that deals fire damage and ignites the target.",
    
    // Main ability function
    apply(caster, target, addLog = () => {}) {
        // First deal the base fire damage
        const damage = this.calculateDamage(caster, target);
        target.life = Math.max(0, target.life - damage);
        addLog(`${caster.name || 'Attacker'} touches ${target.name || 'target'} with burning flames for ${damage} fire damage!`);
        
        // Then apply burn DoT effect
        this.applyBurnEffect(caster, target, addLog);
        
        return true;
    },
    
    // Calculate fire damage with type effectiveness
    calculateDamage(caster, target) {
        let damage = this.baseDamage;
        
        // Add caster's magic damage
        if (caster.secondary && caster.secondary.magicDamage) {
            damage += Math.floor(caster.secondary.magicDamage * 0.6);
        }
        
        // Apply target's magic defense
        if (target.secondary && target.secondary.magicDefense) {
            damage = Math.max(1, damage - target.secondary.magicDefense);
        }
        
        // Apply type effectiveness (fire vs target type)
        if (target.type) {
            try {
                import('../../../src/types.js').then(({ calculateTypeEffectiveness }) => {
                    const effectiveness = calculateTypeEffectiveness('fire', target.type);
                    damage = Math.round(damage * effectiveness);
                }).catch(() => {
                    // If type system not available, use base damage
                });
            } catch (error) {
                // Fallback to base damage
            }
        }
        
        return damage;
    },
    
    // Apply burn DoT using the simplified system
    applyBurnEffect(caster, target, addLog) {
        // Use the status registry to apply burn
        import('../../../src/status.js').then(({ applyStatusDoT }) => {
            applyStatusDoT(caster, target, 'burn', addLog);
        }).catch(error => {
            console.error('Failed to apply burn effect:', error);
            addLog(`${target.name || 'Target'} resists the flames!`);
        });
    }
}
