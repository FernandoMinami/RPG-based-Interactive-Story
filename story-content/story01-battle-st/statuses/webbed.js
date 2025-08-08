// Webbed status effect
// Character is caught in sticky webs, harder to break free than being frozen
export default {
    name: "Webbed",
    description: "Caught in sticky webs, movement restricted",
    permanent: false,
    
    // Trapped system properties
    isTrapped: true,        // This status traps the character
    usesEnemyStats: false,  // Does not use enemy strength/weight
    canStruggle: true,      // Character can attempt to break free
    breakFree: 18,          // DC 18 to break free (harder than frozen)
    
    apply(target) {
        // Webbed characters have reduced movement
        target.attributes = target.attributes || {};
        target.webbedOriginalDex = target.attributes.dexterity || 10;
        target.attributes.dexterity = Math.max(1, Math.floor(target.attributes.dexterity * 0.3)); // 70% speed reduction
        
        // Set trapped flag
        target.isTrapped = true;
    },
    
    tick(target, turns) {
        // Webs naturally weaken over time
        if (turns <= 1) {
            return 0; // Status ends
        }
        return turns - 1;
    },
    
    remove(target, addLog = () => {}) {
        // Restore original dexterity when freed
        if (target.webbedOriginalDex !== undefined) {
            target.attributes = target.attributes || {};
            target.attributes.dexterity = target.webbedOriginalDex;
            delete target.webbedOriginalDex;
        }
        
        // Remove trapped flag
        target.isTrapped = false;
        
        addLog(`${target.name} breaks free from the webs!`);
    },
    
    summary(target) {
        return "webbed";
    },
    
    // Special properties
    speedReduction: 0.7,    // 70% speed reduction
    accuracyReduction: 0.4, // 40% accuracy reduction
    
    /**
     * Custom struggle message for thematic consistency
     */
    struggleMessage: "struggles against the sticky webs"
};
