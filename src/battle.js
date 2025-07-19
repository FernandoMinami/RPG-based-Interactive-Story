import { addExp, getExpForLevel } from './leveling.js';
import { getInventory, removeItem } from './inventory.js';
import { updateSecondaryStats } from './character.js';
import { updateLifeBar } from './ui.js';
import { applyStatus, statusSummary, isStatusActive, StatusRegistry } from './status.js';
import { getAbilities, useAbility, canUseAbility } from './abilities.js';
import './history.js'; // Ensure history module is loaded
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
export function startBattle(player, enemy, onBattleEnd) {
    console.log("Starting battle. StatusRegistry:", Object.keys(StatusRegistry));
    
    const modal = document.getElementById("combat-modal");
    const actionsDiv = document.getElementById("combat-actions");

    // Initialize battle logging
    const logger = createBattleLogger();
    const { addLog, addRecentAction, getBattleLogLength, getCurrentBattleLogMessages, separateLog, getGroupedLogs, clearLogs } = logger;

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

        if (result === "win") {
            logDiv.innerHTML += `<div style="color:green;font-weight:bold;">You won!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                const exp = enemy.exp || Math.floor(Math.random() * 10 + 10);
                const leveledUp = addExp(player, exp);
                if (typeof window.updateCharacterUI === "function") window.updateCharacterUI();
                if (leveledUp) {
                    logDiv.innerHTML += `<div style="color:gold;font-weight:bold;">Level Up! You are now level ${player.level}!</div>`;
                }
                modal.style.display = "none";
                onBattleEnd("win");
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
        turnManager.nextTurn(battleState, addLog);
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
        if ((ability.mpCost || 0) > player.mana) return;
        if (!canUseAbilityInBattle(abilityId, ability)) return;
        
        player.mana -= ability.mpCost || 0;
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
        if (handleEscapeAttempt(player, enemy, addLog)) {
            return showResult("escape");
        } else {
            turnManager.switchTurn();
            setTimeout(nextTurn, 1000);
        }
    }

    // Handle struggle attempt
    function handleStruggle() {
        if (handleStruggleAttempt(player, enemy, addLog)) {
            applyStatus(player, 'pinned', 0);
        }
        turnManager.switchTurn();
        setTimeout(nextTurn, 1000);
    }

    // Execute player ability
    function executePlayerAbility(ability, abilityId) {
        const turnInfo = turnManager.getTurnInfo();

        if (ability.type === "physical" || ability.type === "magic") {
            addLog(`${player.name} used ${ability.name}`);
            
            const accuracy = calculateAccuracy(ability, turnInfo.playerStats.effectiveSpeed, turnInfo.enemyStats.effectiveSpeed, turnInfo.playerStats.effectiveAccuracy);
            const roll = Math.floor(Math.random() * 100) + 1;
            
            if (roll <= accuracy) {
                logAttackResult(true, ability, player.name, addLog);

                // Check flying interactions
                const flyingResult = handleFlyingInteractions(ability, player, enemy, addLog);
                if (!flyingResult.canHit) {
                    return;
                }

                // Check pinned interactions
                const pinnedResult = handlePinnedInteractions(ability, player, enemy, addLog);

                // Calculate damage
                const damageInfo = calculateDamage(ability, player, enemy);
                const critInfo = calculateCriticalHit(ability, player, damageInfo.finalDamage, true);
                
                // Apply diving attack multiplier if flying
                let adjustedDamage = critInfo.finalDamage;
                if (flyingResult.damageMultiplier > 1.0) {
                    adjustedDamage = Math.floor(critInfo.finalDamage * flyingResult.damageMultiplier);
                }
                
                // Apply extra damage from flying interactions
                const finalDamage = adjustedDamage + flyingResult.extraDamage;
                
                if (finalDamage > 0) {
                    applyDamage(enemy, finalDamage, ability, player, addLog);
                    logDamage({...damageInfo, finalDamage}, critInfo, ability, addLog);
                    
                    // Handle pinned status changes after successful hit
                    if (pinnedResult.shouldRemovePinFromAttacker) {
                        applyStatus(player, 'pinned', 0);
                    }
                    if (pinnedResult.shouldStunTarget) {
                        applyStatus(enemy, 'stunned', 1, addLog);
                    }
                }

                // Handle pinned status changes for target
                if (pinnedResult.shouldRemovePinFromTarget) {
                    applyStatus(enemy, 'pinned', 0);
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
            if (!player.activeBoosts[ability.attribute] || player.activeBoosts[ability.attribute].turns <= 0) {
                player.attributes[ability.attribute] += ability.amount;
                player.activeBoosts[ability.attribute] = {
                    amount: ability.amount,
                    turns: ability.turns
                };
                if (typeof window.updateSecondaryStats === "function") window.updateSecondaryStats(player);
                addLog(`${player.name} uses ${ability.name} and gains +${ability.amount} ${ability.attribute} for ${ability.turns} turns!`);
            } else {
                addLog(`${ability.name} is already active!`);
            }
        }
    }

    // Handle enemy turn
    function handleEnemyTurn(turnInfo) {
        separateLog();
        setTimeout(() => {
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

        const accuracy = calculateAccuracy(ability, turnInfo.enemyStats.effectiveSpeed, turnInfo.playerStats.effectiveSpeed, turnInfo.enemyStats.effectiveAccuracy);
        const roll = Math.floor(Math.random() * 100) + 1;

        if (roll <= accuracy) {
            logAttackResult(true, ability, enemy.name, addLog);

            if (ability.type === "physical" || ability.type === "magic") {
                // Calculate damage
                const damageInfo = calculateDamage(ability, enemy, player);
                const critInfo = calculateCriticalHit(ability, enemy, damageInfo.finalDamage, false);
                
                // Apply diving attack multiplier if flying
                let adjustedDamage = critInfo.finalDamage;
                if (flyingResult.damageMultiplier > 1.0) {
                    adjustedDamage = Math.floor(critInfo.finalDamage * flyingResult.damageMultiplier);
                }
                
                // Apply extra damage from flying interactions
                const finalDamage = adjustedDamage + flyingResult.extraDamage;
                
                if (finalDamage > 0) {
                    applyDamage(player, finalDamage, ability, enemy, addLog);
                    
                    // Handle pinned status changes after successful hit
                    if (pinnedResult.shouldRemovePinFromAttacker) {
                        applyStatus(enemy, 'pinned', 0);
                    }
                    if (pinnedResult.shouldStunTarget) {
                        applyStatus(player, 'stunned', 1, addLog);
                    }
                    
                    if (critInfo.isCritical) {
                        addLog(`${enemy.name} scores a CRITICAL HIT! ${finalDamage} damage!`);
                        if (ability.onCrit) addLog(ability.onCrit);
                    } else {
                        addLog(`${finalDamage} damage!`);
                    }
                }

                // Handle pinned status changes for target
                if (pinnedResult.shouldRemovePinFromTarget) {
                    applyStatus(player, 'pinned', 0);
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
