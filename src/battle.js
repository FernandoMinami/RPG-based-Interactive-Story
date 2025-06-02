import { addExp, getExpForLevel } from './leveling.js';
import { getInventory, removeItem } from './inventory.js';
import { items } from './items.js';
import { updateSecondaryStats, regenMp } from './character.js';
import { updateHistoryPanel, historyLog } from './history.js';
import { updateLifeBar, updateManaBar } from './ui.js';

/*import { updateAttributesBar, createAbilityButtons } from './ui.js';
import { applyStatus, updateStatuses, statusSummary } from './status/_status.js';*/


// Starts a battle between the player and an enemy
export function startBattle(player, enemy, onBattleEnd) {
    const modal = document.getElementById("combat-modal");
    const logDiv = document.getElementById("combat-log");
    const playerStats = document.getElementById("combat-player-stats");
    const enemyStats = document.getElementById("combat-enemy-stats");
    const actionsDiv = document.getElementById("combat-actions");
    const recentDiv = document.getElementById("combat-recent");
    const showHistoryBtn = document.getElementById("show-battle-history-btn");

    let battleLog = [];            // Current "turn" log messages
    let groupedBattleLogs = [];    // All grouped logs for this battle


    modal.style.display = "block";
    logDiv.innerHTML = "";
    let playerTurn = true;
    let playerStatus = { stun: 0, burn: 0, freeze: 0, pin: 0 };

    showHistoryBtn.onclick = function () {
        if (logDiv.style.display === "none") {
            logDiv.style.display = "";
            showHistoryBtn.textContent = "Hide Battle History";
        } else {
            logDiv.style.display = "none";
            showHistoryBtn.textContent = "Show Battle History";
        }
    };
    logDiv.style.display = "none"; // Hide by default

    // Initialize player and enemy stats
    function updateStats() {
        playerStats.innerHTML = `<b>${player.name}</b> <span>HP: ${player.life}/${player.maxLife}</span> <span>MP: ${player.mana}/${player.maxMana}</span>` +
            (playerStatus.stun ? " <span style='color:orange'>(Stunned)</span>" : "") +
            (playerStatus.burn ? " <span style='color:red'>(Burned)</span>" : "") +
            (playerStatus.freeze ? " <span style='color:cyan'>(Frozen)</span>" : "") +
            (playerStatus.pin ? " <span style='color:purple'>(Pinned)</span>" : "");
        //playerStats.innerHTML = `<b>${player.name}</b> HP: ${player.life}/${player.maxLife} MP: ${player.mana}/${player.maxMana} ${statusSummary(player)}`;
        //enemyStats.innerHTML = `<b>${enemy.name}</b> <span>HP: ${enemy.life}/${enemy.maxLife} ${statusSummary(enemy)}</span>`;

        enemyStats.innerHTML = `<b>${enemy.name}</b> <span>HP: ${enemy.life}/${enemy.maxLife}</span>` ;

    }

    // shows the result of the battle in the logDiv
    function showResult(result) {
        actionsDiv.innerHTML = "";
        let summary = result === "win" ? "Victory!" : result === "lose" ? "Defeat!" : result === "escape" ? "Escaped!" : "Battle Ended";

        // Add grouped log to history
        if (typeof window.addBattleToHistory === "function") {
            window.addBattleToHistory(enemy.name, groupedBattleLogs, summary);
        }

        actionsDiv.innerHTML = "";

        if (result === "win") { // Player won the battle
            separateLog();
            logDiv.innerHTML += `<div style="color:green;font-weight:bold;">You won!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                const exp = enemy.exp || Math.floor(Math.random() * 10 + 10);
                const gold = enemy.gold || Math.floor(Math.random() * 10 + 5);
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
        } else if (result === "escape") { // Player escaped the battle
            // Add grouped log to history for escape
            logDiv.innerHTML += `<div style="color:orange;font-weight:bold;">You escaped!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                modal.style.display = "none";
                onBattleEnd("escape");
            };
            actionsDiv.appendChild(contBtn);
        }
        else if (result === "lose") { // Player lost the battle
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

    // this function will add the messages of the battle together in a div until the next turn
    function addLog(msg) {
        battleLog.push(msg);

        // show last 2 battle-log-groups in the recentDiv
        const recentGroups = battleLog.slice().map(m => `<div>${m}</div>`).join("");
        recentDiv.innerHTML = recentGroups;

        // Add to history log
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // this function will separate the messages of the battle together in a div until the next turn
    function separateLog() {
        if (battleLog.length === 0) return; // Nothing to group

        const grouped = battleLog.join(' ');


        // Display in logDiv
        logDiv.innerHTML += `<div class="battle-log-group">${grouped}</div>`;

        // Save this group for history
        groupedBattleLogs.push(grouped);

        // Clear current turn log
        battleLog = [];
    }

    // function to control the turn order and actions
    function nextTurn() {
        updateStats();

        regenMp && regenMp();

        // Example: apply burn
        // applyStatus(enemy, 'burn', 3);


        //updateStatuses(player, addLog);
        //updateStatuses(enemy, addLog);


        if (player.life <= 0) return showResult("lose");
        if (enemy.life <= 0) return showResult("win");

        // player base speed and accuracy calculations
        let effectivePlayerSpeed = player.secondary?.speed || 0;
        let effectivePlayerAccuracy = 1;
        // if player is pinned or frozen, set speed to 0 and accuracy to 0.5
        if (playerStatus.pin > 0) {
            effectivePlayerSpeed = 0;
            effectivePlayerAccuracy = 0.5;
        }

        // enemy base speed and accuracy calculations
        let effectiveEnemySpeed = enemy.secondary?.speed || enemy.speed || 0;
        let effectiveEnemyAccuracy = 1;
        //if enemy is pinned, set speed to 0 and accuracy to 0.5
        if (enemy.status && enemy.status.pin > 0) {
            effectiveEnemySpeed = 0;
            effectiveEnemyAccuracy = 0.0;
        }

        actionsDiv.innerHTML = "";
        /*player turn logic*/ if (playerTurn) {
            separateLog();
            if (playerStatus.stun > 0 || playerStatus.freeze > 0) {
                addLog(`${player.name} is unable to move!`);
                playerStatus.stun = Math.max(0, playerStatus.stun - 1);
                playerStatus.freeze = Math.max(0, playerStatus.freeze - 1);
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


            // Show a button for each ability 
            Object.entries(player.abilities).forEach(([key, ability]) => {
                const btn = document.createElement("button");
                btn.textContent = `${ability.name} (${ability.mpCost || 0} MP)`;

                // Only disable buff abilities if their buff is active
                let buffActive = false;
                if (ability.type === "buff" && ability.attribute && player.activeBoosts[ability.attribute] && player.activeBoosts[ability.attribute].turns > 0) {
                    buffActive = true;
                }
                btn.disabled = player.mana < (ability.mpCost || 0) || buffActive;

                btn.onclick = () => {
                    if ((ability.mpCost || 0) > player.mana) return;
                    player.mana -= ability.mpCost || 0;

                    if (ability.type === "physical" || ability.type === "magic") {
                        addLog(`${player.name}`);
                        const baseAccuracy = ability.accuracy !== undefined ? ability.accuracy : 100;
                        let finalAccuracy = baseAccuracy + (effectivePlayerSpeed - effectiveEnemySpeed) * 2;
                        finalAccuracy = Math.max(5, Math.min(100, finalAccuracy));
                        finalAccuracy = Math.floor(finalAccuracy * effectivePlayerAccuracy);
                        const roll = Math.floor(Math.random() * 100) + 1;
                        if (roll <= finalAccuracy) {
                            addLog(ability.onHit || `${player.name} used ${ability.name}!`);
                            if (playerStatus.pin > 0) {
                                playerStatus.pin = 0;
                                addLog(`The attack made ${enemy.name} tumble backward and ${player.name} is no longer pinned!`);
                            }


                            // Calculate damage
                            let base = Math.floor(Math.random() * (ability.maxDamage - ability.minDamage + 1)) + ability.minDamage;
                            let attackStat;
                            let defenseStat;
                            if (ability.type === "magic") {
                                attackStat = base + player.secondary?.magicDamage || 0;
                                defenseStat = enemy.secondary?.magicDefense || 0;
                            } else if (ability.type === "physical") {
                                attackStat = base + player.secondary?.physicalDamage || 0;
                                defenseStat = enemy.secondary?.physicalDefense || 0;
                            } else {
                                attackStat = 0;
                                defenseStat = 0;
                            }
                            let dmg = Math.max(0, base + attackStat - defenseStat);
                            enemy.life -= dmg;

                            if (dmg !== 0) {
                                // Log the damage dealt
                                addLog(`${dmg} damage!`);
                            }

                            if (ability.effect && Math.random() < (ability.effect.chance || 1)) {
                                enemy.status = enemy.status || {};
                                enemy.status[ability.effect.type] = ability.effect.turns || 1;
                                addLog(`${enemy.name} is ${ability.effect.type}${ability.effect.turns > 1 ? ` for ${ability.effect.turns} turns` : ""}!`);
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

                abilityDiv.appendChild(btn);
            });


            // Create the consumables div inside actionsDiv
            Object.entries(getInventory()).forEach(([itemId, count]) => {
                const itemDef = items[itemId];
                if (itemDef && itemDef.type === "consumable" && count > 0) {
                    const btn = document.createElement("button");
                    btn.textContent = `${itemDef.name} (${count})`;
                    btn.onclick = () => {
                        if (itemDef.use(player)) {
                            removeItem(itemId, 1);
                            addLog(`${player.name} used ${itemDef.name}!`);
                            updateStats();
                            playerTurn = false;
                            nextTurn();
                        } else {
                            addLog(`Can't use ${itemDef.name} right now!`);
                        }
                    };
                    consumablesDiv.appendChild(btn);
                }
            });
            actionsDiv.appendChild(consumablesDiv);


            // Create a container for the Escape/Struggle button
            const escapeDiv = document.createElement("div");
            escapeDiv.className = "escape-container";
            escapeDiv.style.marginTop = "10px";  // optional spacing for separation

            // Escape button
            if (playerStatus.pin > 0) {
                // Player is pinned, show struggle button
                const struggleBtn = document.createElement("button");
                struggleBtn.textContent = "Struggle";
                struggleBtn.onclick = () => {
                    const roll = Math.floor(Math.random() * 20) + 1;
                    const playerStrengthBonus = player.attributes?.strength - 10 || 0;
                    const enemyWeight = enemy.weight || 0;
                    const struggleScore = Math.floor(roll + (playerStrengthBonus) - (enemyWeight / 10));
                    addLog(`${player.name} Struggles! (Roll: ${roll} + Strength Bonus: ${playerStrengthBonus} - Enemy Weight/10: ${enemyWeight}/10 = ${struggleScore})`);

                    if (struggleScore > 10) {
                        addLog(`${player.name} Manages to push ${enemy.name} away!`);
                        playerStatus.pin = 0;
                        playerTurn = false;
                        setTimeout(nextTurn, 1000);
                    } else {
                        addLog(`${player.name} failed to escape!`);
                        playerTurn = false;
                        setTimeout(nextTurn, 1000);
                    }
                };
                escapeDiv.appendChild(struggleBtn);

            } else {
                // Player is not pinned, show escape button
                const escapeBtn = document.createElement("button");
                escapeBtn.textContent = "Escape";
                escapeBtn.onclick = () => {
                    const roll = Math.floor(Math.random() * 20) + 1;
                    const playerSpeed = player.secondary?.speed || 0;
                    const enemySpeed = enemy.secondary?.speed || enemy.speed || 0;
                    const escapeScore = Math.floor(roll + playerSpeed - enemySpeed);
                    addLog(`${player.name} tries to escape! (Roll: ${roll} + Speed: ${playerSpeed} - Enemy Speed: ${enemySpeed} = ${escapeScore})`);

                    if (escapeScore > 10) {
                        addLog(`${player.name} escaped successfully!`);
                        return showResult("escape");
                    } else {
                        addLog(`${player.name} failed to escape!`);
                        playerTurn = false;
                        setTimeout(nextTurn, 1000);
                    }
                };
                escapeDiv.appendChild(escapeBtn);
            }

            // Finally, append the escapeDiv to actionsDiv
            actionsDiv.appendChild(escapeDiv);


        } /*Enemy turn logic*/ else {
            separateLog();
            setTimeout(() => {
                // Filter attacks based on player status
                let availableAttacks = enemy.attacks.filter(atk => {
                    if (!atk.requiresStatus) return true;
                    return playerStatus[atk.requiresStatus] > 0;
                });
                // Fallback: if no attacks are available, use any attack
                if (availableAttacks.length === 0) availableAttacks = enemy.attacks;

                // Weighted random: favorite attacks appear more often
                let weighted = [];
                availableAttacks.forEach(atk => {
                    if (atk.favorite) {
                        // Add the attack multiple times to increase its chance (e.g., 4x)
                        weighted.push(atk, atk, atk, atk);
                    } else {
                        weighted.push(atk, atk, atk); // Normal attacks appear three times
                    }
                });
                let attack = weighted[Math.floor(Math.random() * weighted.length)];
                const baseAccuracy = attack.accuracy !== undefined ? attack.accuracy : 100;
                let finalAccuracy = baseAccuracy + (effectiveEnemySpeed - effectivePlayerSpeed) * 2;
                finalAccuracy = Math.max(5, Math.min(100, finalAccuracy));
                finalAccuracy = Math.floor(finalAccuracy * effectiveEnemyAccuracy);
                const roll = Math.floor(Math.random() * 100) + 1;


                addLog(`${enemy.name} used ${attack.name}` + (attack.description ? `: ${attack.description}` : ""));
                if (roll <= finalAccuracy) {
                    // HIT!
                    addLog(attack.onHit || `${enemy.name}'s attack hits!`);

                    // If the player is pinned and the enemy uses a move with removesPin, remove pin
                    if (playerStatus && playerStatus.pin > 0 && attack.removesPin) {
                        playerStatus.pin = 0;
                        addLog(`${player.name} is no longer pinned!`);
                    }

                    // If the enemy is pinned and hits the player, remove pin
                    if (enemy.pin > 0) {
                        enemy.pin = 0;
                        addLog(`The attack made ${player.name} tumble backward and ${enemy.name} is no longer pinned!`);
                    }

                    // Calculate damage
                    let base = Math.floor(Math.random() * (attack.maxDamage - attack.minDamage + 1)) + attack.minDamage;
                    let attackStat;
                    let defenseStat;
                    if (attack.type === "magic") {
                        attackStat = base + enemy.secondary?.magicDamage || 0;
                        defenseStat = player.secondary?.magicDefense || 0;
                    } else if (attack.type === "physical") {
                        attackStat = base + enemy.secondary?.physicalDamage || 0;
                        defenseStat = player.secondary?.physicalDefense || 0;
                    } else {
                        attackStat = 0;
                        defenseStat = 0;
                    }
                    let dmg = Math.max(0, base + attackStat - defenseStat);

                    if (dmg !== 0) {
                        // Log the damage dealt
                        addLog(`${dmg} damage!`);
                        player.life -= dmg;
                        updateLifeBar(player.life, player.maxLife);
                    }

                    if (attack.effect && Math.random() < (attack.effect.chance || 1)) {
                        playerStatus[attack.effect.type] = attack.effect.turns || 1;
                        addLog(`${player.name} is ${attack.effect.type}${attack.effect.turns > 1 ? ` for ${attack.effect.turns} turns` : ""}!`);
                    }
                } else {
                    // MISS!
                    addLog(`${enemy.name} uses ${attack.name} but you dodge!`);
                    // addLog(attack.onMiss || `${enemy.name}'s attack misses!`); use this if you want a custom message for each attack
                }
                if (playerStatus.burn > 0) {
                    player.life -= 2;
                    addLog(`${player.name} takes 2 burn damage!`);
                    playerStatus.burn--;
                }
                playerTurn = true;
                nextTurn();
            }, 1000);
        }
    }

    nextTurn();
}

if (typeof window.updateCharacterUI === "function") window.updateCharacterUI();