import { addExp, getExpForLevel } from './leveling.js';
import { getInventory, removeItem } from './inventory.js';
import { updateSecondaryStats } from './character.js';
import { updateLifeBar } from './ui.js';
import { applyStatus, statusSummary, isStatusActive } from './status.js';
import { getAbilities, useAbility, canUseAbility } from './abilities.js';
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
    handleAbilityEffects 
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
    const modal = document.getElementById("combat-modal");
    const actionsDiv = document.getElementById("combat-actions");

    // Initialize battle logging
    const logger = createBattleLogger();
    const { addLog, separateLog, getGroupedLogs, clearLogs } = logger;

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
        actionsDiv.innerHTML = "";
        let summary = result === "win" ? "Victory!" : result === "lose" ? "Defeat!" : result === "escape" ? "Escaped!" : "Battle Ended";

        // Add grouped log to history
        if (typeof window.addBattleToHistory === "function") {
            window.addBattleToHistory(enemy.name, getGroupedLogs(), summary);
        }

        const logDiv = document.getElementById("combat-log");

        if (result === "win") {
            separateLog();
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
            separateLog();
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
            separateLog();
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
            separateLog();
            if (isStatusActive(player, 'stunned') || isStatusActive(player, 'frozen')) {
                addLog(`${player.name} is unable to move!`);
                lastPlayerAbility = null; // Reset combo when player can't act
                playerTurn = false;
                setTimeout(nextTurn, 1000);
                return;
            }

            actionsDiv.innerHTML = ""; // Clear previous actions


            // create the ability toggle button
            const abilityToggleBtn = document.createElement("button");
            abilityToggleBtn.textContent = "Abilities";

            abilityToggleBtn.onclick = () => {
                const isVisible = abilityDiv.style.display === "grid";
                abilityDiv.style.display = isVisible ? "none" : "grid";
                consumablesDiv.style.display = "none";  // Always hide items when showing abilities
            };
            actionsDiv.appendChild(abilityToggleBtn);


            // Create the consumables toggle button
            const itemsToggleBtn = document.createElement("button");
            itemsToggleBtn.textContent = "Items";

            itemsToggleBtn.onclick = () => {
                const isVisible = consumablesDiv.style.display === "grid";
                consumablesDiv.style.display = isVisible ? "none" : "grid";
                abilityDiv.style.display = "none";  // Always hide abilities when showing items
            };
            actionsDiv.appendChild(itemsToggleBtn);


            // Create the ability div inside actionsDiv
            const abilityDiv = document.createElement("div");
            abilityDiv.className = "ability";
            abilityDiv.style.display = "none"; // Hide initially
            actionsDiv.appendChild(abilityDiv);


            // Create the consumable div inside actionsDiv
            const consumablesDiv = document.createElement("div");
            consumablesDiv.className = "consumables";
            consumablesDiv.style.display = "none"; // Hide initially
            actionsDiv.appendChild(consumablesDiv);


            // Show a button for each ability based on player's ability IDs
            const playerAbilities = getAbilities(player.abilityIds || []);
            Object.entries(playerAbilities).forEach(([abilityId, ability]) => {
                const btn = document.createElement("button");
                let buttonText = `${ability.name} (${ability.mpCost || 0} MP)`;

                // Update battleState with current values for checking
                battleState.lastPlayerAbility = lastPlayerAbility;
                battleState.lastEnemyAbility = lastEnemyAbility;

                // Check if ability can be used using centralized function
                const canUse = canUseAbility(player, enemy, abilityId, ability, battleState);
                
                // Build detailed requirement messages for display
                let requirementMessage = "";
                
                // Check cooldown and usage limitations for display
                if (abilityCooldowns[abilityId] > 0) {
                    requirementMessage += ` (${abilityCooldowns[abilityId]} turns)`;
                }
                
                if (ability.usesPerBattle && ability.usesPerBattle > 0) {
                    const usesLeft = abilityUsesLeft[abilityId] || 0;
                    if (usesLeft <= 0) {
                        requirementMessage += ` (no uses left)`;
                    } else {
                        buttonText += ` [${usesLeft}/${ability.usesPerBattle}]`;
                    }
                }
                
                // Check self status requirements for display
                if (ability.requiresStatusSelf && !isStatusActive(player, ability.requiresStatusSelf)) {
                    requirementMessage += ` (requires ${ability.requiresStatusSelf})`;
                }
                
                // Check target status requirements for display
                if (ability.requiresStatusTarget && !isStatusActive(enemy, ability.requiresStatusTarget)) {
                    requirementMessage += ` (requires target ${ability.requiresStatusTarget})`;
                }
                
                // Backward compatibility for display
                if (ability.requiresStatus && !isStatusActive(enemy, ability.requiresStatus)) {
                    requirementMessage += ` (requires target ${ability.requiresStatus})`;
                }

                // Check combo requirements for display
                if (ability.combo && ability.combo.followsFrom && ability.combo.followsFrom.length > 0) {
                    if (!lastPlayerAbility || !ability.combo.followsFrom.includes(lastPlayerAbility)) {
                        const requiredAbilities = ability.combo.followsFrom.join(' or ');
                        requirementMessage += ` (combo: needs ${requiredAbilities})`;
                    } else {
                        buttonText += ` [COMBO!]`;
                    }
                }

                // Only disable buff abilities if their buff is active
                let buffActive = false;
                if (ability.type === "buff" && ability.attribute && player.activeBoosts[ability.attribute] && player.activeBoosts[ability.attribute].turns > 0) {
                    buffActive = true;
                }
                
                // Update button text to show all information
                btn.textContent = buttonText + requirementMessage;
                
                btn.disabled = player.mana < (ability.mpCost || 0) || buffActive || !canUse;

                btn.onclick = () => {
                    if ((ability.mpCost || 0) > player.mana) return;
                    if (!canUseAbilityInBattle(abilityId, ability)) return;
                    
                    player.mana -= ability.mpCost || 0;
                    useAbilityInBattle(abilityId, ability, true); // Apply cooldown and reduce uses

                    if (ability.type === "physical" || ability.type === "magic") {
                        addLog(`${player.name}`);
                        const baseAccuracy = ability.accuracy !== undefined ? ability.accuracy : 100;
                        let finalAccuracy = baseAccuracy + (effectivePlayerSpeed - effectiveEnemySpeed) * 2;
                        finalAccuracy = Math.max(5, Math.min(100, finalAccuracy));
                        finalAccuracy = Math.floor(finalAccuracy * effectivePlayerAccuracy);
                        const roll = Math.floor(Math.random() * 100) + 1;
                        if (roll <= finalAccuracy) {
                            addLog(ability.onHit || `${player.name} used ${ability.name}!`);

                            // Calculate damage
                            let base = Math.floor(Math.random() * (ability.maxDamage - ability.minDamage + 1)) + ability.minDamage;
                            let attackStat;
                            let defenseStat;
                            if (ability.type === "magic") {
                                attackStat = base + player.secondary?.magicDamage || 0;
                                defenseStat = ability.breaksDefense ? 0 : (enemy.secondary?.magicDefense || 0);
                            } else if (ability.type === "physical") {
                                attackStat = base + player.secondary?.physicDamage || 0;
                                defenseStat = ability.breaksDefense ? 0 : (enemy.secondary?.physicDefense || 0);
                            } else {
                                attackStat = 0;
                                defenseStat = 0;
                            }
                            let dmg = Math.max(0, base + attackStat - defenseStat);
                            
                            // Critical hit calculation for player attacks
                            let isCritical = false;
                            if (dmg > 0 && (ability.type === "physical" || ability.type === "magic")) {
                                // Base crit chance is 5%, increased by dexterity (1% per 2 points after 10 dexterity)
                                const baseCritChance = 5;
                                const dexterityBonus = Math.floor((player.attributes?.dexterity || 0 - 10) / 2);
                                const totalCritChance = baseCritChance + Math.max(0, dexterityBonus);
                                
                                // Individual ability crit chance modifier (if specified)
                                const abilityCritBonus = ability.critChance ? (ability.critChance * 100) : 0;
                                const finalCritChance = Math.min(100, totalCritChance + abilityCritBonus); // Cap at 100%

                                const critRoll = Math.floor(Math.random() * 100) + 1;
                                if (critRoll <= finalCritChance) {
                                    isCritical = true;
                                    const critMultiplier = ability.critMultiplier || 2.0;
                                    dmg = Math.floor(dmg * critMultiplier);
                                }
                            }
                            
                            enemy.life -= dmg;

                            if (dmg !== 0) {
                                // Log the damage dealt
                                if (isCritical) {
                                    addLog(`CRITICAL HIT! ${dmg} damage!`);
                                    if (ability.onCrit) {
                                        addLog(ability.onCrit);
                                    }
                                } else {
                                    addLog(`${dmg} damage!`);
                                }
                                
                                // Life steal mechanic
                                if (ability.lifeSteal && ability.lifeSteal > 0) {
                                    const healAmount = Math.floor(dmg * ability.lifeSteal);
                                    if (healAmount > 0) {
                                        player.life = Math.min(player.maxLife, player.life + healAmount);
                                        addLog(`${player.name} steals ${healAmount} health!`);
                                        updateLifeBar(player.life, player.maxLife);
                                    }
                                }
                                
                                // Log if defense was broken
                                if (ability.breaksDefense) {
                                    addLog("Defense bypassed!");
                                }
                            }

                            if (ability.effect && Math.random() < (ability.effect.chance || 1)) {
                                const statusTarget = ability.effect.target === 'self' ? player : enemy;
                                applyStatus(
                                    statusTarget,
                                    ability.effect.type,
                                    ability.effect.turns || 1,
                                    addLog,
                                    ability.effect.permanent || false
                                );
                            }

                            // Handle status removal from self
                            if (ability.removesStatusSelf && Array.isArray(ability.removesStatusSelf)) {
                                ability.removesStatusSelf.forEach(statusType => {
                                    if (isStatusActive(player, statusType)) {
                                        applyStatus(player, statusType, 0);
                                        addLog(`${player.name} is no longer ${statusType}!`);
                                    }
                                });
                            }

                            // Handle status removal from target
                            if (ability.removesStatusTarget && Array.isArray(ability.removesStatusTarget)) {
                                ability.removesStatusTarget.forEach(statusType => {
                                    if (isStatusActive(enemy, statusType)) {
                                        applyStatus(enemy, statusType, 0);
                                        addLog(`${enemy.name} is no longer ${statusType}!`);
                                    }
                                });
                            }

                            // Backward compatibility: handle old removesPin property
                            if (ability.removesPin && isStatusActive(player, 'pinned')) {
                                applyStatus(player, 'pinned', 0);
                            }
                        } else {
                            addLog(ability.onMiss || `${player.name}'s attack misses!`);
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
                    updateStats();
                    playerTurn = false;
                    nextTurn();
                };

    // Handle ability use
    function handleAbilityUse(abilityId, ability) {
        if ((ability.mpCost || 0) > player.mana) return;
        if (!canUseAbilityInBattle(abilityId, ability)) return;
        
        player.mana -= ability.mpCost || 0;
        useAbilityInBattle(abilityId, ability, true);

        executePlayerAbility(ability, abilityId);
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
            addLog(`${player.name}`);
            
            const accuracy = calculateAccuracy(ability, turnInfo.playerStats.effectiveSpeed, turnInfo.enemyStats.effectiveSpeed, turnInfo.playerStats.effectiveAccuracy);
            const roll = Math.floor(Math.random() * 100) + 1;
            
            if (roll <= accuracy) {
                logAttackResult(true, ability, player.name, addLog);

                // Check flying interactions
                const flyingResult = handleFlyingInteractions(ability, player, enemy, addLog);
                if (!flyingResult.canHit) {
                    return;
                }

                // Calculate damage
                const damageInfo = calculateDamage(ability, player, enemy);
                const critInfo = calculateCriticalHit(ability, player, damageInfo.finalDamage, true);
                
                // Apply extra damage from flying interactions
                const finalDamage = critInfo.finalDamage + flyingResult.extraDamage;
                
                if (finalDamage > 0) {
                    applyDamage(enemy, finalDamage, ability, player, addLog);
                    logDamage({...damageInfo, finalDamage}, critInfo, ability, addLog);
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
            
            addLog(`${enemy.name} used ${ability.name}` + (ability.description ? `: ${ability.description}` : ""));

            // Execute enemy ability
            executeEnemyAbility(ability, turnInfo);
            
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

        const accuracy = calculateAccuracy(ability, turnInfo.enemyStats.effectiveSpeed, turnInfo.playerStats.effectiveSpeed, turnInfo.enemyStats.effectiveAccuracy);
        const roll = Math.floor(Math.random() * 100) + 1;

        if (roll <= accuracy) {
            logAttackResult(true, ability, enemy.name, addLog);

            if (ability.type === "physical" || ability.type === "magic") {
                // Calculate damage
                const damageInfo = calculateDamage(ability, enemy, player);
                const critInfo = calculateCriticalHit(ability, enemy, damageInfo.finalDamage, false);
                
                // Apply extra damage from flying interactions
                const finalDamage = critInfo.finalDamage + flyingResult.extraDamage;
                
                if (finalDamage > 0) {
                    applyDamage(player, finalDamage, ability, enemy, addLog);
                    
                    if (critInfo.isCritical) {
                        addLog(`${enemy.name} scores a CRITICAL HIT! ${finalDamage} damage!`);
                        if (ability.onCrit) addLog(ability.onCrit);
                    } else {
                        addLog(`${finalDamage} damage!`);
                    }
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