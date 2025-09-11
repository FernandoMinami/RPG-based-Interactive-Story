// Quick test to verify the modular isHigh system fixes

console.log("Testing isHigh system fixes...");

// Test 1: Check if function exists
if (typeof window.handleModularBattleInteractions !== 'undefined') {
    console.log("✅ handleModularBattleInteractions function exists");
} else {
    console.log("❌ handleModularBattleInteractions function missing");
}

// Test 2: Check StatusRegistry for isHigh statuses  
if (typeof window.StatusRegistry !== 'undefined') {
    console.log("✅ StatusRegistry exists");
    
    // Check for isHigh statuses
    const statusesWithIsHigh = Object.keys(window.StatusRegistry).filter(statusId => {
        const status = window.StatusRegistry[statusId];
        return status && status.isHigh === true;
    });
    
    console.log(`Found ${statusesWithIsHigh.length} statuses with isHigh property:`, statusesWithIsHigh);
} else {
    console.log("❌ StatusRegistry missing");
}

// Test 3: Simulate flying attack scenario
console.log("=== Flying Attack Test ===");

// Create test characters
const flyingChar = {
    name: "Flying Character",
    statusEffects: [{ statusId: "flying" }]
};

const groundChar = {
    name: "Ground Character", 
    statusEffects: []
};

// Create test ability
const closeAttack = {
    name: "Stomp",
    range: "close",
    type: "physical"
};

console.log("Flying character:", flyingChar.name);
console.log("Ground character:", groundChar.name);
console.log("Close attack:", closeAttack.name);

// Instructions
console.log("Instructions: Run this in browser console after loading the game to test isHigh mechanics");






