// Frozen status effect
// Character cannot act and takes minor damage each turn
export default {
    name: "Frozen",
    description: "Frozen solid, unable to act",
    
    // Trapped system properties
    isTrapped: true,        // This status traps the character
    usesEnemyStats: false,  // Does not use enemy strength/weight
    canStruggle: true,      // Character can attempt to break free
    breakFree: 15,          // DC 15 to break free (strength + d20 vs 15)
    
    apply(target) {
        // Set trapped flag
        target.isTrapped = true;
        
        // Store original dexterity if needed
        target.attributes = target.attributes || {};
        target.frozenOriginalDex = target.attributes.dexterity || 10;
        target.attributes.dexterity = Math.max(1, Math.floor(target.attributes.dexterity * 0.1)); // Severe movement penalty
    },
    
    tick(target, turns, addLog = () => {}) {
        // Deal minor cold damage each turn
        const damage = Math.max(1, Math.floor(target.maxLife * 0.02)); // 2% of max life
        target.life = Math.max(0, target.life - damage);
        addLog(`${target.name} takes ${damage} cold damage from being frozen!`);
        return turns - 1;
    },
    
    remove(target, addLog = () => {}) {
        // Restore original dexterity when thawed
        if (target.frozenOriginalDex !== undefined) {
            target.attributes = target.attributes || {};
            target.attributes.dexterity = target.frozenOriginalDex;
            delete target.frozenOriginalDex;
        }
        
        // Remove trapped flag
        target.isTrapped = false;
        
        addLog(`${target.name} breaks free from the ice!`);
    },
    
    summary(target) {
        return "frozen";
    },
    
    // Frozen characters cannot act normally
    preventsAction: true,
    
    /**
     * Custom struggle message for thematic consistency
     */
    struggleMessage: "attempts to break free from the ice"
};