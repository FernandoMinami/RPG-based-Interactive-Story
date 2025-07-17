import { addExp } from './leveling.js';
import { getInventory, removeItem } from './inventory.js';
import { items } from './items.js';
import { regenMp } from './character.js';
import { updateLifeBar } from './ui.js';
import { loadStatuses, StatusRegistry } from './status.js';

console.log('Loaded statuses:', StatusRegistry);


import {
    applyStatus,
    updateStatuses,
    isStatusActive,
    statusSummary
} from './status.js';

export function startBattle(player, enemy, onBattleEnd) {
    //initializeStatus(player);
    //initializeStatus(enemy);
    // Note: statuses are already loaded in story.js, no need to reload them here

    const modal = document.getElementById("combat-modal");
    const logDiv = document.getElementById("combat-log");
    const playerStats = document.getElementById("combat-player-stats");
    const enemyStats = document.getElementById("combat-enemy-stats");
    const actionsDiv = document.getElementById("combat-actions");
    const recentDiv = document.getElementById("combat-recent");
    const showHistoryBtn = document.getElementById("show-battle-history-btn");

    let battleLog = [];
    let groupedBattleLogs = [];
    let playerTurn = true;

    function updateStats() {
        playerStats.innerHTML = `<b>${player.name}</b> 
            <span>HP: ${player.life}/${player.maxLife}</span> 
            <span>MP: ${player.mana}/${player.maxMana}</span> 
            <span>Status: ${statusSummary(player)}</span>`;

        enemyStats.innerHTML = `<b>${enemy.name}</b> 
            <span>HP: ${enemy.life}/${enemy.maxLife}</span> 
            <span>Status: ${statusSummary(enemy)}</span>`;
    }

    function addLog(msg) {
        battleLog.push(msg);
        const recentGroups = battleLog.slice().map(m => `<div>${m}</div>`).join("");
        recentDiv.innerHTML = recentGroups;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    function separateLog() {
        if (battleLog.length === 0) return;
        const grouped = battleLog.join(' ');
        logDiv.innerHTML += `<div class="battle-log-group">${grouped}</div>`;
        groupedBattleLogs.push(grouped);
        battleLog = [];
    }

    function showResult(result) {
        actionsDiv.innerHTML = "";
        let summary = result === "win" ? "Victory!" : result === "lose" ? "Defeat!" : result === "escape" ? "Escaped!" : "Battle Ended";

        if (typeof window.addBattleToHistory === "function") {
            window.addBattleToHistory(enemy.name, groupedBattleLogs, summary);
        }

        if (result === "win") {
            separateLog();
            logDiv.innerHTML += `<div style="color:green;font-weight:bold;">You won!</div>`;
            const contBtn = document.createElement("button");
            contBtn.textContent = "Continue";
            contBtn.onclick = () => {
                const exp = enemy.exp || Math.floor(Math.random() * 10 + 10);
                const leveledUp = addExp(player, exp);
                if (typeof window.updateCharacterUI === "function") window.updateCharacterUI();
                if (leveledUp) logDiv.innerHTML += `<div style="color:gold;font-weight:bold;">Level Up! You are now level ${player.level}!</div>`;
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

    function nextTurn() {
        updateStats();
        regenMp && regenMp();
        updateStatuses(player, addLog);
        updateStatuses(enemy, addLog);

        if (player.life <= 0) return showResult("lose");
        if (enemy.life <= 0) return showResult("win");

        let effectivePlayerSpeed = player.secondary?.speed || 0;
        let effectivePlayerAccuracy = 1;

        if (isStatusActive(player, 'pin')) {
            effectivePlayerSpeed = 0;
            effectivePlayerAccuracy = 0.5;
        }

        let effectiveEnemySpeed = enemy.secondary?.speed || enemy.speed || 0;
        let effectiveEnemyAccuracy = 1;

        if (isStatusActive(enemy, 'pin')) {
            effectiveEnemySpeed = 0;
            effectiveEnemyAccuracy = 0.0;
        }

        actionsDiv.innerHTML = "";

        if (playerTurn) {
            separateLog();

            if (isStatusActive(player, 'stun') || isStatusActive(player, 'freeze')) {
                addLog(`${player.name} is unable to move!`);
                player.status.stun = Math.max(0, player.status.stun - 1);
                player.status.freeze = Math.max(0, player.status.freeze - 1);
                playerTurn = false;
                setTimeout(nextTurn, 1000);
                return;
            }

            const abilityDiv = document.createElement("div");
            abilityDiv.className = "ability";
            abilityDiv.style.display = "none";
            actionsDiv.appendChild(abilityDiv);

            const consumablesDiv = document.createElement("div");
            consumablesDiv.className = "consumables";
            consumablesDiv.style.display = "none";
            actionsDiv.appendChild(consumablesDiv);

            const abilityToggleBtn = document.createElement("button");
            abilityToggleBtn.textContent = "Abilities";
            abilityToggleBtn.onclick = () => {
                abilityDiv.style.display = abilityDiv.style.display === "grid" ? "none" : "grid";
                consumablesDiv.style.display = "none";
            };
            actionsDiv.appendChild(abilityToggleBtn);

            const itemsToggleBtn = document.createElement("button");
            itemsToggleBtn.textContent = "Items";
            itemsToggleBtn.onclick = () => {
                consumablesDiv.style.display = consumablesDiv.style.display === "grid" ? "none" : "grid";
                abilityDiv.style.display = "none";
            };
            actionsDiv.appendChild(itemsToggleBtn);

            Object.entries(player.abilities).forEach(([key, ability]) => {
                const btn = document.createElement("button");
                btn.textContent = `${ability.name} (${ability.mpCost || 0} MP)`;

                let buffActive = false;
                if (ability.type === "buff" && ability.attribute && player.activeBoosts[ability.attribute]?.turns > 0) {
                    buffActive = true;
                }
                btn.disabled = player.mana < (ability.mpCost || 0) || buffActive;

                btn.onclick = () => {
                    if ((ability.mpCost || 0) > player.mana) return;
                    player.mana -= ability.mpCost || 0;

                    if (ability.type === "physical" || ability.type === "magic") {
                        addLog(`${player.name}`);
                        
                        // Check if enemy is flying and attack is close range
                        if (isStatusActive(enemy, 'fly') && ability.range === "close") {
                            // Check if player is also flying (can hit flying targets with close attacks)
                            if (!isStatusActive(player, 'fly')) {
                                addLog(`${player.name} cannot reach the flying ${enemy.name} with a close attack!`);
                                playerTurn = false;
                                nextTurn();
                                return;
                            }
                        }
                        
                        const baseAccuracy = ability.accuracy ?? 100;
                        let finalAccuracy = baseAccuracy + (effectivePlayerSpeed - effectiveEnemySpeed) * 2;
                        finalAccuracy = Math.max(5, Math.min(100, finalAccuracy));
                        finalAccuracy = Math.floor(finalAccuracy * effectivePlayerAccuracy);
                        const roll = Math.floor(Math.random() * 100) + 1;

                        if (roll <= finalAccuracy) {
                            addLog(ability.onHit || `${player.name} used ${ability.name}!`);

                            // If player used a close attack while flying, they land
                            if (ability.range === "close" && isStatusActive(player, 'fly')) {
                                player.status.fly = 0;
                                addLog(`${player.name} lands after using a close attack!`);
                            }

                            if (isStatusActive(player, 'pin')) {
                                player.status.pin = 0;
                                addLog(`The attack made ${enemy.name} tumble backward and ${player.name} is no longer pinned!`);
                            }

                            let base = Math.floor(Math.random() * (ability.maxDamage - ability.minDamage + 1)) + ability.minDamage;
                            let attackStat = 0, defenseStat = 0;

                            if (ability.type === "magic") {
                                attackStat = base + (player.secondary?.magicDamage || 0);
                                defenseStat = enemy.secondary?.magicDefense || 0;
                            } else if (ability.type === "physical") {
                                attackStat = base + (player.secondary?.physicalDamage || 0);
                                defenseStat = enemy.secondary?.physicalDefense || 0;
                            }

                            let dmg = Math.max(0, base + attackStat - defenseStat);
                            
                            // If target is flying and hit by ranged attack, they fall and take fall damage
                            if (isStatusActive(enemy, 'fly') && ability.range === "ranged") {
                                enemy.status.fly = 0;
                                const fallDamage = Math.floor((enemy.weight || 50) / 10); // Fall damage based on weight
                                dmg += fallDamage;
                                addLog(`${enemy.name} is knocked out of the air and takes ${fallDamage} fall damage!`);
                            }
                            
                            enemy.life -= dmg;

                            if (dmg !== 0) addLog(`${dmg} damage!`);

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
                        } else {
                            addLog(ability.onMiss || `${player.name}'s attack misses!`);
                        }
                    } else if (ability.type === "heal") {
                        player.life = Math.min(player.maxLife, player.life + ability.amount);
                        addLog(`${player.name} heals for ${ability.amount} HP!`);
                    } else if (ability.type === "buff") {
                        if (!player.activeBoosts[ability.attribute] || player.activeBoosts[ability.attribute].turns <= 0) {
                            player.attributes[ability.attribute] += ability.amount;
                            player.activeBoosts[ability.attribute] = { amount: ability.amount, turns: ability.turns };
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

            const escapeDiv = document.createElement("div");
            escapeDiv.className = "escape-container";
            escapeDiv.style.marginTop = "10px";

            if (isStatusActive(player, 'pin')) {
                const struggleBtn = document.createElement("button");
                struggleBtn.textContent = "Struggle";
                struggleBtn.onclick = () => {
                    const roll = Math.floor(Math.random() * 20) + 1;
                    const playerStrengthBonus = (player.attributes?.strength || 10) - 10;
                    const enemyWeight = enemy.weight || 0;
                    const struggleScore = Math.floor(roll + playerStrengthBonus - (enemyWeight / 10));
                    addLog(`${player.name} Struggles! (Roll: ${roll} + Strength Bonus: ${playerStrengthBonus} - Enemy Weight/10: ${enemyWeight}/10 = ${struggleScore})`);

                    if (struggleScore > 10) {
                        addLog(`${player.name} Manages to push ${enemy.name} away!`);
                        player.status.pin = 0;
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

            actionsDiv.appendChild(escapeDiv);

        } else { /* Enemy turn logic */
            separateLog();
            setTimeout(() => {
                // Filter attacks based on player status
                let availableAttacks = enemy.attacks.filter(atk => {
                    if (!atk.requiresStatus) return true;
                    return isStatusActive(player, atk.requiresStatus);
                });

                // Fallback: if no attacks are available, use any attack
                if (availableAttacks.length === 0) availableAttacks = enemy.attacks;

                // Weighted random: favorite attacks appear more often
                let weighted = [];
                availableAttacks.forEach(atk => {
                    if (atk.favorite) {
                        weighted.push(atk, atk, atk, atk);
                    } else {
                        weighted.push(atk, atk, atk);
                    }
                });

                let attack = weighted[Math.floor(Math.random() * weighted.length)];
                const baseAccuracy = attack.accuracy !== undefined ? attack.accuracy : 100;
                let finalAccuracy = baseAccuracy + (effectiveEnemySpeed - effectivePlayerSpeed) * 2;
                finalAccuracy = Math.max(5, Math.min(100, finalAccuracy));
                finalAccuracy = Math.floor(finalAccuracy * effectiveEnemyAccuracy);
                const roll = Math.floor(Math.random() * 100) + 1;

                addLog(`${enemy.name} used ${attack.name}` + (attack.description ? `: ${attack.description}` : ""));

                // Check if attack can hit based on flying status and range
                if (attack.type === "physical" || attack.type === "magic") {
                    // Check if player is flying and attack is close range
                    if (isStatusActive(player, 'fly') && attack.range === "close") {
                        // Check if enemy is also flying (can hit flying targets with close attacks)
                        if (!isStatusActive(enemy, 'fly')) {
                            addLog(`${enemy.name} cannot reach the flying ${player.name} with a close attack!`);
                            playerTurn = true;
                            setTimeout(nextTurn, 1000);
                            return;
                        }
                    }
                }

                if (roll <= finalAccuracy) {
                    // HIT!
                    addLog(attack.onHit || `${enemy.name}'s attack hits!`);

                    // If enemy used a close attack while flying, they land
                    if (attack.range === "close" && isStatusActive(enemy, 'fly')) {
                        enemy.status.fly = 0;
                        addLog(`${enemy.name} lands after using a close attack!`);
                    }

                    // If the player is pinned and the enemy uses a move with removesPin, remove pin
                    if (isStatusActive(player, 'pin') && attack.removesPin) {
                        player.status.pin = 0;
                        addLog(`${player.name} is no longer pinned!`);
                    }

                    // If the enemy is pinned and hits the player, remove pin
                    if (isStatusActive(enemy, 'pin')) {
                        enemy.status.pin = 0;
                        addLog(`The attack made ${player.name} tumble backward and ${enemy.name} is no longer pinned!`);
                    }

                    // Calculate damage
                    let base = Math.floor(Math.random() * (attack.maxDamage - attack.minDamage + 1)) + attack.minDamage;
                    let attackStat;
                    let defenseStat;

                    if (attack.type === "magic") {
                        attackStat = base + (enemy.secondary?.magicDamage || 0);
                        defenseStat = player.secondary?.magicDefense || 0;
                    } else if (attack.type === "physical") {
                        attackStat = base + (enemy.secondary?.physicalDamage || 0);
                        defenseStat = player.secondary?.physicalDefense || 0;
                    } else {
                        attackStat = 0;
                        defenseStat = 0;
                    }

                    let dmg = Math.max(0, base + attackStat - defenseStat);

                    // If target (player) is flying and hit by ranged attack, they fall and take fall damage
                    if (isStatusActive(player, 'fly') && attack.range === "ranged") {
                        player.status.fly = 0;
                        const fallDamage = Math.floor((player.weight || 70) / 10); // Fall damage based on weight (default 70kg for player)
                        dmg += fallDamage;
                        addLog(`${player.name} is knocked out of the air and takes ${fallDamage} fall damage!`);
                    }

                    if (dmg !== 0) {
                        addLog(`${dmg} damage!`);
                        player.life -= dmg;
                        updateLifeBar(player.life, player.maxLife);
                    }

                    if (attack.effect && Math.random() < (attack.effect.chance || 1)) {
                        const statusTarget = attack.effect.target === 'self' ? enemy : player;
                        applyStatus(
                            statusTarget,
                            attack.effect.type,
                            attack.effect.turns || 1,
                            addLog,
                            attack.effect.permanent || false
                        );
                    }


                } else {
                    // MISS!
                    addLog(`${enemy.name} uses ${attack.name} but you dodge!`);
                }

                playerTurn = true;
                nextTurn();
            }, 1000);
        }
    }

    modal.style.display = "block";
    logDiv.innerHTML = "";
    logDiv.style.display = "none";

    showHistoryBtn.onclick = function () {
        logDiv.style.display = logDiv.style.display === "none" ? "" : "none";
        showHistoryBtn.textContent = logDiv.style.display === "none" ? "Show Battle History" : "Hide Battle History";
    };

    nextTurn();
}

if (typeof window.updateCharacterUI === "function") window.updateCharacterUI();
