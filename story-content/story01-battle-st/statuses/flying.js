// Flying status effect
// Character gains speed boost and immunity to close attacks
// Falls when using close attacks or when hit by ranged attacks
export default {
    name: "Flying",
    description: "Soaring high in the sky",
    permanent: true, // Flying lasts until specific conditions are met
    
    apply(target) {
        // Boost speed while flying
        target.attributes = target.attributes || {};
        target.flyingOriginalDex = target.attributes.dexterity || 10;
        target.attributes.dexterity = (target.attributes.dexterity || 10) + 5;
    },
    
    tick(target, turns) {
        // Flying status continues indefinitely (permanent)
        return turns;
    },
    
    remove(target, addLog = () => {}) {
        // Remove speed boost when landing
        target.attributes = target.attributes || {};
        if (target.flyingOriginalDex !== undefined) {
            target.attributes.dexterity = target.flyingOriginalDex;
            delete target.flyingOriginalDex;
        }
        addLog(`${target.name} lands on the ground!`);
    },
    
    summary(target) {
        return "flying";
    },
    
    // Special properties for combat calculations
    immuneToClose: true,
    speedBonus: 5,
    divingAttackMultiplier: 1.6, // Damage multiplier for close attacks while flying
    
    /**
     * Check if flying should end due to using a close attack
     * @param {Object} ability - The ability being used
     * @param {Object} attacker - The flying character using the ability
     * @param {Function} addLog - Logging function
     * @returns {boolean} - True if flying should end
     */
    shouldEndFromCloseAttack(ability, attacker, addLog = () => {}) {
        if (ability.range === 'close' || ability.type === 'physical') {
            addLog(`${attacker.name} descends using ${ability.name}!`);
            return true;
        }
        return false;
    },
    
    /**
     * Check if flying should end due to being hit by ranged attack
     * @param {Object} ability - The ability that hit the flying character
     * @param {Object} target - The flying character that was hit
     * @param {Function} addLog - Logging function
     * @returns {Object} - {shouldEnd: boolean, fallDamage: number}
     */
    shouldEndFromRangedHit(ability, target, addLog = () => {}) {
        if (ability.range === 'ranged' || ability.type === 'magic') {
            const fallDamage = Math.max(5, Math.floor(target.maxLife * 0.08)); // 8% of max life fall damage
            addLog(`${target.name} is struck from the sky and falls!`);
            addLog(`${target.name} takes ${fallDamage} fall damage!`);
            return { shouldEnd: true, fallDamage };
        }
        return { shouldEnd: false, fallDamage: 0 };
    },
    
    /**
     * Apply fall damage when knocked out of the sky
     * @param {Object} target - The character taking fall damage
     * @param {number} damage - Amount of fall damage
     */
    applyFallDamage(target, damage) {
        target.life = Math.max(0, target.life - damage);
    }
};
