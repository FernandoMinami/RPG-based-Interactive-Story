// encounters.js - Random encounter system

import { startBattle } from './battle.js';

/**
 * Get a random enemy from the story's enemy manifest
 * @param {string} storyFolder - The story folder path
 * @returns {Object} - A random enemy object
 */
export async function getRandomEnemy(storyFolder) {
    // Load the enemies manifest for this story
    const manifestUrl = `../story-content/${storyFolder}/enemies/_enemies.json`;
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
    
    // Skip if battle just happened or battles are disabled
    if (battleJustHappened || node.noBattle || storyData.noBattle) {
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
        const modal = document.getElementById("combat-modal");
        modal.style.display = "none";
        
        if (result === "win" || result === "escape" || result === "respawn") {
            onBattleEnd(nodeKey);
        } else {
            onBattleEnd("gameover");
        }
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
    const enemyModule = await import(`../story-content/${storyFolder}/enemies/${choice.battle}.js?v=${Date.now()}`);
    const enemy = { ...enemyModule.enemy };
    
    startBattle(player, enemy, (result, rewards) => {
        const modal = document.getElementById("combat-modal");
        modal.style.display = "none";
        
        if (result === "win" || result === "escape" || result === "respawn") {
            onBattleEnd(choice.next);
        } else {
            onBattleEnd("gameover");
        }
    });
}
