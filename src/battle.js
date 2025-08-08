import { addExp, getExpForLevel } from './leveling.js';
import { getInventory, removeItem, addLoot } from './inventory.js';
import { updateSecondaryStats } from './character.js';
import { updateLifeBar } from './ui.js';
import { 
    applyStatus, 
    updateStatuses, 
    statusSummary, 
    isStatusActive, 
    isCharacterTrapped, 
    BuffRegistry,
    applyStunnedStatus
} from './status.js';
import { getAbilities, useAbility, canUseAbility } from './abilities.js';
import { getLootById } from './loot.js';
import './history.js'; // Ensure history module is loaded
import { getTypeMatchupDescription, calculateAbilityTypeBonus, getStatusEffectInteraction } from './types.js';
import { calculateEnvironmentalHealing, calculateEnvironmentalDamage } from './environmental.js';
import { calculateStatusBasedStruggle } from './special-effects.js';
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
    handleFlyingInteractions, 
    handleAbilityEffects,
    handlePinnedInteractions
} from './combat-calculations.js';
import { createBattleLogger, logDamage, logAttackResult } from './battle-logging.js';
import { 
    createTurnManager, 
    initializeAbilityTracking, 
    handleEscapeAttempt, 
    handleStruggleAttempt 
} from './turn-management.js';

