/*
* Turn Management System - Brand New Pokemon-style Turn-Based Battle System
* 
* SYSTEM OVERVIEW:
* - Each ROUND consists of multiple character TURNS
* - Player chooses action at start of round, then turn order is calculated
* - Turn order based on speed attribute (highest speed goes first)
* - In case of tie, player goes first, then enemies in any order
* - Status effects applied at start of each character's turn
* - Environmental effects applied at start of each round
* - Battle ends when player or all enemies are defeated
*/

// Import required systems
import { handleEnemyTurn, selectEnemyAbility } from './battle-enemies-ai.js';
import { 
    canCharacterAct, 
    reduceTurns, 
    isStatusActive 
} from './status.js';
import { 
    applyEnvironmentalEffects
} from './environments.js';
import { createBattleLogger } from './battle-logging.js';
import { getAbilities } from './abilities.js';

/**
 * Initialize ability tracking for battle
 * @param {Object} player - The player object
 * @returns {Object} - Initialized tracking objects
 */
export function initializeAbilityTracking(player) {
    const abilityCooldowns = {};
    const abilityUsesLeft = {};

    const playerAbilities = getAbilities(player.abilityIds || []);
    Object.entries(playerAbilities).forEach(([abilityId, ability]) => {
        abilityCooldowns[abilityId] = 0; // No cooldown at start
        if (ability.usesPerBattle && ability.usesPerBattle > 0) {
            abilityUsesLeft[abilityId] = ability.usesPerBattle;
        }
    });

    return { abilityCooldowns, abilityUsesLeft };
}

/**
 * Handle escape attempt
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Function} addLog - Logging function (optional for backwards compatibility)
 * @returns {Object} - { success: boolean, messages: Array }
 */
export function handleEscapeAttempt(player, enemy, addLog) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const playerSpeed = player.secondaryAttributes?.speed || player.secondary?.speed || 0;
    const enemySpeed = enemy.secondaryAttributes?.speed || enemy.secondary?.speed || 0;
    const escapeScore = Math.floor(roll + playerSpeed - enemySpeed);
    
    const messages = [];
    const attemptMessage = `${player.name} tries to escape! (Roll: ${roll} + Speed: ${playerSpeed} - Enemy Speed: ${enemySpeed} = ${escapeScore})`;
    messages.push(attemptMessage);
    
    let success = false;
    let resultMessage = '';
    
    if (escapeScore > 10) {
        resultMessage = `${player.name} escaped successfully!`;
        success = true;
    } else {
        resultMessage = `${player.name} failed to escape!`;
        success = false;
    }
    
    messages.push(resultMessage);
    
    // For backwards compatibility, still log if addLog is provided
    if (addLog) {
        addLog(attemptMessage);
        addLog(resultMessage);
    }
    
    return { success, messages };
}

/**
 * Handle struggle attempt when pinned
 * @param {Object} player - The player object
 * @param {Object} enemy - The enemy object
 * @param {Function} addLog - Logging function (optional for backwards compatibility)
 * @returns {Object} - { success: boolean, messages: Array }
 */
export function handleStruggleAttempt(player, enemy, addLog) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const playerStrengthBonus = (player.primaryAttributes?.strength || player.primary?.strength || 10) - 10;
    const enemyWeight = enemy.misc?.weight || 0;
    const struggleScore = Math.floor(roll + playerStrengthBonus - (enemyWeight / 10));
    
    const messages = [];
    const attemptMessage = `${player.name} Struggles! (Roll: ${roll} + Strength Bonus: ${playerStrengthBonus} - Enemy Weight/10: ${enemyWeight}/10 = ${struggleScore})`;
    messages.push(attemptMessage);
    
    let success = false;
    let resultMessage = '';
    
    if (struggleScore > 10) {
        resultMessage = `${player.name} Manages to push ${enemy.name} away!`;
        success = true;
    } else {
        resultMessage = `${player.name} failed to escape!`;
        success = false;
    }
    
    messages.push(resultMessage);
    
    // For backwards compatibility, still log if addLog is provided
    if (addLog) {
        addLog(attemptMessage);
        addLog(resultMessage);
    }
    
    return { success, messages };
}

