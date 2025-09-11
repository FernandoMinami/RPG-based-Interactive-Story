// encounters.js - Random encounter system

import { startBattle } from './battle.js';

// Load enemy modules dynamically
async function loadEnemies(storyFolder, enemyIds) {
    const promises = enemyIds.map(id =>
        import(`../story-content/${storyFolder}/enemies/${id}.js?v=${Date.now()}`)
            .then(module => ({ ...module.enemy }))
    );
    return Promise.all(promises);
}

// Handle battle result
function handleBattleResult(result, onBattleEnd, nextKey, modalId = "combat-modal") {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
    if (["win", "escape", "respawn", "survival_win"].includes(result)) {
        onBattleEnd(nextKey);
    } else {
        onBattleEnd("gameover");
    }
}


/**
 * Get a random enemy from the story's enemy manifest
 * @param {string} storyFolder - The story folder path
 * @returns {Object} - A random enemy object
 */
export async function getRandomEnemy(storyFolder) {
    // Load the enemies manifest for this story
    const manifestUrl = `../story-content/${storyFolder}/enemies.json`;
    const enemyList = await fetch(manifestUrl).then(r => r.json());
    
    // Pick a random enemy id
    const enemyId = enemyList[Math.floor(Math.random() * enemyList.length)].id;
    
    // Import the enemy module
    const enemyModule = await import(`../story-content/${storyFolder}/enemies/${enemyId}.js?v=${Date.now()}`);




    return { ...enemyModule.enemy };
}

/**
 * Check for and potentially trigger a random encounter
 * @param {Object} options - Configuration object
 * @param {boolean} options.battleJustHappened - Whether a battle just occurred
 * @param {Object} options.node - Current story node
 * @param {Object} options.storyData - Story data object
 * @param {Object} options.player - Player object
 * @param {Object} options.selectedStory - Selected story object
 * @param {string} options.nodeKey - Current node key
 * @param {Function} options.onBattleEnd - Callback for when battle ends
 * @returns {boolean} - True if encounter was triggered, false otherwise
 */
export function checkForRandomEncounter(options) {
    const {
        battleJustHappened,
        node,
        storyData,
        player,
        selectedStory,
        nodeKey,
        onBattleEnd
    } = options;
    
    // Skip if battle just happened or random encounters are disabled
    const randomEncountersDisabled = node.noBattle || storyData.noBattle || storyData.randomEncounters === false;
    if (battleJustHappened || randomEncountersDisabled) {
        return false;
    }
    
    // 20% chance for random encounter
    if (Math.random() < 0.2) {
        triggerRandomEncounter(selectedStory, player, nodeKey, onBattleEnd);
        return true;
    }
    
    return false;
}

/**
 * Trigger a random encounter battle
 * @param {Object} selectedStory - The selected story object
 * @param {Object} player - The player object
 * @param {string} nodeKey - Current node key
 * @param {Function} onBattleEnd - Callback for when battle ends
 */
export async function triggerRandomEncounter(selectedStory, player, nodeKey, onBattleEnd) {
    const storyFolder = selectedStory.folder.replace('./', '');
    const enemy = await getRandomEnemy(storyFolder);
    
    startBattle(player, enemy, (result, rewards) => {
        handleBattleResult(result, onBattleEnd, nodeKey);
    });
}

/**
 * Trigger a forced battle from a story choice
 * @param {Object} choice - The choice object containing battle info
 * @param {Object} selectedStory - The selected story object
 * @param {Object} player - The player object
 * @param {Function} onBattleEnd - Callback for when battle ends
 */
export async function triggerForcedBattle(choice, selectedStory, player, onBattleEnd) {
    const storyFolder = selectedStory.folder.replace('./', '');
    
    // Support for multiple enemies
    let enemyIds = [];

    if (choice.enemies && Array.isArray(choice.enemies)) {
        // Multi-enemy battle
        enemyIds = choice.enemies;
    } else if (choice.battle) {
        // Single enemy battle (backward compatibility)
        enemyIds = [choice.battle];
    } else {
        console.error('No battle configuration found in choice');
        return;
    }
    
    const enemies = await loadEnemies(storyFolder, enemyIds);

    // Get battle environment if specified, default to neutral
    const battleEnvironment = choice.battleEnvironment || "neutral";
    
    // Create battle configuration for survival battles
    const battleConfig = {
        survivalTurns: choice.survivalTurns || 0,
        survivalObjective: choice.survivalObjective
    };

    
    startBattle(player, enemies.length === 1 ? enemies[0] : enemies, (result, rewards) => {
        handleBattleResult(result, onBattleEnd, choice.next || "gameover");
    }, battleEnvironment, battleConfig);
}

/**
 * Test function for mount system - can be called from browser console
 * Usage: window.testMountSystem()
 */
export async function testMountSystem() {
    try {
        // Import the test enemies
        const skyModule = await import(`../story-content/${storyFolder}/enemies/sky-crusher.js?v=${Date.now()}`);
        const ironModule = await import(`../story-content/${storyFolder}/enemies/iron-beast.js?v=${Date.now()}`);
        
        const enemies = [
            { ...skyModule.enemy },
            { ...ironModule.enemy }
        ];
        
        // Get current player from global scope
        if (!window.player) {
            console.error('No player found! Load a story first.');
            return;
        }
        

        
        startBattle(window.player, enemies, (result, rewards) => {
            const modal = document.getElementById("combat-modal");
            modal.style.display = "none";

        }, "neutral", {});
        
    } catch (error) {
        console.error('Error testing mount system:', error);
    }
}

// Make test function available globally
if (typeof window !== 'undefined') {
    window.testMountSystem = testMountSystem;
}
