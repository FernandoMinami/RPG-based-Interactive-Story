// Burned status effect
// Character takes fire damage each turn
export default {
    name: "Burned",
    description: "On fire, taking damage each turn",
    
    apply(target) {
        // No immediate effect on application
    },
    
    tick(target, turns, addLog = () => {}) {
        // Deal fire damage each turn
        const damage = Math.max(1, Math.floor(target.maxLife * 0.08)); // 8% of max life
        target.life = Math.max(0, target.life - damage);
        addLog(`${target.name} takes ${damage} fire damage from being burned!`);
        return turns - 1;
    },
    
    remove(target) {
        // No effect on removal
    },
    
    summary(target) {
        return "burned";
    }
};