/**
 * Create a new round management system for a battle
 * @param {Object} player - Player character
 * @param {Array} enemies - Array of enemy characters
 * @param {Object} battleEnvironment - Battle environment data
 * @param {Object} battleConfig - Battle configuration
 * @param {Function} onBattleEnd - Callback when battle ends
 * @param {Function} onPlayerAction - Callback to get player action
 * @returns {Object} Round management system
 */
export function createRoundManager(player, enemies, battleEnvironment = null, battleConfig = {}, onBattleEnd = () => {}, onPlayerAction = () => {}) {
    
    // Battle state
    const battleState = {
        round: 0,
        currentTurn: 0,
        isPlayerTurn: false,
        playerAction: null,
        turnOrder: [],
        aliveCharacters: [],
        battleEnded: false,
        winner: null,
        battleEnvironment,
        battleConfig,
        roundActions: [], // Store all actions in current round
        turnHistory: [] // Store all completed turns
    };

    // Initialize battle logger
    const logger = createBattleLogger();
    logger.initializeBattle(enemies.length);

    /**
     * Check which characters are still alive
     * @returns {Object} Object with alive characters arrays
     */
    function checkCharactersAlive() {
        const aliveEnemies = enemies.filter(enemy => enemy.life > 0);
        const isPlayerAlive = player.life > 0;
        
        battleState.aliveCharacters = [
            ...(isPlayerAlive ? [player] : []),
            ...aliveEnemies
        ];

        return {
            player: isPlayerAlive ? player : null,
            enemies: aliveEnemies,
            all: battleState.aliveCharacters,
            playerAlive: isPlayerAlive,
            enemiesAlive: aliveEnemies.length > 0
        };
    }

    /**
     * Store player's chosen action for the round
     * @param {Object} action - Player action object
     */
    function storePlayerAction(action) {
        battleState.playerAction = action;
    }

    /**
     * Calculate turn order based on character speed
     * @param {Object} aliveChars - Result from checkCharactersAlive()
     * @returns {Array} Array of characters in turn order
     */
    function calculateTurnOrder(aliveChars) {
        const turnOrder = [...aliveChars.all];
        
        // Sort by speed (highest first)
        turnOrder.sort((a, b) => {
            const speedA = a.secondaryAttributes?.speed || a.speed || 0;
            const speedB = b.secondaryAttributes?.speed || b.speed || 0;
            
            if (speedA === speedB) {
                // In case of tie, player goes first
                if (a === player) return -1;
                if (b === player) return 1;
                return 0; // Enemies can be in any order for ties
            }
            
            return speedB - speedA; // Descending order (highest speed first)
        });

        battleState.turnOrder = turnOrder;
        return turnOrder;
    }

    /**
     * Apply environmental effects at the start of a round
     * @param {Object} aliveChars - Alive characters
     */
    function processEnvironmentalEffects(aliveChars) {
        // Use new environmental system
        aliveChars.all.forEach(character => {
            try {
                applyEnvironmentalEffects(character, logger.addMessagesToLog);
            } catch (error) {
                console.error('Error applying environmental effects to', character.name, ':', error);
            }
        });
    }

    /**
     * Start a new round
     * @returns {Promise<boolean>} True if round started successfully
     */
    async function startNewRound() {
        battleState.round++;
        battleState.currentTurn = 0;
        battleState.roundActions = [];
        


        // 1. Check alive characters
        const aliveChars = checkCharactersAlive();
        
        // 2. Check battle end conditions
        if (checkBattleEndConditions(aliveChars)) {
            return false;
        }

        // 3. Apply environmental effects
        processEnvironmentalEffects(aliveChars);

        // 4. Get player action for this round
        if (aliveChars.playerAlive) {
            battleState.playerAction = await onPlayerAction(player, aliveChars.enemies);
            if (!battleState.playerAction) {
                console.error('❌ No player action received');
                return false;
            }
        }

        // 5. Calculate turn order
        calculateTurnOrder(aliveChars);

        // 6. Start executing turns
        await executeTurns();
        
        return true;
    }

    /**
     * Execute all character turns in the calculated order
     */
    async function executeTurns() {

        
        for (let i = 0; i < battleState.turnOrder.length; i++) {
            const character = battleState.turnOrder[i];
            battleState.currentTurn = i + 1;
            
            // Skip if character died during this round
            if (character.life <= 0) {

                continue;
            }

            await executeCharacterTurn(character);
            
            // Check if battle ended after this turn
            const aliveChars = checkCharactersAlive();
            if (checkBattleEndConditions(aliveChars)) {
                break;
            }
        }

        // End of round
        await endRound();
    }

    /**
     * Execute a single character's turn
     * @param {Object} character - Character taking the turn
     */
    async function executeCharacterTurn(character) {

        
        // 1. Apply start-of-turn status effects
        applyStartOfTurnEffects(character);
        
        // 2. Check if character can act
        if (!canCharacterAct(character)) {

            logger.addMessagesToLog([`${character.name} cannot act this turn due to status effects`]);
            return;
        }

        // 3. Execute character action
        if (character === player) {
            await executePlayerTurn(character);
        } else {
            await executeEnemyTurn(character);
        }

        // 4. Apply end-of-turn effects
        applyEndOfTurnEffects(character);
    }

    /**
     * Execute player's turn using stored action
     * @param {Object} character - Player character
     */
    async function executePlayerTurn(character) {

        
        if (!battleState.playerAction) {
            console.error('❌ No player action available');
            return;
        }

        const action = battleState.playerAction;
        
        // Record action in round history
        battleState.roundActions.push({
            character: character.name,
            action: action,
            turn: battleState.currentTurn
        });

        // Execute the action based on type
        switch (action.type) {
            case 'ability':
                // Handle ability usage
                // This would integrate with your existing ability system

                break;
            case 'item':
                // Handle item usage

                break;
            case 'escape':
                // Handle escape attempt

                break;
            default:
                console.warn('⚠️ Unknown action type:', action.type);
        }
    }

    /**
     * Execute enemy's turn using AI
     * @param {Object} character - Enemy character
     */
    async function executeEnemyTurn(character) {

        
        try {
            const aliveChars = checkCharactersAlive();
            const enemyIndex = enemies.findIndex(e => e === character);
            
            // Use existing AI system from battle-enemies-ai.js
            await handleEnemyTurn(
                { round: battleState.round, turn: battleState.currentTurn },
                aliveChars.enemies,
                player,
                enemies,
                this, // Pass turn manager reference
                logger.addMessagesToLog,
                logger.addRecentAction,
                () => {}, // nextTurn callback
                battleState,
                {} // lastEnemyAbilities tracking
            );

            // Record action in round history
            battleState.roundActions.push({
                character: character.name,
                action: { type: 'ai_action' },
                turn: battleState.currentTurn
            });

        } catch (error) {
            console.error('Error executing enemy turn:', error);
            logger.addMessagesToLog([`${character.name} failed to act due to an error`]);
        }
    }

    /**
     * Apply status effects at the start of a character's turn
     * @param {Object} character - Character starting their turn
     */
    function applyStartOfTurnEffects(character) {

        
        try {
            // Reduce status effect durations and apply effects
            reduceTurns(character, logger.addMessagesToLog);
            
            // Apply any DoT (damage over time) effects here
            // This would integrate with your status system
            
        } catch (error) {
            console.error('Error applying start-of-turn effects:', error);
        }
    }

    /**
     * Apply effects at the end of a character's turn
     * @param {Object} character - Character ending their turn
     */
    function applyEndOfTurnEffects(character) {

        
        try {
            // Apply any end-of-turn status effects
            // Apply regeneration, poison, etc.
            
        } catch (error) {
            console.error('Error applying end-of-turn effects:', error);
        }
    }

    /**
     * Check if battle should end
     * @param {Object} aliveChars - Result from checkCharactersAlive()
     * @returns {boolean} True if battle should end
     */
    function checkBattleEndConditions(aliveChars) {
        if (battleState.battleEnded) return true;

        // Player defeated
        if (!aliveChars.playerAlive) {
            battleState.battleEnded = true;
            battleState.winner = 'enemies';

            onBattleEnd('defeat');
            return true;
        }

        // All enemies defeated
        if (!aliveChars.enemiesAlive) {
            battleState.battleEnded = true;
            battleState.winner = 'player';

            onBattleEnd('victory');
            return true;
        }

        // Survival battle conditions
        if (battleState.battleConfig.survivalTurns && 
            battleState.round >= battleState.battleConfig.survivalTurns) {
            battleState.battleEnded = true;
            battleState.winner = 'player';

            onBattleEnd('survival');
            return true;
        }

        return false;
    }

    /**
     * End the current round and prepare for next
     */
    async function endRound() {

        
        // Finalize round in battle logger
        logger.finalizeRoundLog();
        
        // Store round history
        battleState.turnHistory.push({
            round: battleState.round,
            actions: [...battleState.roundActions],
            turnOrder: [...battleState.turnOrder.map(char => char.name)]
        });

        // Check if battle continues
        const aliveChars = checkCharactersAlive();
        if (!checkBattleEndConditions(aliveChars)) {
            // Start next round
            setTimeout(() => startNewRound(), 100);
        }
    }

    // Public API
    return {
        // Core battle flow
        startBattle: startNewRound,
        endBattle: () => {
            battleState.battleEnded = true;
            logger.completeBattle();
        },
        
        // State access
        getBattleState: () => ({ ...battleState }),
        getCurrentRound: () => battleState.round,
        getCurrentTurn: () => battleState.currentTurn,
        isPlayerTurn: () => battleState.isPlayerTurn,
        
        // Action management
        setPlayerAction: storePlayerAction,
        getPlayerAction: () => battleState.playerAction,
        
        // Character management
        getAliveCharacters: checkCharactersAlive,
        getTurnOrder: () => [...battleState.turnOrder],
        
        // Battle state queries
        isBattleEnded: () => battleState.battleEnded,
        getWinner: () => battleState.winner,
        getBattleHistory: () => [...battleState.turnHistory],
        
        // Logging
        getLogger: () => logger,
        
        // Internal functions (for AI integration)
        _internal: {
            executeCharacterTurn,
            applyStartOfTurnEffects,
            applyEndOfTurnEffects,
            checkBattleEndConditions
        }
    };
}

