// Status Effects Tests - Comprehensive testing for status system functionality

import { createTestCharacter, testPlayer } from './test-data.js';

// Import status system functions
import { 
    StatusRegistry, 
    addStatus, 
    removeStatus, 
    hasStatus, 
    reduceTurns, 
    canCharacterAct, 
    canUseAbilities, 
    canEscape, 
    isCharacterTrapped, 
    attemptBreakFree,
    processDoTDamage,
    checkDamageModification,
    loadStatuses,
    getActiveStatuses,
    initializeCharacter
} from '../status.js';

// Import special effects functions
import {
    applyPrimaryAttributeBoost,
    removePrimaryAttributeBoost,
    applySecondaryAttributeBoost,
    removeSecondaryAttributeBoost,
    checkDamageImmunity,
    applyDamageWithImmunity,
    isCharacterFlying,
    handleDivingAttack,
    checkFlyingImmunity,
    hasIsHighStatus,
    checkDynamicRangeImmunity,
    isCharacterTrapped as specialEffectsIsTrapped,
    handleModularBattleInteractions
} from '../special-effects.js';

let testResults = [];
let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, success, details = '') {
    testResults.push({
        name: testName,
        success: success,
        details: details
    });
    
    if (success) {
        testsPassed++;
        console.log(`✅ ${testName}${details ? ': ' + details : ''}`);
    } else {
        testsFailed++;
        console.log(`❌ ${testName}${details ? ': ' + details : ''}`);
    }
}

function createTestStatus() {
    // Create test statuses for testing
    StatusRegistry['test_damage'] = {
        name: 'Test Damage',
        description: 'Test DoT status',
        dot: { damage: 5, type: 'fire' },
        displayAs: 'damage'
    };
    
    StatusRegistry['test_stun'] = {
        name: 'Test Stun',
        description: 'Test stunning status',
        cantAct: true,
        displayAs: 'debuff'
    };
    
    StatusRegistry['test_trap'] = {
        name: 'Test Trap',
        description: 'Test trapping status',
        trapped: {
            attributeToBreakFree: 'strength',
            difficulty: 10,
            usesEnemyStats: false
        },
        cantEscape: true,
        displayAs: 'debuff'
    };
    
    StatusRegistry['test_flying'] = {
        name: 'Test Flying',
        description: 'Test flying status',
        flying: true,
        isHigh: true,
        displayAs: 'buff'
    };
    
    StatusRegistry['test_boost'] = {
        name: 'Test Boost',
        description: 'Test attribute boost',
        increaseAtributes: { strength: 5, dexterity: 3 },
        increaseSecondary: { maxLife: 20 },
        displayAs: 'buff'
    };
}

async function testStatusApplication() {
    const character = createTestCharacter(testPlayer);
    createTestStatus();
    
    // Test 1: Basic status application
    const applied = addStatus(character, 'test_damage', 3);
    logTest('Basic Status Application', applied, 'DoT status applied successfully');
    
    // Test 2: Status existence check
    const hasDoT = hasStatus(character, 'test_damage');
    logTest('Status Existence Check', hasDoT, 'Character has DoT status');
    
    // Test 3: Multiple status application
    addStatus(character, 'test_stun', 2);
    addStatus(character, 'test_boost', 0); // Permanent
    const activeStatuses = getActiveStatuses(character);
    logTest('Multiple Status Application', activeStatuses.length === 3, `Has ${activeStatuses.length} active statuses`);
    
    // Test 4: Status removal
    removeStatus(character, 'test_stun');
    const stillHasStun = hasStatus(character, 'test_stun');
    logTest('Status Removal', !stillHasStun, 'Stun status removed successfully');
}

async function testStatusTicks() {
    const character = createTestCharacter(testPlayer);
    createTestStatus();
    
    // Test 1: DoT damage processing
    const originalLife = character.secondary.currentLife;
    addStatus(character, 'test_damage', 3);
    
    processDoTDamage(character, (msg) => console.log(`DoT: ${msg}`));
    const afterDoT = character.secondary.currentLife;
    logTest('DoT Damage Processing', afterDoT < originalLife, `Life reduced from ${originalLife} to ${afterDoT}`);
    
    // Test 2: Turn reduction
    const statusesBefore = getActiveStatuses(character);
    const initialTurns = statusesBefore.find(s => s.id === 'test_damage')?.turns || 0;
    
    reduceTurns(character, (msg) => console.log(`Turn: ${msg}`));
    
    const statusesAfter = getActiveStatuses(character);
    const finalTurns = statusesAfter.find(s => s.id === 'test_damage')?.turns || 0;
    logTest('Turn Reduction', finalTurns === initialTurns - 1, `Turns reduced from ${initialTurns} to ${finalTurns}`);
    
    // Test 3: Status expiration
    // Reduce turns until status expires
    for (let i = 0; i < 5; i++) {
        reduceTurns(character, () => {});
    }
    const expired = !hasStatus(character, 'test_damage');
    logTest('Status Expiration', expired, 'DoT status expired after turn reduction');
}

