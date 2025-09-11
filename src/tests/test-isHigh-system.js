// Test file for isHigh modular status system
// Run this to verify the new modular functions work correctly

import { hasIsHighStatus, checkDynamicRangeImmunity, applySwoopDownModifier, calculateFallDamage, handleFallingInteractions } from '../special-effects.js';
import { StatusRegistry, addStatus, initializeCharacter } from '../status.js';

// Test function
export function testIsHighSystem() {
    
    // Create test characters
    const groundCharacter = {
        name: "Ground Fighter",
        life: 100,
        weight: 70,
        statusEffects: []
    };
    
    const flyingCharacter = {
        name: "Flying Archer",
        life: 100,
        weight: 60,
        statusEffects: []
    };
    
    // Initialize characters
    initializeCharacter(groundCharacter);
    initializeCharacter(flyingCharacter);
    
    // Add flying status to one character
    addStatus(flyingCharacter, 'flying', 0, null);
    
   
    const closeAttack = { name: "Punch", range: "close", type: "physical" };
    const rangedAttack = { name: "Arrow", range: "ranged", type: "physical" };

    const swoopResult = applySwoopDownModifier(flyingCharacter, closeAttack, 20);
    const fallResult = calculateFallDamage(flyingCharacter, 15);

    const fallInteraction = handleFallingInteractions(flyingCharacter, 15);
}

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
    window.testIsHighSystem = testIsHighSystem;
}
