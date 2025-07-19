// Pinned status effect
// Character has reduced speed and accuracy, represents grappling/wrestling
export default {
    name: "Pinned",
    description: "Held down, movement restricted",
    permanent: true, // Lasts until specific conditions are met
    
    apply(target) {
        // Reduce speed and accuracy while pinned
        target.attributes = target.attributes || {};
        target.pinnedOriginalDex = target.attributes.dexterity || 10;
        target.attributes.dexterity = Math.max(1, Math.floor(target.attributes.dexterity * 0.8)); // 20% speed reduction
    },
    
    tick(target, turns) {
        // Pinned status continues indefinitely (permanent)
        return turns;
    },
    
    remove(target, addLog = () => {}) {
        // Restore original speed when unpinned
        if (target.pinnedOriginalDex !== undefined) {
            target.attributes = target.attributes || {};
            target.attributes.dexterity = target.pinnedOriginalDex;
            delete target.pinnedOriginalDex;
        }
        addLog(`${target.name} breaks free from being pinned!`);
    },
    
    summary(target) {
        return "pinned";
    },
    
    // Special properties
    canStruggle: true,
    speedReduction: 0.8,    // 80% speed reduction
    accuracyReduction: 0.3, // 30% accuracy reduction
    
    /**
     * Check if pinned should end when opponent attacks without pin effect
     * @param {Object} ability - The ability being used by the opponent
     * @param {Object} target - The pinned character
     * @param {Function} addLog - Logging function
     * @returns {boolean} - True if pinned should end
     */
    shouldEndFromOpponentAttack(ability, target, addLog = () => {}) {
        // If opponent's attack doesn't have pinned effect, release the pin
        if (!ability.effect || ability.effect.type !== 'pinned') {
            addLog(`${target.name} is released from the pin!`);
            return true;
        }
        return false;
    },
    
    /**
     * Handle when pinned character successfully hits an attack
     * @param {Object} attacker - The pinned character who hit
     * @param {Object} target - The target that was hit
     * @param {Function} addLog - Logging function
     * @param {Function} applyStatus - Function to apply status effects
     * @returns {boolean} - True if pinned should end
     */
    onSuccessfulHit(attacker, target, addLog = () => {}, applyStatus = () => {}) {
        addLog(`${attacker.name} breaks free and stuns ${target.name}!`);
        // Apply stun to the opponent for 1 turn
        applyStatus(target, 'stunned', 1, addLog);
        return true; // Remove pinned status
    },
    
    /**
     * Calculate struggle success based on strength vs strength+weight
     * @param {Object} pinnedChar - The pinned character struggling
     * @param {Object} opponent - The opponent maintaining the pin
     * @param {Function} addLog - Logging function
     * @returns {boolean} - True if struggle succeeds
     */
    calculateStruggleSuccess(pinnedChar, opponent, addLog = () => {}) {
        const pinnedStrength = pinnedChar.attributes?.strength || 10;
        const opponentStrength = opponent.attributes?.strength || 10;
        const opponentWeight = opponent.weight || 65; // Default weight: 65kg
        
        // Opponent's resistance = strength + (weight bonus: 1 point per 20kg)
        const weightBonus = Math.floor(opponentWeight / 20);
        const opponentResistance = opponentStrength + weightBonus;
        
        // Roll for struggle (d20 + strength vs d20 + resistance)
        const pinnedRoll = Math.floor(Math.random() * 20) + 1 + pinnedStrength;
        const opponentRoll = Math.floor(Math.random() * 20) + 1 + opponentResistance;
        
        const success = pinnedRoll > opponentRoll;
        
        if (success) {
            addLog(`${pinnedChar.name} struggles free! (${pinnedRoll} vs ${opponentRoll})`);
        } else {
            addLog(`${pinnedChar.name} fails to break free! (${pinnedRoll} vs ${opponentRoll})`);
        }
        
        return success;
    }
};