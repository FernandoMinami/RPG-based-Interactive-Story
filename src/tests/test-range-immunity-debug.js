// Test Range Immunity Debug
import { hasIsHighStatus, checkDynamicRangeImmunity } from '../special-effects.js';

console.log("🔧 DEBUG: Range Immunity Test");

// Create test characters
const flyingCharacter = {
    name: "Character00",
    statusEffects: [
        { statusId: "flying" }
    ]
};

const groundEnemy = {
    name: "Enemy01",
    statusEffects: []
};

// Create test abilities
const stompAttack = {
    name: "Stomp",
    range: "close",
    type: "physical"
};

const rangedAttack = { name: "Arrow", range: "ranged", type: "physical" };

console.log("=== Testing hasIsHighStatus ===");
console.log(`Flying character has isHigh status: ${hasIsHighStatus(flyingCharacter)}`);
console.log(`Ground enemy has isHigh status: ${hasIsHighStatus(groundEnemy)}`);

console.log("=== Testing checkDynamicRangeImmunity ===");
console.log(`Ground enemy stomps flying character: ${checkDynamicRangeImmunity(flyingCharacter, stompAttack, groundEnemy)} (should be TRUE)`);
console.log(`Flying character stomps ground enemy: ${checkDynamicRangeImmunity(groundEnemy, stompAttack, flyingCharacter)} (should be FALSE)`);

// Test edge cases
console.log("=== Edge Cases ===");
console.log(`Ground enemy shoots flying character: ${checkDynamicRangeImmunity(flyingCharacter, rangedAttack, groundEnemy)} (should be FALSE)`);

// Debug the internal logic
console.log("=== Internal Debug ===");
function debugHasIsHighStatus(character) {
    if (!character.statusEffects || !Array.isArray(character.statusEffects)) {
        console.log(`No status effects or not array for ${character.name}`);
        return false;
    }
    
    console.log(`${character.name} statusEffects:`, character.statusEffects);
    
    for (const statusEffect of character.statusEffects) {
        console.log(`Checking status effect:`, statusEffect);
        const statusDef = window.StatusRegistry[statusEffect.statusId];
        console.log(`Status definition:`, statusDef);
        if (statusDef && statusDef.isHigh === true) {
            console.log(`Found isHigh status: ${statusEffect.statusId}`);
            return true;
        }
    }
    
    console.log(`No isHigh status found for ${character.name}`);
    return false;
}

console.log("Flying character deep debug:");
debugHasIsHighStatus(flyingCharacter);
