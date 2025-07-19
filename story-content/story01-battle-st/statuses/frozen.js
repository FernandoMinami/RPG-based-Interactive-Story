// Frozen status effect
// Character cannot act and takes minor damage each turn
export default {
    name: "Frozen",
    description: "Frozen solid, unable to act",
    
    apply(target) {
        // No immediate effect on application
    },
    
    tick(target, turns, addLog = () => {}) {
        // Deal minor cold damage each turn
        const damage = Math.max(1, Math.floor(target.maxLife * 0.02)); // 2% of max life
        target.life = Math.max(0, target.life - damage);
        addLog(`${target.name} takes ${damage} cold damage from being frozen!`);
        return turns - 1;
    },
    
    remove(target) {
        // No effect on removal
    },
    
    summary(target) {
        return "frozen";
    },
    
    // Frozen characters cannot act
    preventsAction: true
};