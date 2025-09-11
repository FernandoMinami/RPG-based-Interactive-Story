import { addExp, getExpForLevel } from './leveling.js';
import { getInventory, removeItem, addLoot } from './inventory.js';
import { updateSecondaryStats } from './characters.js';
import { updateLifeBar } from './ui.js';
import { 
    addStatus, 
    removeStatus,
    reduceTurns,
    processDoTDamage,
    statusSummary, 
    isStatusActive, 
    isCharacterTrapped, 
    canCharacterAct,
    StatusRegistry,
    applyStatus,
    updateStatuses,
    applyStunnedStatus,
    removeMountPartnership,
    initializeCharacter,
    attemptBreakFree,
    removeStatusAtEnd
} from './status.js';
import { getAbilities, useAbility, canUseAbility } from './abilities.js';
import { getLootById } from './loot.js';
import './history.js'; // Ensure history module is loaded
import { getTypeMatchupDescription, calculateAbilityTypeBonus, getStatusEffectInteraction } from './elements.js';
import { 
    setActiveEnvironment, 
    applyEnvironmentalEffects, 
    applyEnvironmentalAttributes, 
    initializeCharacterEnvironment, 
    cleanupEnvironmentalEffects,
    modifyAbilityByEnvironment
} from './environments.js';
import { 
    createAbilityButtons, 
    createConsumableButtons, 
    createEscapeButton, 
    setupActionButtons, 
    updateBattleStats, 
    setupBattleHistory 
} from './battle-ui.js';
import { 
    calculateAccuracy, 
    calculateDamage, 
    calculateCriticalHit, 
    applyDamage, 
    handleAbilityEffects
} from './combat-calculations.js';
// Import new modular system
import { handleModularBattleInteractions, removeIsHighStatuses, handleForcefulBreakFree, cleanupAllTrappedStatuses } from './special-effects.js';
import { createBattleLogger, createActionData, logDamage, logAttackResult } from './battle-logging.js';
import { 
    createRoundManager,
    createTurnManager,
    initializeAbilityTracking, 
    handleEscapeAttempt, 
    handleStruggleAttempt
} from './turn-management.js';
import { 
    handleEnemyTurn as handleEnemyTurnAI,
    checkForEnemyCombo,
    executeEnemyAbility,
    selectEnemyAbility
} from './battle-enemies-ai.js'; // Enemy AI logic moved to separate module for better organization
import { advanceTimeForBattleRound } from './day-night.js';