// Starts a battle between the player and an enemy
export function startBattle(player, enemy, onBattleEnd, battleEnvironment = null) {
  
    const modal = document.getElementById("combat-modal");
    const actionsDiv = document.getElementById("combat-actions");

    // Set up global battle environment for damage calculations
    if (battleEnvironment) {
        if (typeof battleEnvironment === "string") {
            // Convert string environment to object format
            window.battleEnvironment = {
                type: battleEnvironment,
                intensity: getDefaultIntensity(battleEnvironment)
            };
        } else if (battleEnvironment.type) {
            // Use object format directly
            window.battleEnvironment = battleEnvironment;
        } else {
            window.battleEnvironment = null;
        }
    } else {
        window.battleEnvironment = null;
    }

    // Initialize battle logging
    const logger = createBattleLogger();
    const { addLog, addSystemMessage, addRecentAction, getBattleLogLength, getCurrentBattleLogMessages, separateLog, getGroupedLogs, clearLogs } = logger;

    // Initialize turn management
    const turnManager = createTurnManager(player, enemy);

    // Initialize ability tracking
    const { abilityCooldowns, abilityUsesLeft } = initializeAbilityTracking(player);
    
    // Combo system tracking
    let lastPlayerAbility = null;
    let lastEnemyAbility = null;

    // Battle state object for ability functions
    const battleState = {
        abilityCooldowns,
        abilityUsesLeft,
        lastPlayerAbility,
        lastEnemyAbility
    };

    modal.style.display = "block";
    clearLogs();

    // Setup battle history
    setupBattleHistory();

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
        if (player.type) {
            const playerEnvEffect = calculateEnvironmentalDamage(player, envType, intensity);
            
            if (playerEnvEffect.hasImmunity) {
                addLog(`🌟 ${player.name}'s ${player.type} type is immune to ${envType} environments!`);
            } else if (playerEnvEffect.perTurnDamage > 0) {
                addLog(`⚠️ ${player.name}'s ${player.type} type will take ${playerEnvEffect.perTurnDamage} environmental damage per turn!`);
                if (playerEnvEffect.statusChance > 0) {
                    addLog(`🔥 ${playerEnvEffect.statusChance}% chance per turn of being affected by ${playerEnvEffect.statusType}!`);
                }
            }
        }
    }

    // Check if an ability can be used (considering cooldowns, uses, and combos)
    function canUseAbilityInBattle(abilityId, ability) {
        // Update battleState with current values
        battleState.lastPlayerAbility = lastPlayerAbility;
        battleState.lastEnemyAbility = lastEnemyAbility;
        
        return canUseAbility(player, enemy, abilityId, ability, battleState);
    }

    // Use an ability (apply cooldown, reduce uses, and track for combos)
    function useAbilityInBattle(abilityId, ability, isPlayer = true) {
        // Update battleState with current values
        battleState.lastPlayerAbility = lastPlayerAbility;
        battleState.lastEnemyAbility = lastEnemyAbility;
        
        useAbility(abilityId, ability, battleState, isPlayer);
        
        // Update local variables from battleState
        lastPlayerAbility = battleState.lastPlayerAbility;
        lastEnemyAbility = battleState.lastEnemyAbility;
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

    // shows the result of the battle
    function showResult(result) {
        // Separate any remaining logs before ending battle
        separateLog();
        
        actionsDiv.innerHTML = "";
        let summary = result === "win" ? "Victory!" : result === "lose" ? "Defeat!" : result === "escape" ? "Escaped!" : "Battle Ended";

        // Add grouped log to history
        const logs = getGroupedLogs();
        
        if (typeof window.addBattleToHistory === "function") {
            window.addBattleToHistory(enemy.name, logs, summary);
        }

        const logDiv = document.getElementById("combat-log");
        const rewardsDiv = document.getElementById("combat-rewards");

        if (result === "win") {
            // Show rewards in the dedicated rewards area
            rewardsDiv.style.display = "block";
            let rewardsHTML = '<h3>Victory Rewards!</h3>';
            
            // Process loot drops and collect them for display
            const lootReceived = processLootDrops(enemy, () => {}); // Don't add to log, collect for display
            
            // Add EXP to rewards display
            const exp = enemy.exp || Math.floor(Math.random() * 10 + 10);
            rewardsHTML += `<div class="reward-item exp-reward">Gained ${exp} EXP</div>`;
            
            // Add loot to rewards display
            if (lootReceived && lootReceived.length > 0) {
                lootReceived.forEach(loot => {
                    rewardsHTML += `<div class="reward-item loot-reward">Found: ${loot.name} x${loot.quantity}</div>`;
                });
            }
            
            rewardsDiv.innerHTML = rewardsHTML;
            
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                const leveledUp = addExp(player, exp);
                if (typeof window.updateCharacterUI === "function") window.updateCharacterUI();
                if (leveledUp) {
                    // Add level up message to rewards
                    rewardsDiv.innerHTML += `<div class="reward-item level-up">🌟 Level Up! You are now level ${player.level}! 🌟</div>`;
                    // Give a moment to see the level up message
                    setTimeout(() => {
                        modal.style.display = "none";
                        onBattleEnd("win");
                    }, 2000);
                } else {
                    modal.style.display = "none";
                    onBattleEnd("win");
                }
            };
            actionsDiv.appendChild(contBtn);
        } else if (result === "escape") {
            logDiv.innerHTML += `<div style="color:orange;font-weight:bold;">You escaped!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                modal.style.display = "none";
                onBattleEnd("escape");
            };
            actionsDiv.appendChild(contBtn);
        } else if (result === "lose") {
            logDiv.innerHTML += `<div style="color:red;font-weight:bold;">You died!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                onBattleEnd("respawn");
            };
            actionsDiv.appendChild(contBtn);
        }
    }

    // Main turn function
    function nextTurn() {
        // Update turn state
        turnManager.nextTurn(battleState, addLog, battleEnvironment, addSystemMessage);
        updateBattleStats(player, enemy);

        if (player.life <= 0) return showResult("lose");
        if (enemy.life <= 0) return showResult("win");

        const turnInfo = turnManager.getTurnInfo();
        actionsDiv.innerHTML = "";

        if (turnInfo.playerTurn) {
            handlePlayerTurn(turnInfo);
        } else {
            handleEnemyTurn(turnInfo);
        }
    }

    // Handle player turn
    function handlePlayerTurn(turnInfo) {
        separateLog();
        
        if (!turnInfo.canPlayerAct) {
            addLog(`${player.name} is unable to move!`);
            lastPlayerAbility = null; // Reset combo when player can't act
            turnManager.switchTurn();
            setTimeout(nextTurn, 1000);
            return;
        }

        // Create ability and item buttons
        const abilityDiv = createAbilityButtons(player, enemy, battleState, handleAbilityUse);
        const consumablesDiv = createConsumableButtons(player, handleItemUse);
        const escapeDiv = createEscapeButton(player, enemy, handleEscape, handleStruggle);

        // Setup action buttons
        setupActionButtons(actionsDiv, abilityDiv, consumablesDiv);
        
        // Add containers to actions div
        actionsDiv.appendChild(abilityDiv);
        actionsDiv.appendChild(consumablesDiv);
        actionsDiv.appendChild(escapeDiv);
    }

    // Handle ability use
    function handleAbilityUse(abilityId, ability) {
        if ((ability.mpCost || 0) > player.mp) return;
        if (!canUseAbilityInBattle(abilityId, ability)) return;
        
        player.mp -= ability.mpCost || 0;
        player.mana = player.mp; // Keep in sync
        useAbilityInBattle(abilityId, ability, true);

        // Store current log state to capture this action's messages
        const beforeActionLogLength = getBattleLogLength();
        
        executePlayerAbility(ability, abilityId);
        
        // Capture messages from this action for recent display
        const actionMessages = getCurrentBattleLogMessages(beforeActionLogLength);
        addRecentAction(`${player.name} used ${ability.name}`, actionMessages);
        
        updateBattleStats(player, enemy);
        turnManager.switchTurn();
        nextTurn();
    }

    // Handle item use
    function handleItemUse(itemId, itemDef) {
        if (itemDef.use(player)) {
            removeItem(itemId, 1);
            addLog(`${player.name} used ${itemDef.name}!`);
            updateBattleStats(player, enemy);
            turnManager.switchTurn();
            nextTurn();
        } else {
            addLog(`Can't use ${itemDef.name} right now!`);
        }
    }

    // Handle escape attempt
    function handleEscape() {
        const escapeResult = handleEscapeAttempt(player, enemy);
        
        // Add to recent actions display
        addRecentAction(`${player.name} tried to escape`, escapeResult.messages);
        
        if (escapeResult.success) {
            return showResult("escape");
        } else {
            turnManager.switchTurn();
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

        // Use the new status-based struggle system with opponent data
        const success = calculateStatusBasedStruggle(player, pinnedStatusDef, captureLog, enemy);
        
        // Add the final result message
        const resultMessage = success ? 
            `${player.name} breaks free from ${pinnedStatusDef.name}!` : 
            `${player.name} fails to break free and wastes their turn.`;
        
        struggleMessages.push(resultMessage);
        
        // Add to recent actions display with all the detailed messages
        addRecentAction(`${player.name} struggled to break free`, struggleMessages);
        
        if (success) {
            // Remove pinned status using BuffRegistry
            BuffRegistry.removeBuff(player, 'pinned', addLog);
        }
        
        // Continue the battle - switch turn and proceed
        turnManager.switchTurn();
        setTimeout(nextTurn, 1000);
    }

    // Execute player ability
    function executePlayerAbility(ability, abilityId) {
        const turnInfo = turnManager.getTurnInfo();

        if (ability.type === "physical" || ability.type === "magic") {
            addLog(`${player.name} used ${ability.name}`);
            
            // 🎯 PLAYER ATTACK HIT DETECTION - Calculate accuracy and roll for hit/miss
            const accuracy = calculateAccuracy(ability, player, enemy, turnInfo.playerStats.effectiveSpeed, turnInfo.enemyStats.effectiveSpeed, turnInfo.playerStats.effectiveAccuracy);
            const roll = Math.floor(Math.random() * 100) + 1;
            
            // 🎯 HIT CHECK: Roll must be <= accuracy to hit (minimum 30% chance guaranteed)
            if (roll <= accuracy) {
                logAttackResult(true, ability, player.name, addLog);

                // Check flying interactions
                const flyingResult = handleFlyingInteractions(ability, player, enemy, addLog);
                if (!flyingResult.canHit) {
                    return;
                }

                // Check pinned interactions
                const pinnedResult = handlePinnedInteractions(ability, player, enemy, addLog);

                // Calculate all damage using the organized formula
                const damageInfo = calculateDamage(ability, player, enemy);
                
                // Log type effectiveness message only
                if (damageInfo.typeEffectivenessText) {
                    addLog(damageInfo.typeEffectivenessText);
                }
                
                // Log environmental effect message if present
                if (damageInfo.environmentalEffectText) {
                    addLog(damageInfo.environmentalEffectText);
                }
                
                // Apply critical hit to the final damage
                const critInfo = calculateCriticalHit(ability, player, damageInfo.finalDamage, true);
                
                // Apply extra damage from flying interactions (fall damage)
                const finalDamage = critInfo.finalDamage + flyingResult.extraDamage;
                
                if (finalDamage > 0) {
                    const damageResult = applyDamage(enemy, finalDamage, ability, player, addLog);
                    logDamage(damageInfo, critInfo, ability, addLog, finalDamage, damageResult.isOverkill);
                    
                    // Handle pinned status changes after successful hit
                    if (pinnedResult.shouldRemovePinFromAttacker) {
                        BuffRegistry.removeBuff(player, 'pinned', addLog);
                    }
                    if (pinnedResult.shouldStunTarget) {
                        applyStunnedStatus(player, enemy, addLog);
                    }
                }

                // Handle pinned status changes for target
                if (pinnedResult.shouldRemovePinFromTarget) {
                    BuffRegistry.removeBuff(enemy, 'pinned', addLog);
                }

                // Handle ability effects
                handleAbilityEffects(ability, player, enemy, addLog);
            } else {
                logAttackResult(false, ability, player.name, addLog);
            }
        } else if (ability.type === "heal") {
            player.life = Math.min(player.maxLife, player.life + ability.amount);
            addLog(`${player.name} heals for ${ability.amount} HP!`);
        } else if (ability.type === "buff") {
            // Use the new modular buff system
            if (ability.apply) {
                // New system - ability handles its own application
                ability.apply(player, player, addLog);
            } else {
                console.error(`Buff ability ${ability.name} has no apply function - cannot be used`);
                addLog(`${ability.name} cannot be used - missing application logic!`);
            }
        }
    }

    // Handle enemy turn
    function handleEnemyTurn(turnInfo) {
        separateLog();
        setTimeout(() => {
            // Check if enemy can act (not stunned)
            if (!turnInfo.canEnemyAct) {
                addLog(`${enemy.name} is stunned and cannot act!`);
                addRecentAction(`${enemy.name} is stunned`, [`${enemy.name} cannot act due to being stunned!`]);
                turnManager.switchTurn();
                nextTurn();
                return;
            }

            const enemyAbilities = getAbilities(enemy.abilityIds || []);
            
            // Select enemy ability (weighted random based on preferences)
            const selectedAbilityId = selectEnemyAbility(enemy, enemyAbilities);
            const ability = enemyAbilities[selectedAbilityId];
            
            // Track enemy ability usage for combo system
            lastEnemyAbility = selectedAbilityId;
            
            addLog(`${enemy.name} used ${ability.name}`);

            // Store current log state to capture this action's messages
            const beforeActionLogLength = getBattleLogLength();

            // Execute enemy ability
            executeEnemyAbility(ability, turnInfo);
            
            // Capture messages from this action for recent display
            const actionMessages = getCurrentBattleLogMessages(beforeActionLogLength);
            addRecentAction(`${enemy.name} used ${ability.name}`, actionMessages);
            
            turnManager.switchTurn();
            nextTurn();
        }, 1000);
    }

    // Execute enemy ability
    function executeEnemyAbility(ability, turnInfo) {
        // Check flying interactions first
        const flyingResult = handleFlyingInteractions(ability, enemy, player, addLog);
        if (!flyingResult.canHit) {
            return;
        }

        // Check pinned interactions
        const pinnedResult = handlePinnedInteractions(ability, enemy, player, addLog);

        // 🎯 ENEMY ATTACK HIT DETECTION - Calculate accuracy and roll for hit/miss
        const accuracy = calculateAccuracy(ability, enemy, player, turnInfo.enemyStats.effectiveSpeed, turnInfo.playerStats.effectiveSpeed, turnInfo.enemyStats.effectiveAccuracy);
        const roll = Math.floor(Math.random() * 100) + 1;

        // 🎯 HIT CHECK: Roll must be <= accuracy to hit (minimum 30% chance guaranteed)
        if (roll <= accuracy) {
            if (ability.type === "physical" || ability.type === "magic") {
                // Calculate all damage using the organized formula  
                const damageInfo = calculateDamage(ability, enemy, player);
                
                // Log type effectiveness message only
                if (damageInfo.typeEffectivenessText) {
                    addLog(damageInfo.typeEffectivenessText);
                }
                
                // Log environmental effect message if present
                if (damageInfo.environmentalEffectText) {
                    addLog(damageInfo.environmentalEffectText);
                }
                
                // Apply critical hit to the final damage
                const critInfo = calculateCriticalHit(ability, enemy, damageInfo.finalDamage, false);
                
                // Apply extra damage from flying interactions (fall damage)
                const finalDamage = critInfo.finalDamage + flyingResult.extraDamage;
                
                if (finalDamage > 0) {
                    const damageResult = applyDamage(player, finalDamage, ability, enemy, addLog);
                    logDamage(damageInfo, critInfo, ability, addLog, finalDamage, damageResult.isOverkill);
                    
                    // Handle pinned status changes after successful hit
                    if (pinnedResult.shouldRemovePinFromAttacker) {
                        BuffRegistry.removeBuff(enemy, 'pinned', addLog);
                    }
                    if (pinnedResult.shouldStunTarget) {
                        applyStunnedStatus(enemy, player, addLog);
                    }
                }

                // Handle pinned status changes for target
                if (pinnedResult.shouldRemovePinFromTarget) {
                    BuffRegistry.removeBuff(player, 'pinned', addLog);
                }
            }

            // Handle ability effects
            handleAbilityEffects(ability, enemy, player, addLog);
        } else {
            addLog(`${enemy.name} uses ${ability.name} but you dodge!`);
        }
    }

    // Select enemy ability using weighted random
    function selectEnemyAbility(enemy, enemyAbilities) {
        // Filter available abilities based on status requirements
        const availableAbilityIds = (enemy.abilityIds || []).filter(abilityData => {
            const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
            const ability = enemyAbilities[abilityId];
            if (!ability) return false;
            
            if (ability.requiresStatusSelf && !isStatusActive(enemy, ability.requiresStatusSelf)) return false;
            if (ability.requiresStatusTarget && !isStatusActive(player, ability.requiresStatusTarget)) return false;
            if (ability.requiresStatus && !isStatusActive(player, ability.requiresStatus)) return false;
            
            return true;
        });
        
        // Fallback if no abilities are available
        if (availableAbilityIds.length === 0) {
            availableAbilityIds.push(...(enemy.abilityIds || []));
        }

        // Weighted random selection
        let weighted = [];
        const rateWeights = { 'preferred': 5, 'frequent': 4, 'normal': 3, 'rare': 2, 'super-rare': 1 };
        
        availableAbilityIds.forEach(abilityData => {
            let abilityId, rate;
            if (typeof abilityData === 'string') {
                abilityId = abilityData;
                rate = 'normal';
            } else {
                abilityId = abilityData.id;
                rate = abilityData.rate || 'normal';
            }
            
            const weight = rateWeights[rate] || 3;
            for (let i = 0; i < weight; i++) {
                weighted.push(abilityId);
            }
        });
        
        return weighted[Math.floor(Math.random() * weighted.length)];
    }

    // Start the battle
    nextTurn();
}

/**
 * Get default intensity for environment types
 * @param {string} environmentType - The environment type
 * @returns {number} Default intensity value
 */
function getDefaultIntensity(environmentType) {
    const defaultIntensities = {
        volcanic: 5,
        underwater: 4,
        storm: 5,
        cave: 4,
        neutral: 1
    };
    
    return defaultIntensities[environmentType] || 3;
}
