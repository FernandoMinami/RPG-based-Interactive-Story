// Poisoned status effect
// Character takes damage each turn
export default {
    name: "Poisoned",
    description: "Takes damage each turn",
    
    apply(target) {
        // No immediate effect on application
    },
    
    tick(target, turns, addLog = () => {}) {
        // Deal poison damage each turn
        const damage = Math.max(1, Math.floor(target.maxLife * 0.05)); // 5% of max life
        target.life = Math.max(0, target.life - damage);
        addLog(`${target.name} takes ${damage} poison damage!`);
        return turns - 1;
    },
    
    remove(target) {
        // No effect on removal
    },
    
    summary(target) {
        return "poisoned";
    }
};