// Status Effects Test Suite
// Tests all status effects including application, tick behavior, removal, and special mechanics

import { loadStatuses, applyStatus, isStatusActive, updateStatuses, statusSummary, StatusRegistry } from '../status.js';

let testResults = [];
let statusesData = null;
let currentStoryId = null;

/**
 * Load status effects from a specific story
 */
async function loadStoryStatuses(storyId) {
    try {
        // Load statuses manifest from the story folder
        const statusesUrl = `../../story-content/${storyId}/statuses/_status.json?v=${Date.now()}`;
        const response = await fetch(statusesUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load statuses manifest: ${response.status}`);
        }
        
        const statusesList = await response.json();
        
        // Clear previous statuses
        Object.keys(StatusRegistry).forEach(key => delete StatusRegistry[key]);
        
        // Use the existing loadStatuses function to load JavaScript modules
        const statusBasePath = `../../story-content/${storyId}/statuses/`;
        await loadStatuses(statusesList, statusBasePath);
        
        statusesData = statusesList;
        currentStoryId = storyId;
        
        return statusesList;
    } catch (error) {
        console.error('Failed to load story statuses:', error);
        throw error;
    }
}

/**
 * Create a test character
 */
function createTestCharacter(name = "Test Character", type = "normal") {
    return {
        name,
        type,
        life: 100,
        maxLife: 100,
        attributes: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            wisdom: 10,
            charisma: 10
        },
        statuses: []
    };
}

/**
 * Test basic status application and removal
 */
function testStatusApplication() {
    const results = [];
    
    Object.keys(StatusRegistry).forEach(statusId => {
        const status = StatusRegistry[statusId];
        const character = createTestCharacter("Status Test Character");
        const logs = [];
        
        try {
            // Test application
            applyStatus(character, statusId, 3, (msg) => logs.push(msg));
            const isActive = isStatusActive(character, statusId);
            
            results.push({
                status: statusId,
                name: status.name || statusId,
                applied: isActive,
                logs: [...logs],
                error: null
            });
            
            // Test removal if it has a remove function
            if (status.remove && typeof status.remove === 'function') {
                status.remove(character, (msg) => logs.push(msg));
            }
            
        } catch (error) {
            results.push({
                status: statusId,
                name: status.name || statusId,
                applied: false,
                logs: [...logs],
                error: error.message
            });
        }
    });
    
    return results;
}

/**
 * Test status tick behavior
 */
function testStatusTicks() {
    const results = [];
    
    Object.keys(StatusRegistry).forEach(statusId => {
        const status = StatusRegistry[statusId];
        const character = createTestCharacter("Tick Test Character");
        const logs = [];
        
        try {
            // Apply status with 3 turns
            applyStatus(character, statusId, 3, (msg) => logs.push(msg));
            
            const initialTurns = character.statuses.find(s => s.id === statusId)?.turns || 0;
            
            // Test tick function if it exists
            let tickResult = null;
            if (status.tick && typeof status.tick === 'function') {
                tickResult = status.tick(character, initialTurns);
            }
            
            results.push({
                status: statusId,
                name: status.name || statusId,
                initialTurns,
                tickResult,
                hasTick: typeof status.tick === 'function',
                isPermanent: status.permanent || false,
                error: null
            });
            
        } catch (error) {
            results.push({
                status: statusId,
                name: status.name || statusId,
                initialTurns: 0,
                tickResult: null,
                hasTick: false,
                isPermanent: false,
                error: error.message
            });
        }
    });
    
    return results;
}

/**
 * Test flying mechanics specifically
 */
function testFlyingMechanics() {
    const results = [];
    
    if (!StatusRegistry.flying && !StatusRegistry.fly) {
        return [{ error: "Flying status not found in registry" }];
    }
    
    const flyingStatus = StatusRegistry.flying || StatusRegistry.fly;
    const character = createTestCharacter("Flying Test Character");
    const logs = [];
    
    try {
        // Test basic flying application
        applyStatus(character, 'flying', 0, (msg) => logs.push(msg), true);
        
        const originalDex = character.attributes.dexterity;
        
        // Check if dexterity was boosted
        const dexBoost = character.attributes.dexterity - originalDex;
        
        // Test close attack ending flying
        const mockCloseAttack = { name: "Punch", range: "close", type: "physical" };
        let closeAttackEnds = false;
        if (flyingStatus.shouldEndFromCloseAttack) {
            closeAttackEnds = flyingStatus.shouldEndFromCloseAttack(mockCloseAttack, character, (msg) => logs.push(msg));
        }
        
        // Test ranged attack ending flying
        const mockRangedAttack = { name: "Magic Missile", range: "ranged", type: "magic" };
        let rangedAttackResult = { shouldEnd: false, fallDamage: 0 };
        if (flyingStatus.shouldEndFromRangedHit) {
            rangedAttackResult = flyingStatus.shouldEndFromRangedHit(mockRangedAttack, character, (msg) => logs.push(msg));
        }
        
        results.push({
            status: "flying",
            dexterityBoost: dexBoost,
            immuneToClose: flyingStatus.immuneToClose || false,
            speedBonus: flyingStatus.speedBonus || 0,
            divingAttackMultiplier: flyingStatus.divingAttackMultiplier || 1,
            closeAttackEndsFlying: closeAttackEnds,
            rangedAttackEndsFlying: rangedAttackResult.shouldEnd,
            fallDamage: rangedAttackResult.fallDamage,
            logs: [...logs],
            error: null
        });
        
    } catch (error) {
        results.push({
            status: "flying",
            error: error.message,
            logs: [...logs]
        });
    }
    
    return results;
}

/**
 * Test pinned mechanics specifically
 */
function testPinnedMechanics() {
    const results = [];
    
    if (!StatusRegistry.pinned && !StatusRegistry.pin) {
        return [{ error: "Pinned status not found in registry" }];
    }
    
    const pinnedStatus = StatusRegistry.pinned || StatusRegistry.pin;
    const character = createTestCharacter("Pinned Test Character");
    const logs = [];
    
    try {
        // Test basic pinned application
        applyStatus(character, 'pinned', 3, (msg) => logs.push(msg));
        
        const originalSpeed = character.attributes.dexterity;
        
        // Check if speed was reduced
        const speedReduction = originalSpeed - character.attributes.dexterity;
        
        // Test movement blocking
        const blocksMovement = pinnedStatus.blocksMovement || false;
        const speedPenalty = pinnedStatus.speedPenalty || 0;
        
        results.push({
            status: "pinned",
            speedReduction,
            blocksMovement,
            speedPenalty,
            isPermanent: pinnedStatus.permanent || false,
            logs: [...logs],
            error: null
        });
        
    } catch (error) {
        results.push({
            status: "pinned",
            error: error.message,
            logs: [...logs]
        });
    }
    
    return results;
}

/**
 * Test status interactions with character types
 */
function testStatusTypeInteractions() {
    const results = [];
    const testTypes = ["fire", "water", "earth", "air", "normal"];
    
    Object.keys(StatusRegistry).forEach(statusId => {
        testTypes.forEach(type => {
            const character = createTestCharacter(`${type} Type Character`, type);
            const logs = [];
            
            try {
                applyStatus(character, statusId, 3, (msg) => logs.push(msg));
                const isActive = isStatusActive(character, statusId);
                
                results.push({
                    status: statusId,
                    characterType: type,
                    statusApplied: isActive,
                    logs: [...logs],
                    error: null
                });
                
            } catch (error) {
                results.push({
                    status: statusId,
                    characterType: type,
                    statusApplied: false,
                    logs: [...logs],
                    error: error.message
                });
            }
        });
    });
    
    return results;
}

/**
 * Run all status effect tests
 */
export async function runStatusEffectsTests(storyId, outputElement) {
    try {
        
        // Load statuses for the specified story
        await loadStoryStatuses(storyId);
        
        
        // Run all tests
        const applicationResults = testStatusApplication();
        
        const tickResults = testStatusTicks();
        
        const flyingResults = testFlyingMechanics();
        
        const pinnedResults = testPinnedMechanics();
        
        const typeResults = testStatusTypeInteractions();
        
        // Summary
        const totalTests = applicationResults.length + tickResults.length + flyingResults.length + pinnedResults.length + typeResults.length;
        const passedTests = [
            ...applicationResults.filter(r => !r.error && r.applied),
            ...tickResults.filter(r => !r.error),
            ...flyingResults.filter(r => !r.error),
            ...pinnedResults.filter(r => !r.error),
            ...typeResults.filter(r => !r.error)
        ].length;
        
        
        return {
            story: storyId,
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            results: {
                application: applicationResults,
                ticks: tickResults,
                flying: flyingResults,
                pinned: pinnedResults,
                typeInteractions: typeResults
            }
        };
        
    } catch (error) {
        console.error('Status effects test failed:', error);
        return null;
    }
}

// Formatting functions
function formatApplicationResults(results) {
    let output = '';
    results.forEach(result => {
        const status = result.error ? '❌' : (result.applied ? '✓' : '⚠️');
        output += `${status} ${result.name || result.status}: ${result.error || (result.applied ? 'Applied successfully' : 'Not applied')}\n`;
        if (result.logs.length > 0) {
            output += `  └─ ${result.logs.join(', ')}\n`;
        }
    });
    return output;
}

function formatTickResults(results) {
    let output = '';
    results.forEach(result => {
        const status = result.error ? '❌' : '✓';
        output += `${status} ${result.name || result.status}:\n`;
        output += `  └─ Has tick function: ${result.hasTick}, Permanent: ${result.isPermanent}\n`;
        if (result.error) {
            output += `  └─ Error: ${result.error}\n`;
        }
    });
    return output;
}

function formatFlyingResults(results) {
    let output = '';
    results.forEach(result => {
        if (result.error) {
            output += `❌ Flying test failed: ${result.error}\n`;
        } else {
            output += `✓ Flying mechanics test:\n`;
            output += `  └─ Dexterity boost: +${result.dexterityBoost}\n`;
            output += `  └─ Immune to close attacks: ${result.immuneToClose}\n`;
            output += `  └─ Speed bonus: +${result.speedBonus}\n`;
            output += `  └─ Diving attack multiplier: ${result.divingAttackMultiplier}x\n`;
            output += `  └─ Close attack ends flying: ${result.closeAttackEndsFlying}\n`;
            output += `  └─ Ranged attack ends flying: ${result.rangedAttackEndsFlying}\n`;
            if (result.fallDamage > 0) {
                output += `  └─ Fall damage: ${result.fallDamage}\n`;
            }
        }
        if (result.logs && result.logs.length > 0) {
            output += `  └─ Logs: ${result.logs.join(', ')}\n`;
        }
    });
    return output;
}

function formatPinnedResults(results) {
    let output = '';
    results.forEach(result => {
        if (result.error) {
            output += `❌ Pinned test failed: ${result.error}\n`;
        } else {
            output += `✓ Pinned mechanics test:\n`;
            output += `  └─ Speed reduction: -${result.speedReduction}\n`;
            output += `  └─ Blocks movement: ${result.blocksMovement}\n`;
            output += `  └─ Speed penalty: ${result.speedPenalty}\n`;
            output += `  └─ Permanent: ${result.isPermanent}\n`;
        }
        if (result.logs && result.logs.length > 0) {
            output += `  └─ Logs: ${result.logs.join(', ')}\n`;
        }
    });
    return output;
}

function formatTypeInteractionResults(results) {
    let output = '';
    const groupedResults = {};
    
    // Group by status
    results.forEach(result => {
        if (!groupedResults[result.status]) {
            groupedResults[result.status] = [];
        }
        groupedResults[result.status].push(result);
    });
    
    Object.keys(groupedResults).forEach(statusId => {
        const statusResults = groupedResults[statusId];
        output += `${statusId}:\n`;
        
        statusResults.forEach(result => {
            const status = result.error ? '❌' : (result.statusApplied ? '✓' : '⚠️');
            output += `  ${status} ${result.characterType} type: ${result.error || (result.statusApplied ? 'Applied' : 'Blocked/Immune')}\n`;
            
            // Show immunity logs
            if (result.logs.length > 0 && result.logs.some(log => log.includes('immunity'))) {
                output += `    └─ ${result.logs.find(log => log.includes('immunity'))}\n`;
            }
        });
        output += '\n';
    });
    
    return output;
}