/**
 * Legacy compatibility function - creates old-style turn manager interface
 * This bridges the gap between old battle.js code and new round management system
 * @param {Object} player - Player character
 * @param {Array} enemies - Array of enemy characters
 * @returns {Object} Legacy turn manager interface
 */
export function createTurnManager(player, enemies) {
    // Only show warning once per session to reduce console noise
    if (!window._turnManagerWarningShown) {
        console.info('ℹ️ Battle system using legacy turn management (compatible mode)');
        window._turnManagerWarningShown = true;
    }
    
    // Create the new round manager
    const roundManager = createRoundManager(player, enemies, null, {}, () => {}, () => {});
    
    // Create legacy interface that bridges to new system
    let currentTurn = 0;
    let playerTurn = true;
    let roundCompleteCallback = null;
    let currentRound = 1;
    
    // Track who has acted this round
    let playerActed = false;
    let enemiesActed = [];
    
    function resetRound() {

        playerActed = false;
        enemiesActed = enemies.map(() => false);
        playerTurn = true; // Player always starts the round
        currentTurn = 0;
    }
    
    function checkRoundComplete() {
        const aliveEnemies = enemies.filter(e => e.secondary?.life > 0 || e.life > 0);
        const allEnemiesActed = aliveEnemies.every((enemy, index) => {
            const enemyIndex = enemies.indexOf(enemy);
            return enemiesActed[enemyIndex] === true;
        });
        
        const roundComplete = playerActed && allEnemiesActed;

        
        if (roundComplete) {

            
            // Update cooldowns at the end of each round
            if (window.battleState && window.battleState.abilityCooldowns) {
                updateCooldowns(window.battleState.abilityCooldowns);
            }
            
            if (roundCompleteCallback) {
                roundCompleteCallback();
            }
            currentRound++;
            resetRound();
            return true;
        }
        return false;
    }
    
    // Initialize first round
    resetRound();
    
    /**
     * Update ability cooldowns - called at the start of each player turn
     * @param {Object} abilityCooldowns - Cooldown tracking object
     */
    function updateCooldowns(abilityCooldowns) {
        if (!abilityCooldowns) return;
        
        Object.keys(abilityCooldowns).forEach(abilityId => {
            if (abilityCooldowns[abilityId] > 0) {
                abilityCooldowns[abilityId]--;
                const remainingTurns = abilityCooldowns[abilityId];
                if (remainingTurns === 0) {

                } else {

                }
            }
        });
    }
    
    return {
        // Legacy methods expected by battle.js
        setRoundCompleteCallback(callback) {
            roundCompleteCallback = callback;

        },
        
        getTurnInfo() {
            const battleState = roundManager.getBattleState();
            const aliveChars = roundManager.getAliveCharacters();
            
            return {
                currentTurn: currentTurn,
                playerTurn: playerTurn,
                playerStats: player,
                enemyStats: enemies[0], // Legacy expects single enemy stats
                canPlayerAct: true, // Simplified for compatibility
                canEnemyAct: true,
                enemies: enemies,
                isPlayerTurn: playerTurn
            };
        },
        
        nextTurn(battleState, addLog, battleEnvironment, addLogDupe) {

            
            // Update cooldowns when it's player's turn
            if (playerTurn && battleState && battleState.abilityCooldowns) {
                updateCooldowns(battleState.abilityCooldowns);
            }
            
            // Check if round is complete first
            if (checkRoundComplete()) {
                // Round completed, start new round with player turn
                return;
            }
            
            // Determine next turn based on who hasn't acted yet
            const aliveEnemies = enemies.filter(e => e.secondary?.life > 0 || e.life > 0);
            
            if (!playerActed && playerTurn) {
                // Player's turn but they haven't acted - shouldn't happen, but just in case

                return;
            }
            
            if (playerActed && !playerTurn) {
                // Currently enemy turn, check if all enemies have acted
                const allEnemiesActed = aliveEnemies.every((enemy, index) => {
                    const enemyIndex = enemies.indexOf(enemy);
                    return enemiesActed[enemyIndex] === true;
                });
                
                if (allEnemiesActed) {
                    // All characters have acted, complete the round
                    checkRoundComplete();
                    return;
                } else {
                    // More enemies need to act, stay on enemy turn

                    return;
                }
            }
            
            // Normal turn progression
            this.switchTurn();
        },
        
        switchTurn() {
            const wasPlayerTurn = playerTurn;
            playerTurn = !playerTurn;
            currentTurn++;

        },
        
        markCharacterActed(isPlayer, enemyIndex = 0) {
            if (isPlayer) {
                playerActed = true;

            } else {
                if (enemyIndex >= 0 && enemyIndex < enemies.length) {
                    enemiesActed[enemyIndex] = true;

                }
            }
            
            // Check if round is complete after marking
            checkRoundComplete();
        },
        
        // Bridge to new system methods
        getBattleState: () => roundManager.getBattleState(),
        getAliveCharacters: () => roundManager.getAliveCharacters(),
        isBattleEnded: () => roundManager.isBattleEnded(),
        
        // Internal access to new system
        _newRoundManager: roundManager,
        
        // Debug methods
        _debug: {
            playerActed: () => playerActed,
            enemiesActed: () => [...enemiesActed],
            currentRound: () => currentRound,
            resetRound
        }
    };
}