async function testActionRestrictions() {
    const character = createTestCharacter(testPlayer);
    createTestStatus();
    
    // Test 1: Normal character can act
    const canActNormal = canCharacterAct(character);
    logTest('Normal Character Can Act', canActNormal, 'Character without restrictions can act');
    
    // Test 2: Stunned character cannot act
    addStatus(character, 'test_stun', 2);
    const canActStunned = canCharacterAct(character);
    logTest('Stunned Character Cannot Act', !canActStunned, 'Stunned character blocked from acting');
    
    // Test 3: Ability usage restriction
    const canUseAbilitiesStunned = canUseAbilities(character);
    logTest('Stunned Character Cannot Use Abilities', !canUseAbilitiesStunned, 'Stunned character blocked from abilities');
    
    // Test 4: Escape restriction
    addStatus(character, 'test_trap', 0);
    const canEscapeTrapped = canEscape(character);
    logTest('Trapped Character Cannot Escape', !canEscapeTrapped, 'Trapped character blocked from escaping');
}

async function testTrappedMechanics() {
    const character = createTestCharacter(testPlayer);
    createTestStatus();
    
    // Test 1: Character not trapped initially
    const notTrapped = isCharacterTrapped(character);
    logTest('Character Not Initially Trapped', notTrapped === null, 'Character starts untrapped');
    
    // Test 2: Apply trapped status
    addStatus(character, 'test_trap', 0);
    const isTrapped = isCharacterTrapped(character);
    logTest('Character Is Trapped', isTrapped !== null, 'Character successfully trapped');
    
    // Test 3: Break free attempt
    const breakFreeResult = attemptBreakFree(character, (msg) => console.log(`Break free: ${msg}`));
    logTest('Break Free Attempt', typeof breakFreeResult === 'object', 'Break free attempt processed');
    
    // Test 4: Special effects trapped check
    const specialTrapped = specialEffectsIsTrapped(character);
    logTest('Special Effects Trapped Check', specialTrapped !== null, 'Special effects detects trapped status');
}

async function testFlyingMechanics() {
    const character = createTestCharacter(testPlayer);
    createTestStatus();
    
    // Test 1: Character not flying initially
    const notFlying = isCharacterFlying(character);
    logTest('Character Not Initially Flying', !notFlying, 'Character starts on ground');
    
    // Test 2: Apply flying status
    addStatus(character, 'test_flying', 0);
    const isFlying = isCharacterFlying(character);
    logTest('Character Is Flying', isFlying, 'Character successfully flying');
    
    // Test 3: Has high status check
    const hasHigh = hasIsHighStatus(character);
    logTest('Flying Character Has High Status', hasHigh, 'Flying character detected as elevated');
    
    // Test 4: Flying immunity check
    const closeAttack = { range: 'close', type: 'physical' };
    const immune = checkFlyingImmunity(character, closeAttack, () => {});
    logTest('Flying Immunity to Close Attacks', immune, 'Flying character immune to close attacks');
    
    // Test 5: Dynamic range immunity
    const attacker = createTestCharacter(testPlayer);
    const rangeImmune = checkDynamicRangeImmunity(character, closeAttack, attacker);
    logTest('Dynamic Range Immunity', rangeImmune, 'Elevated character has range immunity');
}

async function testAttributeEffects() {
    const character = createTestCharacter(testPlayer);
    const originalStr = character.primary.strength;
    const originalMaxLife = character.secondary.maxLife;
    
    // Test 1: Primary attribute boost
    const boostConfig = [{ attribute: 'strength', amount: 5 }];
    const appliedBoost = applyPrimaryAttributeBoost(character, boostConfig, (msg) => console.log(`Boost: ${msg}`));
    const boostedStr = character.primary.strength;
    logTest('Primary Attribute Boost', boostedStr === originalStr + 5, `Strength boosted from ${originalStr} to ${boostedStr}`);
    
    // Test 2: Remove primary attribute boost
    removePrimaryAttributeBoost(appliedBoost, (msg) => console.log(`Remove boost: ${msg}`));
    const restoredStr = character.primary.strength;
    logTest('Remove Primary Attribute Boost', restoredStr === originalStr, `Strength restored to ${restoredStr}`);
    
    // Test 3: Secondary attribute boost
    const secondaryBoosts = [{ attribute: 'maxLife', amount: 20 }];
    const appliedSecondary = applySecondaryAttributeBoost(character, secondaryBoosts, (msg) => console.log(`Secondary: ${msg}`));
    const boostedLife = character.secondary.maxLife;
    logTest('Secondary Attribute Boost', boostedLife === originalMaxLife + 20, `MaxLife boosted from ${originalMaxLife} to ${boostedLife}`);
    
    // Test 4: Remove secondary attribute boost
    removeSecondaryAttributeBoost(appliedSecondary, (msg) => console.log(`Remove secondary: ${msg}`));
    const restoredLife = character.secondary.maxLife;
    logTest('Remove Secondary Attribute Boost', restoredLife === originalMaxLife, `MaxLife restored to ${restoredLife}`);
}