// Starts a battle between the player and enemy(ies)
export function startBattle(player, enemy, onBattleEnd, battleEnvironment = null, battleConfig = {}) {
    // Support both single enemy and multi-enemy battles
    const enemies = Array.isArray(enemy) ? enemy : [enemy];
    
    // Ensure all enemies have the isEnemy flag for proper identification
    enemies.forEach(enemy => {
        enemy.isEnemy = true;
    });
    
    const isSurvivalBattle = battleConfig.survivalTurns && battleConfig.survivalTurns > 0;
    
    const modal = document.getElementById("combat-modal");
    const actionsDiv = document.getElementById("combat-actions");

    // Initialize battle logging
    const logger = createBattleLogger();
    logger.initializeBattle(enemies.length);
    const { addMessagesToLog, addRecentAction, finalizeRoundLog, forceRoundCompletion, completeBattle, clearLogs, getAllRounds, logEnvironmentalEffects } = logger;
    
    // Create compatibility wrapper for old addLog function
    const addLog = addMessagesToLog;

    // Set up global battle environment for damage calculations
    if (battleEnvironment) {
        if (typeof battleEnvironment === "string") {
            // Set up new environmental system
            setActiveEnvironment(battleEnvironment, 5, addLog);
        } else if (battleEnvironment.type) {
            // Use object format with intensity
            const intensity = battleEnvironment.intensity || 5;
            setActiveEnvironment(battleEnvironment.type, intensity, addLog);
        }
    } else {
        // Set neutral environment
        setActiveEnvironment('neutral', 1, addLog);
    }
    
    // Function to sync compatibility layer back to secondary attributes
    function syncCharacterAttributes(character) {
        if (character.secondary) {
            character.secondary.life = character.life;
            // Don't sync maxLife - it should never change during battle
            character.secondary.mp = character.mp;
            character.secondary.maxMp = character.maxMp;
            character.secondary.attack = character.attack;
            character.secondary.defense = character.defense;
            character.secondary.speed = character.speed;
            character.secondary.accuracy = character.accuracy;
            character.secondary.evasion = character.evasion;
            character.secondary.luck = character.luck;
            character.secondary.critChance = character.critChance;
            character.secondary.critMultiplier = character.critMultiplier;
        }
    }

    // Initialize characters in the new status system
    initializeCharacter(player);
    initializeCharacterEnvironment(player);
    
    enemies.forEach(enemy => {
        initializeCharacter(enemy);
        initializeCharacterEnvironment(enemy);
        updateSecondaryStats(enemy, false); // Calculate secondary stats for enemies
    });

    // Apply initial environmental attribute modifiers
    applyEnvironmentalAttributes(player, addLog);
    enemies.forEach(enemy => {
        applyEnvironmentalAttributes(enemy, addLog);
    });

    // Initialize round management (using legacy interface for compatibility)
    const roundManager = createTurnManager(player, enemies);
    
    // Set up round completion callback for logging - use forceRoundCompletion
    roundManager.setRoundCompleteCallback(() => {
        // Force the logger to complete the current round
        forceRoundCompletion();
        
        // Advance time for battle round
        advanceTimeForBattleRound();
    });

    // Initialize ability tracking
    const { abilityCooldowns, abilityUsesLeft } = initializeAbilityTracking(player);
    
    // Combo system tracking
    let lastPlayerAbility = null;
    let lastEnemyAbilities = {}; // Track last ability per enemy for combos
    let currentTurnNumber = 0;

    // Battle state object for ability functions
    const battleState = {
        player,
        abilityCooldowns,
        abilityUsesLeft,
        lastPlayerAbility,
        lastEnemyAbilities,
        enemies,
        isSurvivalBattle,
        survivalTurnsLeft: battleConfig.survivalTurns || 0,
        currentTurnNumber
    };

    // Make battleState globally accessible for turn management
    window.battleState = battleState;

    modal.style.display = "block";
    clearLogs();

    // Setup battle history
    setupBattleHistory();

    // Display battle type information
    if (isSurvivalBattle) {
        addLog(`🛡️ SURVIVAL BATTLE: Survive for ${battleConfig.survivalTurns} turns to win!`);
        addLog(`Objective: ${battleConfig.survivalObjective || "Hold your ground and don't fall!"}`);
    }

    if (enemies.length > 1) {
        const enemyNames = enemies.map(e => e.name).join(", ");
        addLog(`⚔️ OUTNUMBERED: Facing ${enemies.length} enemies - ${enemyNames}`);
        addLog(`Watch out for enemy combo attacks!`);
    }

    // Display environmental information if present and not neutral
    if (window.battleEnvironment && window.battleEnvironment.type !== "neutral") {
        const envType = window.battleEnvironment.type;
        const intensity = window.battleEnvironment.intensity;
        
        addLog(`⚠️ Battle Environment: ${envType.charAt(0).toUpperCase() + envType.slice(1)} (Intensity: ${intensity})`);
        addLog(`Environmental effects will occur each turn based on elemental types.`);
        
        // Show intensity-based warnings
        if (intensity >= 8) {
            if (envType === "volcanic") {
                addLog(`🔥 EXTREME INTENSITY: Non-resistant types will suffer severe penalties and status effects!`);
            } else if (envType === "underwater") {
                addLog(`🌊 DEEP UNDERWATER: Non-water types suffer massive speed penalties, pressure damage, and breath loss!`);
            } else if (envType === "storm") {
                addLog(`⚡ SEVERE STORM: Non-air types suffer major accuracy penalties, lightning strikes, and debris damage!`);
            } else if (envType === "cave") {
                addLog(`🕳️ ABYSSAL DEPTHS: Non-earth types suffer severe darkness penalties, rockfall, and frequent tripping!`);
            } else {
                addLog(`⚡ EXTREME INTENSITY: Non-resistant types will suffer severe penalties and status effects!`);
            }
        } else if (intensity >= 5) {
            if (envType === "volcanic") {
                addLog(`⚠️ HIGH INTENSITY: Non-resistant types will take damage and suffer attack penalties!`);
            } else if (envType === "underwater") {
                addLog(`💧 MEDIUM DEPTH: Non-water types will lose breath after 6 turns and move slower!`);
            } else if (envType === "storm") {
                addLog(`🌪️ HEAVY STORM: Non-air types suffer accuracy penalties and risk lightning strikes!`);
            } else if (envType === "cave") {
                addLog(`🪨 DEEP CAVES: Non-earth types suffer accuracy penalties, falling rocks, and tripping hazards!`);
            } else {
                addLog(`⚠️ HIGH INTENSITY: Non-resistant types will take damage and suffer attack penalties!`);
            }
        } else if (intensity >= 1) {
            if (envType === "underwater") {
                addLog(`🏊 SHALLOW WATER: Non-water types will have reduced movement speed.`);
            } else if (envType === "storm") {
                addLog(`💨 LIGHT STORM: Non-air types will have reduced accuracy and attack power.`);
            } else if (envType === "cave") {
                addLog(`🔦 DIM CAVES: Non-earth types will have reduced accuracy from poor visibility.`);
            } else {
                addLog(`💫 MILD INTENSITY: Non-resistant types will have reduced attack power.`);
            }
        }
        
        // Show specific environmental effects for current characters
        if (player.misc?.elementalAlignments) {
            const playerEnvEffect = calculateEnvironmentalDamage(player, envType, intensity);
            
            if (playerEnvEffect.hasImmunity) {
                addLog(`🌟 ${player.name}'s ${player.misc.elementalAlignments[0]} type is immune to ${envType} environments!`);
            } else if (playerEnvEffect.perTurnDamage > 0) {
                addLog(`⚠️ ${player.name}'s ${player.misc.elementalAlignments[0]} type will take ${playerEnvEffect.perTurnDamage} environmental damage per turn!`);
                if (playerEnvEffect.statusChance > 0) {
                    addLog(`🔥 ${playerEnvEffect.statusChance}% chance per turn of being affected by ${playerEnvEffect.statusType}!`);
                }
            }
        }
    }

    // Check if an ability can be used (considering cooldowns, uses, and combos)
    function canUseAbilityInBattle(abilityId, ability, targetEnemy = null) {
        // Update battleState with current values
        battleState.lastPlayerAbility = lastPlayerAbility;
        battleState.lastEnemyAbilities = lastEnemyAbilities;
        
        // For multi-enemy battles, use the first alive enemy if no specific target
        const enemy = targetEnemy || enemies.find(e => e.secondary.life > 0) || enemies[0];
        return canUseAbility(player, enemy, abilityId, ability, battleState);
    }

    // Use an ability (apply cooldown, reduce uses, and track for combos)
    function useAbilityInBattle(abilityId, ability, isPlayer = true, enemyIndex = 0) {
        // Update battleState with current values
        battleState.lastPlayerAbility = lastPlayerAbility;
        battleState.lastEnemyAbilities = lastEnemyAbilities;
        
        useAbility(abilityId, ability, battleState, isPlayer);
        
        // Update local variables from battleState
        lastPlayerAbility = battleState.lastPlayerAbility;
        if (!isPlayer && enemies[enemyIndex]) {
            lastEnemyAbilities[enemies[enemyIndex].id || enemyIndex] = battleState.lastEnemyAbility;
        }
    }

    // Process enemy loot drops
    function processLootDrops(enemy, addLog) {
        if (!enemy.loot || !Array.isArray(enemy.loot)) return [];
        
        const lootReceived = [];
        
        for (const lootDrop of enemy.loot) {
            const roll = Math.random();
            if (roll < lootDrop.chance) {
                const lootItem = getLootById(lootDrop.item);
                if (lootItem) {
                    addLoot(lootDrop.item, 1);
                    lootReceived.push({
                        name: lootItem.name,
                        quantity: 1
                    });
                    if (addLog) addLog(`Found: ${lootItem.name}!`);
                }
            }
        }
        
        return lootReceived;
    }

    // Clean up all mount partnerships for battle end
    function cleanupAllMountPartnerships() {
        // Clean up player mount partnerships
        if (player.mountPartner) {
            player.mountPartner = null;
        }
        if (player.riders) {
            delete player.riders;
        }
        
        // Clean up enemy mount partnerships
        enemies.forEach(enemy => {
            if (enemy.mountPartner) {
                enemy.mountPartner = null;
            }
            if (enemy.riderPartner) {
                enemy.riderPartner = null;
            }
            if (enemy.riders) {
                delete enemy.riders;
            }
        });
    }

    // shows the result of the battle
    function showResult(result) {
        // Clean up all mount partnerships when battle ends
        cleanupAllMountPartnerships();
        
        // Clean up all trapped statuses when battle ends
        cleanupAllTrappedStatuses();
        
        // Clean up battle-specific statuses (endsWithBattle=true)
        removeStatusAtEnd(player, addLog);
        enemies.forEach(enemy => removeStatusAtEnd(enemy, addLog));
        
        actionsDiv.innerHTML = "";
        let summary = result === "win" ? "Victory!" : 
                     result === "survival_win" ? "Survival Success!" :
                     result === "lose" ? "Defeat!" : 
                     result === "escape" ? "Escaped!" : "Battle Ended";

        // Complete the battle and send all rounds to history as one entry
        if (typeof window.addBattleToHistory === "function") {
            const enemyNames = enemies.length > 1 ? 
                enemies.map(e => e.name).join(" & ") : 
                enemies[0]?.name || "Unknown Enemy";
            
            // Use the new completeBattle function to send all rounds at once
            completeBattle(window.addBattleToHistory, enemyNames, summary);
        }

        const logDiv = document.getElementById("combat-log");
        const rewardsDiv = document.getElementById("combat-rewards");

        if (result === "win" || result === "survival_win") {
            // Show rewards in the dedicated rewards area
            rewardsDiv.style.display = "block";
            let rewardsHTML = result === "survival_win" ? 
                '<h3>Survival Rewards!</h3>' : 
                '<h3>Victory Rewards!</h3>';
            
            // Calculate total EXP and process loot from all enemies
            let totalExp = 0;
            const allLootReceived = [];
            
            if (result === "win") {
                // Regular victory - process all defeated enemies
                enemies.forEach(enemy => {
                    const lootReceived = processLootDrops(enemy, () => {}); // Don't add to log, collect for display
                    if (lootReceived && lootReceived.length > 0) {
                        allLootReceived.push(...lootReceived);
                    }
                    totalExp += enemy.exp || Math.floor(Math.random() * 10 + 10);
                });
            } else {
                // Survival victory - reduced rewards
                totalExp = Math.floor(enemies.reduce((sum, e) => sum + (e.exp || 10), 0) * 0.6);
                rewardsHTML += '<p>Survival bonuses apply to rewards!</p>';
            }
            
            // Add EXP to rewards display
            rewardsHTML += `<div class="reward-item exp-reward">Gained ${totalExp} EXP</div>`;
            
            // Add loot to rewards display
            if (allLootReceived && allLootReceived.length > 0) {
                allLootReceived.forEach(loot => {
                    rewardsHTML += `<div class="reward-item loot-reward">Found: ${loot.name} x${loot.quantity}</div>`;
                });
            }
            
            rewardsDiv.innerHTML = rewardsHTML;
            
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                const leveledUp = addExp(player, totalExp);
                if (typeof window.updateCharacterUI === "function") window.updateCharacterUI();
                if (leveledUp) {
                    // Add level up message to rewards
                    rewardsDiv.innerHTML += `<div class="reward-item level-up">🌟 Level Up! You are now level ${player.level}! 🌟</div>`;
                    // Give a moment to see the level up message
                    setTimeout(() => {
                        // Clean up environmental effects
                        cleanupEnvironmentalEffects(player, addLog);
                        enemies.forEach(enemy => cleanupEnvironmentalEffects(enemy, addLog));
                        modal.style.display = "none";
                        onBattleEnd(result === "survival_win" ? "survival_win" : "win");
                    }, 2000);
                } else {
                    // Clean up environmental effects
                    cleanupEnvironmentalEffects(player, addLog);
                    enemies.forEach(enemy => cleanupEnvironmentalEffects(enemy, addLog));
                    modal.style.display = "none";
                    onBattleEnd(result === "survival_win" ? "survival_win" : "win");
                }
            };
            actionsDiv.appendChild(contBtn);
        } else if (result === "escape") {
            logDiv.innerHTML += `<div style="color:orange;font-weight:bold;">You escaped!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                // Clean up environmental effects
                cleanupEnvironmentalEffects(player, addLog);
                enemies.forEach(enemy => cleanupEnvironmentalEffects(enemy, addLog));
                modal.style.display = "none";
                onBattleEnd("escape");
            };
            actionsDiv.appendChild(contBtn);
        } else if (result === "lose") {
            logDiv.innerHTML += `<div style="color:red;font-weight:bold;">You died!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Respawn";
            contBtn.onclick = () => {
                // Handle respawn logic here
                const respawnNodes = window.storyData?.respawn || window.selectedStory?.respawn || [];
                let respawnNode = "start";
                
                if (respawnNodes.length > 0) {
                    respawnNode = respawnNodes[Math.floor(Math.random() * respawnNodes.length)];
                }
                
                console.log(`💀 Player died. Respawning at: ${respawnNode}`, respawnNodes);
                
                // Set player life to half of max life
                player.secondary.life = Math.floor(player.maxLife / 2);
                player.life = player.secondary.life; // Sync compatibility layer
                
                console.log(`❤️ Player respawned with ${player.secondary.life}/${player.maxLife} life`);
                
                // Update character stats
                if (typeof window.updateSecondaryStats === "function") {
                    window.updateSecondaryStats(player, true);
                }
                if (typeof window.updateCharacterUI === "function") {
                    window.updateCharacterUI();
                }
                
                // Clean up environmental effects
                cleanupEnvironmentalEffects(player, addLog);
                enemies.forEach(enemy => cleanupEnvironmentalEffects(enemy, addLog));
                modal.style.display = "none";
                
                // Go to respawn node
                onBattleEnd(respawnNode);
            };
            actionsDiv.appendChild(contBtn);
        }
    }

    // Main turn function
    function nextTurn() {
        // Increment turn counter
        currentTurnNumber++;
        battleState.currentTurnNumber = currentTurnNumber;
        
        // Check survival battle condition first
        if (isSurvivalBattle) {
            battleState.survivalTurnsLeft = battleConfig.survivalTurns - currentTurnNumber;
            if (currentTurnNumber >= battleConfig.survivalTurns) {
                addLog(`🎉 SURVIVAL SUCCESS: You survived ${battleConfig.survivalTurns} turns!`);
                return showResult("survival_win");
            }
            // Show remaining turns
            if (battleState.survivalTurnsLeft <= 3) {
                addLog(`⏰ Survival: ${battleState.survivalTurnsLeft} turns remaining!`);
            }
        }
        
        // Update round state
        roundManager.nextTurn(battleState, addLog, battleEnvironment, addLog);
        
        // Update battle stats for all enemies (alive and dead for display)
        const aliveEnemies = enemies.filter(e => e.secondary.life > 0);
        updateBattleStatsMulti(player, enemies); // Show all enemies including dead ones

        // Check win/lose conditions
        if (player.secondary.life <= 0) return showResult("lose");
        
        // Check if all enemies are defeated (only for non-survival battles)
        if (!isSurvivalBattle && aliveEnemies.length === 0) {
            return showResult("win");
        }

        const turnInfo = roundManager.getTurnInfo();
        actionsDiv.innerHTML = "";


        if (turnInfo.playerTurn) {
            // Don't clear round actions when player turn starts - let them read what happened
            // Round actions will be cleared when player makes their choice

            handlePlayerTurn(turnInfo);
        } else {

            handleEnemyTurnAI(turnInfo, aliveEnemies, player, enemies, roundManager, addLog, addRecentAction, nextTurn, battleState, lastEnemyAbilities);
        }
    }

    // Update battle stats for multi-enemy battles
    function updateBattleStatsMulti(player, allEnemies) {
        const aliveEnemies = allEnemies.filter(e => e.secondary.life > 0);
        
        if (allEnemies.length === 1) {
            // Single enemy - use original function
            updateBattleStats(player, allEnemies[0]);
        } else {
            // Multiple enemies - create combined display
            const playerStats = document.getElementById("combat-player-stats");
            const enemyStats = document.getElementById("combat-enemy-stats");

            // Player display (same as before)
            const playerImageHtml = player.imagePath
                ? `<div style="display: flex; align-items: center;width: 100%; justify-content: space-between;">
                     <img src="${player.imagePath}" alt="${player.name}" 
                       style="width: 180px; object-fit: cover; border-radius: 8px; margin-right: 15px;" 
                       onerror="this.style.display='none';">
                     <div style="flex: 1;display: flex; flex-direction: column;align-items: center;">
                       <div><b>${player.name}</b></div>
                       <div>HP: ${player.secondary.life}/${player.secondary.maxLife}</div>
                       <div>MP: ${player.secondary.mp}/${player.secondary.maxMp}</div>
                       <div>Status: ${statusSummary(player)}</div>
                     </div>
                   </div>`
                : `<div><b>${player.name}</b> <span>HP: ${player.secondary.life}/${player.secondary.maxLife}</span> <span>MP: ${player.secondary.mp}/${player.secondary.maxMp}</span> <span>Status: ${statusSummary(player)}</span></div>`;

            // Multi-enemy display - show ALL enemies (alive and dead)
            const enemiesHtml = allEnemies.map((enemy, index) => {
                const isDead = enemy.secondary.life <= 0;
                const enemyClass = isDead ? 'defeated-enemy' : '';
                const deadLabel = isDead ? ' ⚰️ DEAD' : '';
                return `<div class="${enemyClass}" style="display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 8px; margin: 4px; border-radius: 4px; ${isDead ? 'opacity: 0.5; background-color: #2a2a2a;' : ''}">
                    <div><b>${enemy.name}${deadLabel}</b> <span>HP: ${enemy.secondary.life}/${enemy.secondary.maxLife}</span></div>
                    <div>Status: ${statusSummary(enemy)}</div>
                </div>`;
            }).join('');

            playerStats.innerHTML = playerImageHtml;
            enemyStats.innerHTML = `<div>${enemiesHtml}</div>`;
        }
    }

    // Handle player turn
    function handlePlayerTurn(turnInfo) {

        
        if (!turnInfo.canPlayerAct) {

            addLog(`${player.name} is unable to move!`);
            lastPlayerAbility = null; // Reset combo when player can't act
            roundManager.switchTurn();
            setTimeout(nextTurn, 1000);
            return;
        }


        // Create ability and item buttons
        const aliveEnemies = enemies.filter(e => e.secondary.life > 0);
        const abilityDiv = createAbilityButtons(player, aliveEnemies[0], battleState, handleAbilityUse);
        const consumablesDiv = createConsumableButtons(player, handleItemUse);
        const escapeDiv = createEscapeButton(player, aliveEnemies[0], handleEscape, handleStruggle);



        // Add target selection for multi-enemy battles
        if (aliveEnemies.length > 1) {
            const targetDiv = document.createElement("div");
            targetDiv.className = "target-selection";
            targetDiv.innerHTML = '<h4>Select Target:</h4>';
            
            aliveEnemies.forEach((enemy, index) => {
                const targetBtn = document.createElement("button");
                targetBtn.textContent = `${enemy.name} (${enemy.secondary.life}/${enemy.secondary.maxLife} HP)`;
                targetBtn.onclick = () => {
                    // Update selected target
                    window.selectedTarget = enemy;
                    window.selectedTargetIndex = enemies.indexOf(enemy);
                    
                    // Update button visual feedback
                    targetDiv.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                    targetBtn.classList.add('selected');
                };
                
                // Select first target by default
                if (index === 0) {
                    targetBtn.classList.add('selected');
                    window.selectedTarget = enemy;
                    window.selectedTargetIndex = enemies.indexOf(enemy);
                }
                
                targetDiv.appendChild(targetBtn);
            });
            
            actionsDiv.appendChild(targetDiv);
        } else {
            // Single enemy - set as default target
            window.selectedTarget = aliveEnemies[0];
            window.selectedTargetIndex = 0;
        }

        // Setup action buttons
        setupActionButtons(actionsDiv, abilityDiv, consumablesDiv);
        
        // Add containers to actions div
        actionsDiv.appendChild(abilityDiv);
        actionsDiv.appendChild(consumablesDiv);
        actionsDiv.appendChild(escapeDiv);
    }

    // Handle ability use
    function handleAbilityUse(abilityId, ability) {
        if ((ability.mpCost || 0) > player.secondary.mp) return;
        if (!canUseAbilityInBattle(abilityId, ability)) return;
        
        player.secondary.mp -= ability.mpCost || 0;
        useAbilityInBattle(abilityId, ability, true);

        // Initialize action tracking for this ability use
        const target = window.selectedTarget || enemies.filter(e => e.secondary.life > 0)[0] || enemies[0];
        let actionResults = {
            hit: false,
            damage: 0,
            isCritical: false,
            isOverkill: false,
            statusEffects: []
        };
        
        // Store current action tracking globally for executePlayerAbility to use
        window.currentActionResults = actionResults;

        // Store current log state to capture this action's messages
        const actionMessages = [];
        const captureLog = (message) => {
            addLog(message);
            actionMessages.push(message);
        };
        
        executePlayerAbility(ability, abilityId, captureLog);
        
        // Create action data for logging with captured results
        const actionData = createActionData(
            player.name,
            ability.name,
            target?.name || "Enemy",
            actionMessages,
            window.currentActionResults || actionResults,
            ability // Pass the ability object for image support
        );
        addRecentAction(actionData);
        
        // Clean up global tracking
        window.currentActionResults = null;
        
        // Update battle stats for multi-enemy battles
        updateBattleStatsMulti(player, enemies);
        // Don't call switchTurn() and nextTurn() here - executePlayerAbility already handles it
    }

    // Handle item use
    function handleItemUse(itemId, itemDef) {
        if (itemDef.use(player)) {
            removeItem(itemId, 1);
            addLog(`${player.name} used ${itemDef.name}!`);
            updateBattleStatsMulti(player, enemies);
            roundManager.switchTurn();
            nextTurn();
        } else {
            addLog(`Can't use ${itemDef.name} right now!`);
        }
    }

    // Handle escape attempt
    function handleEscape() {
        const escapeResult = handleEscapeAttempt(player, enemy);
        
        // Add to recent actions display
        const escapeActionData = createActionData(
            player.name,
            "Escape",
            "battlefield",
            escapeResult.messages,
            { hit: escapeResult.success }
        );
        addRecentAction(escapeActionData);
        
        if (escapeResult.success) {
            return showResult("escape");
        } else {
            // Mark that player has acted this round (failed escape attempt)
            roundManager.markCharacterActed(true);
            
            roundManager.switchTurn();
            setTimeout(nextTurn, 1000);
        }
    }

    // Handle struggle attempt
    function handleStruggle() {
        // Get the pinned status definition
        const pinnedStatusDef = StatusRegistry['pinned'];
        if (!pinnedStatusDef) {
            addLog('Error: Cannot struggle - pinned status not found!');
            return;
        }

        // Capture detailed struggle logs for recent action display
        const struggleMessages = [];
        const captureLog = (message) => {
            addLog(message); // Still add to main battle log
            struggleMessages.push(message); // Also capture for recent action
        };

        // Use the new status-based struggle system
        const result = attemptBreakFree(player, captureLog);
        const success = result.success;
        
        // Add the result messages
        result.messages.forEach(msg => struggleMessages.push(msg));
        
        // Add the final result message
        const resultMessage = success ? 
            `${player.name} breaks free from ${pinnedStatusDef.name}!` : 
            `${player.name} fails to break free and wastes their turn.`;
        
        struggleMessages.push(resultMessage);
        
        // Add to recent actions display with all the detailed messages
        const struggleActionData = createActionData(
            player.name,
            "Struggle",
            enemy.name,
            struggleMessages,
            { hit: success }
        );
        addRecentAction(struggleActionData);
        
        if (success) {
            // Remove pinned status using new status system
            removeStatus(player, 'pinned', addLog);
        }
        
        // Mark that player has acted this round
        roundManager.markCharacterActed(true);
        
        // Continue the battle - switch turn and proceed
        roundManager.switchTurn();
        setTimeout(nextTurn, 1000);
    }

    // Execute player ability
    function executePlayerAbility(ability, abilityId, logger = addLog) {
        // Check if player should dismount when using close range attacks (except mount ability)
        if (abilityId !== 'mount' && (ability.range === 'close' || ability.type === 'physical') && player.mountPartner) {
            logger(`${player.name} dismounts to use ${ability.name}!`);
            removeMountPartnership(player, player.mountPartner, logger, false); // No stun for voluntary dismount
        }
        
        const turnInfo = roundManager.getTurnInfo();
        
        // Determine target based on ability range
        let target;
        if (ability.range === 'self') {
            target = player;
        } else {
            target = window.selectedTarget || enemies.filter(e => e.secondary.life > 0)[0] || enemies[0];
        }

        if (ability.type === "physical" || ability.type === "magic") {
            // For self-targeting abilities, adjust the log message
            if (ability.range === 'self') {
                logger(`${player.name} used ${ability.name} on themselves`);
            } else {
                logger(`${player.name} used ${ability.name} on ${target.name}`);
            }
            
            // Log ability description if available
            if (ability.description) {
                logger(ability.description);
            }
            
            // ✨ NEW: Check modular battle interactions FIRST (before accuracy check)
            const battleResult = handleModularBattleInteractions(ability, player, target, logger);
            if (!battleResult.canHit) {
                // Update action results - IMMUNITY MISS
                if (window.currentActionResults) {
                    window.currentActionResults.hit = false;
                }
                logger(`${player.name}'s ${ability.name} cannot reach ${target.name}!`);
                return; // Attack cannot reach target due to range immunity
            }

            // 🎯 PLAYER ATTACK HIT DETECTION - Calculate accuracy and roll for hit/miss
            const playerSpeed = player.secondaryAttributes?.speed || player.secondary?.speed || player.speed || 0;
            const targetSpeed = target.secondaryAttributes?.speed || target.secondary?.speed || target.speed || 0;
            const accuracy = calculateAccuracy(ability, player, target, playerSpeed, targetSpeed, 1.0);
            const roll = Math.floor(Math.random() * 100) + 1;
            

            
            // 🎯 HIT CHECK: Roll must be <= accuracy to hit (minimum 30% chance guaranteed)
            if (roll <= accuracy) {
                // Update action results - HIT
                if (window.currentActionResults) {
                    window.currentActionResults.hit = true;
                }
                
                logAttackResult(true, ability, player.name, logger);
                
                // Log any interaction messages
                battleResult.messages.forEach(msg => logger(msg));

                // Calculate all damage using the organized formula
                let damageInfo = calculateDamage(ability, player, target);
                
                // Apply environmental modifications to ability
                const envModification = modifyAbilityByEnvironment(ability, player, target, damageInfo.finalDamage, ability.accuracy || 100);
                if (envModification.alwaysMiss) {
                    logger(`${ability.name} always misses in this environment!`);
                    logAttackResult(false, ability, player.name, logger);
                    nextTurn(); // Move to next turn since ability missed
                    return;
                }
                if (envModification.damage !== damageInfo.finalDamage) {
                    damageInfo.finalDamage = envModification.damage;
                    logger(`Environmental effects modify ${ability.name} damage!`);
                }
                
                // Apply any damage multipliers from modular interactions (e.g., swoop down)
                if (battleResult.damageMultiplier !== 1.0) {
                    damageInfo.finalDamage = Math.floor(damageInfo.finalDamage * battleResult.damageMultiplier);
                    logger(`Battle modifier applied: ${battleResult.damageMultiplier}x damage!`);
                }
                
                // Log type effectiveness message only
                if (damageInfo.typeEffectivenessText) {
                    logger(damageInfo.typeEffectivenessText);
                }
                
                // Log environmental effect message if present
                if (damageInfo.environmentalEffectText) {
                    logger(damageInfo.environmentalEffectText);
                }
                
                // Apply critical hit to the final damage
                const critInfo = calculateCriticalHit(ability, player, damageInfo.finalDamage, true);
                
                // ✨ NEW: Final damage (fall damage now handled in applyDamage automatically)
                const finalDamage = critInfo.finalDamage;
                
                // Update action results with damage and crit info
                if (window.currentActionResults) {
                    window.currentActionResults.damage = finalDamage;
                    window.currentActionResults.isCritical = critInfo.isCritical;
                }
                
                if (finalDamage > 0) {
                    const damageResult = applyDamage(target, finalDamage, ability, player, logger);
                    
                    // Update action results with overkill info
                    if (window.currentActionResults) {
                        window.currentActionResults.isOverkill = damageResult.isOverkill;
                    }
                    
                    logDamage(damageInfo, critInfo, ability, logger, finalDamage, damageResult.isOverkill);
                    
                    // ✨ Status effects (pinned, trapped) are now handled automatically by the modular system
                }

                // ✨ Handle status removal from modular interactions (e.g., flying -> swooping down)
                // This happens regardless of damage amount
                if (battleResult.shouldRemoveStatus) {
                    removeIsHighStatuses(player, logger);
                }

                // ✨ Check for forceful break-free from trapped status
                if (finalDamage > 0) {
                    handleForcefulBreakFree(player, target, logger);
                }

                // ✨ Status effects are now handled automatically by the modular system

                // Handle ability effects
                handleAbilityEffects(ability, player, target, logger, battleState);
            } else {
                // Update action results - MISS
                if (window.currentActionResults) {
                    window.currentActionResults.hit = false;
                }
                
                logAttackResult(false, ability, player.name, logger);
            }
        } else {
            // Non-damaging abilities (buffs, healing, etc.)
            // Update action results - these always "hit"
            if (window.currentActionResults) {
                window.currentActionResults.hit = true;
                window.currentActionResults.damage = 0; // No damage for buff/utility abilities
            }
            
            if (ability.range === 'self') {
                logger(`${player.name} used ${ability.name} on themselves`);
            } else {
                logger(`${player.name} used ${ability.name} on ${target.name}`);
            }
            
            // Log ability description if available
            if (ability.description) {
                logger(ability.description);
            }
            
            handleAbilityEffects(ability, player, target, logger, battleState);
        }

        // Mark that player has acted this round
        roundManager.markCharacterActed(true);
        
        roundManager.switchTurn();
        setTimeout(nextTurn, 1000);
    }

    // Start the battle
    nextTurn();
}


