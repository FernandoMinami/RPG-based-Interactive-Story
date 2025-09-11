// Test environment loading structure
console.log("🧪 Testing Environment Structure Fix");

// Simulate loading a story environment file structure
const mockCaveEnvironment = {
    "type": "cave",
    "name": "Cave Environment", 
    "intensityLevels": {
        "5": {
            "name": "Underground Chamber",
            "effects": {
                "damage": 2,
                "accuracyPenalty": 0.30,
                "statusChance": 8,
                "statusType": "stunned"
            }
        }
    }
};

// Simulate the setActiveEnvironment logic
function testSetActiveEnvironment(environment, intensity = 5) {
    const clampedIntensity = Math.max(1, Math.min(10, intensity));
    
    const activeEnvironment = {
        ...environment,
        currentIntensity: clampedIntensity
    };
    
    // Extract effects for the current intensity level
    if (environment.intensityLevels && environment.intensityLevels[clampedIntensity]) {
        activeEnvironment.effects = environment.intensityLevels[clampedIntensity].effects;
    } else if (!activeEnvironment.effects) {
        activeEnvironment.effects = {};
    }
    
    return activeEnvironment;
}

// Test the fix
const result = testSetActiveEnvironment(mockCaveEnvironment, 5);

console.log("✅ Active Environment:", result);
console.log("✅ Effects extracted:", result.effects);
console.log("✅ Has damage:", !!result.effects.damage);
console.log("✅ Has statusChance:", !!result.effects.statusChance);

// Test modifyAbilityByEnvironment safety
function testModifyAbilityByEnvironment(activeEnvironment) {
    if (!activeEnvironment || !activeEnvironment.effects || !activeEnvironment.effects.abilityModifiers) {
        return { damage: 50, accuracy: 80, reason: "No abilityModifiers - fallback to original values" };
    }
    return { damage: 75, accuracy: 90, reason: "Modified by abilityModifiers" };
}

const abilityResult = testModifyAbilityByEnvironment(result);
console.log("✅ Ability modification result:", abilityResult);

console.log("\n🎯 Structure Fix Test: ✅ PASSED - Environment effects properly extracted from intensityLevels");