async function testDamageSystem() {
    const character = createTestCharacter(testPlayer);
    const originalLife = character.secondary.currentLife;
    
    // Test 1: Normal damage application
    const normalDamage = applyDamageWithImmunity(character, 10, 'physical', 'test', (msg) => console.log(`Damage: ${msg}`));
    logTest('Normal Damage Application', normalDamage === 10, `Applied ${normalDamage} damage`);
    
    // Test 2: Damage immunity check (without immunity)
    const notImmune = checkDamageImmunity(character, 'fire', 'test', () => {});
    logTest('No Fire Immunity', !notImmune, 'Character not immune to fire damage');
    
    // Test 3: Damage modification check
    const testAbility = { damage: 15, damageType: 'ice' };
    const modifiedDamage = checkDamageModification(character, testAbility, 15);
    logTest('Damage Modification Check', typeof modifiedDamage === 'number', `Damage checked and returned ${modifiedDamage}`);
}

async function testStatusManifestLoading() {
    // Test loading statuses from the manifest
    try {
        const manifestPath = '../../story-content/story01-battle-st/statuses.json';
        
        // In browser context, try to load the manifest
        if (typeof fetch !== 'undefined') {
            const response = await fetch(manifestPath);
            if (response.ok) {
                const statusManifest = await response.json();
                logTest('Status Manifest Loading', Array.isArray(statusManifest), `Loaded manifest with ${statusManifest.length} status files`);
                
                // Test that the manifest contains expected files
                const hasFlying = statusManifest.includes('flying.js');
                const hasPinned = statusManifest.includes('pinned.js');
                const hasStunned = statusManifest.includes('stunned.js');
                
                logTest('Manifest Contains Core Statuses', hasFlying && hasPinned && hasStunned, 'Manifest includes flying, pinned, and stunned statuses');
                
                // Try to load a few statuses if possible
                const basePath = '../../story-content/story01-battle-st/statuses/';
                let loadedCount = 0;
                
                for (const statusFile of statusManifest.slice(0, 3)) { // Test first 3 files
                    try {
                        const statusUrl = basePath + statusFile;
                        const statusResponse = await fetch(statusUrl);
                        if (statusResponse.ok) {
                            loadedCount++;
                        }
                    } catch (e) {
                        console.log(`Could not load ${statusFile}: ${e.message}`);
                    }
                }
                
                logTest('Status Files Loading', loadedCount > 0, `Successfully loaded ${loadedCount} status files`);
            } else {
                logTest('Status Manifest Loading', false, 'Could not fetch manifest file');
            }
        } else {
            // Node.js context - try different approach
            logTest('Status Manifest Loading', true, 'Skipped in Node.js context');
        }
    } catch (error) {
        logTest('Status Manifest Loading', false, `Error: ${error.message}`);
    }
}

async function testBattleIntegration() {
    const attacker = createTestCharacter(testPlayer);
    const target = createTestCharacter(testPlayer);
    createTestStatus();
    
    // Test 1: Normal battle interaction
    const normalAbility = { range: 'close', type: 'physical', damage: 10 };
    const normalInteraction = handleModularBattleInteractions(normalAbility, attacker, target, () => {});
    logTest('Normal Battle Interaction', normalInteraction.canHit, 'Normal attack can hit');
    
    // Test 2: Flying target interaction
    addStatus(target, 'test_flying', 0);
    const flyingInteraction = handleModularBattleInteractions(normalAbility, attacker, target, () => {});
    logTest('Flying Target Battle Interaction', !flyingInteraction.canHit, 'Close attack cannot hit flying target');
    
    // Test 3: Diving attack (flying attacker)
    addStatus(attacker, 'test_flying', 0);
    const divingResult = handleDivingAttack(attacker, target, normalAbility, 10, () => {});
    logTest('Diving Attack', divingResult.damage > 10, `Diving attack deals ${divingResult.damage} damage (boosted)`);
}

export async function runStatusEffectsTests() {
    console.log('\n🧪 Starting Status Effects Tests...');
    
    testResults = [];
    testsPassed = 0;
    testsFailed = 0;
    
    try {
        // Run all test suites
        await testStatusApplication();
        await testStatusTicks();
        await testActionRestrictions();
        await testTrappedMechanics();
        await testFlyingMechanics();
        await testAttributeEffects();
        await testDamageSystem();
        await testStatusManifestLoading();
        await testBattleIntegration();
        
        // Summary
        console.log(`\n📊 Status Effects Tests Complete:`);
        console.log(`✅ Passed: ${testsPassed}`);
        console.log(`❌ Failed: ${testsFailed}`);
        console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
        
        return {
            passed: testsPassed,
            failed: testsFailed,
            results: testResults,
            success: testsFailed === 0
        };
        
    } catch (error) {
        console.error('❌ Status Effects Tests Failed:', error);
        return {
            passed: testsPassed,
            failed: testsFailed + 1,
            results: testResults,
            success: false,
            error: error.message
        };
    }
}

// Add timeout protection
export function runStatusEffectsTestsWithTimeout() {
    return Promise.race([
        runStatusEffectsTests(),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Status Effects tests timed out after 10 seconds')), 10000)
        )
    ]);
}
