// battle-enemies-ai.js - Enemy AI logic for battle system
//
// This module contains all enemy AI logic moved from battle.js to improve code organization.
// It handles:
// - Enemy turn processing and action execution
// - Enemy combo detection and setup
// - Enemy ability selection with weighted preferences
// - Enemy targeting logic (mount abilities, ally/enemy preferences)
// - Enemy action execution with damage calculation
//
// Functions moved from battle.js:
// - handleEnemyTurn: Main enemy turn handler
// - checkForEnemyCombo: Detects combo opportunities  
// - executeEnemyAbility: Executes enemy abilities with damage/effects
// - selectEnemyAbility: Selects abilities using weighted random with targeting logic
//
// This separation makes the battle system more modular and easier to maintain.

import { 
    canCharacterAct,
    isStatusActive
} from './status.js';
import { getAbilities } from './abilities.js';
import { 
    calculateAccuracy, 
    calculateDamage, 
    calculateCriticalHit, 
    applyDamage, 
    handleAbilityEffects
} from './combat-calculations.js';
import { handleModularBattleInteractions, handleForcefulBreakFree, removeIsHighStatuses} from './special-effects.js';
import { createActionData, logDamage } from './battle-logging.js';

/**
 * Handle enemy turn - processes all alive enemies' actions
 * @param {Object} turnInfo - Turn information including stats
 * @param {Array} aliveEnemies - Array of alive enemy characters
 * @param {Object} player - Player character
 * @param {Array} enemies - All enemies (for indexing)
 * @param {Object} roundManager - Round management system
 * @param {Function} addLog - Logging function
 * @param {Function} addRecentAction - Action logging function
 * @param {Function} nextTurn - Next turn callback
 * @param {Object} battleState - Battle state object
 * @param {Object} lastEnemyAbilities - Tracking for combo system
 */
export function handleEnemyTurn(turnInfo, aliveEnemies, player, enemies, roundManager, addLog, addRecentAction, nextTurn, battleState, lastEnemyAbilities) {
    
    setTimeout(() => {
        // Handle each alive enemy's turn
        let enemyActionsCompleted = 0;
        const totalEnemies = aliveEnemies.length;
        
        function processNextEnemy() {

            
            if (enemyActionsCompleted >= totalEnemies) {
                // All enemies have acted, switch to player turn

                roundManager.switchTurn();
                nextTurn();
                return;
            }
            
            const currentEnemy = aliveEnemies[enemyActionsCompleted];
            const enemyIndex = enemies.indexOf(currentEnemy);
            
            
            // Check if this enemy can act (not stunned)
            if (!canCharacterAct(currentEnemy)) {
                addLog(`${currentEnemy.name} is stunned and cannot act!`);
                const stunnedActionData = createActionData(
                    currentEnemy.name,
                    "Stunned",
                    "self",
                    [`${currentEnemy.name} cannot act due to being stunned!`],
                    { hit: false }
                );
                addRecentAction(stunnedActionData);
                
                // Mark that this enemy has acted (even though stunned)
                roundManager.markCharacterActed(false, enemyIndex);
                
                enemyActionsCompleted++;
                setTimeout(processNextEnemy, 800);
                return;
            }

            const enemyAbilities = getAbilities(currentEnemy.abilityIds || []);
            
            // Debug logging
            // Additional debug: Check if abilities have required fields
            Object.entries(enemyAbilities).forEach(([id, ability]) => {
            });
            
            // Check for enemy combo opportunities
            const comboAbility = checkForEnemyCombo(currentEnemy, enemyIndex, aliveEnemies, player, lastEnemyAbilities);
            
            let selectedAbilityId, ability;
            if (comboAbility) {
                selectedAbilityId = comboAbility.abilityId;
                ability = comboAbility.ability;
                addLog(`🔥 COMBO ATTACK: ${comboAbility.comboName}`);
            } else {
                // Select normal enemy ability (weighted random based on preferences)
                selectedAbilityId = selectEnemyAbility(currentEnemy, enemyAbilities, player, enemies, lastEnemyAbilities, battleState.lastPlayerAbility);
                ability = enemyAbilities[selectedAbilityId];
            }
            
            // Defensive check - if no valid ability found, skip this enemy's turn
            if (!selectedAbilityId || !ability) {
                console.warn(`Enemy ${currentEnemy.name} has no valid abilities to use!`, {
                    enemyAbilities: Object.keys(enemyAbilities),
                    abilityIds: currentEnemy.abilityIds,
                    selectedAbilityId
                });
                addLog(`${currentEnemy.name} cannot find a valid ability to use!`);
                const skipActionData = createActionData(
                    currentEnemy.name,
                    "Skip Turn",
                    "self",
                    [`${currentEnemy.name} had no valid abilities available!`],
                    { hit: false }
                );
                addRecentAction(skipActionData);
                
                // Mark that this enemy has acted (even though skipped)
                roundManager.markCharacterActed(false, enemyIndex);
                
                enemyActionsCompleted++;
                setTimeout(processNextEnemy, 800);
                return;
            }
            
            // Track enemy ability usage for combo system
            lastEnemyAbilities[currentEnemy.id || enemyIndex] = selectedAbilityId;

            // Initialize action tracking for this enemy ability use
            let enemyActionResults = {
                hit: false,
                damage: 0,
                isCritical: false,
                isOverkill: false,
                statusEffects: []
            };
            
            // Store current action tracking globally for executeEnemyAbility to use
            window.currentActionResults = enemyActionResults;

            // Store current log state to capture this action's messages
            const actionMessages = [];
            const captureLog = (message) => {
                addLog(message);
                actionMessages.push(message);
            };

            // Execute enemy ability
            executeEnemyAbility(ability, turnInfo, currentEnemy, enemyIndex, captureLog, player, enemies, battleState);
            
            // Create action data for logging with captured results
            const actionData = createActionData(
                currentEnemy.name,
                ability.name,
                player.name, // Default target for now
                actionMessages,
                window.currentActionResults || enemyActionResults,
                ability // Pass the ability object for image support
            );
            addRecentAction(actionData);
            
            // Mark that this enemy has acted this round
            roundManager.markCharacterActed(false, enemyIndex);
            
            // Clean up global tracking
            window.currentActionResults = null;
            
            enemyActionsCompleted++;

            setTimeout(processNextEnemy, 1200); // Slightly longer delay between enemy actions
        }
        

        processNextEnemy();
    }, 1000);
}

/**
 * Check for enemy combo opportunities
 * @param {Object} currentEnemy - The enemy checking for combos
 * @param {number} enemyIndex - Index of current enemy
 * @param {Array} aliveEnemies - Array of alive enemies
 * @param {Object} player - Player character
 * @param {Object} lastEnemyAbilities - Tracking for combo system
 * @returns {Object|null} - Combo ability data or null
 */
export function checkForEnemyCombo(currentEnemy, enemyIndex, aliveEnemies, player, lastEnemyAbilities) {
    // Only check combos if there are multiple enemies
    if (aliveEnemies.length < 2) return null;
    
    // Dog Pile combo: If another enemy recently used Body Slam/Belly Drop and pinned the player
    if (isStatusActive(player, 'pinned')) {
        const pinnedByAbilities = ['body-slam', 'belly-drop', 'body-slam.js', 'belly-drop.js'];
        
        // Check if any other enemy recently used a pinning ability
        for (let i = 0; i < aliveEnemies.length; i++) {
            if (i === enemyIndex) continue; // Skip current enemy
            const otherEnemy = aliveEnemies[i];
            const otherEnemyId = otherEnemy.id || i;
            const lastAbility = lastEnemyAbilities[otherEnemyId];
            
            if (lastAbility && pinnedByAbilities.some(pin => lastAbility.includes(pin))) {
                // Check if current enemy has a body slam or dogpile ability
                const enemyAbilities = getAbilities(currentEnemy.abilityIds || []);
                const comboAbility = Object.entries(enemyAbilities).find(([id, ability]) => 
                    id.includes('body-slam') || id.includes('dogpile') || 
                    ability.name.toLowerCase().includes('body slam') ||
                    ability.name.toLowerCase().includes('dogpile')
                );
                
                if (comboAbility) {
                    const isDogpile = comboAbility[0].includes('dogpile') || 
                                     comboAbility[1].name.toLowerCase().includes('dogpile');
                    
                    return {
                        abilityId: comboAbility[0],
                        ability: {
                            ...comboAbility[1],
                            // Enhanced combo version with extra bonus for dogpile
                            damage: (comboAbility[1].damage || 0) + (isDogpile ? 20 : 15),
                            comboBonus: {
                                type: isDogpile ? 'enhanced_dogpile' : 'dogpile',
                                combinedWeight: (currentEnemy.misc?.weight || 0) + (otherEnemy.misc?.weight || 0),
                                message: isDogpile ? 
                                    `${currentEnemy.name} performs a devastating dogpile combo with ${otherEnemy.name}!` :
                                    `${currentEnemy.name} piles on top of ${otherEnemy.name}!`
                            }
                        },
                        comboName: isDogpile ? "Enhanced Dogpile" : "Dog Pile",
                        partnerEnemy: otherEnemy
                    };
                }
            }
        }
    }
    
    // Mount combo: If current enemy can mount and there's a suitable ally
    const enemyAbilities = getAbilities(currentEnemy.abilityIds || []);
    if (enemyAbilities['mount']) {
        for (let i = 0; i < aliveEnemies.length; i++) {
            if (i === enemyIndex) continue; // Skip current enemy
            const potentialMount = aliveEnemies[i];
            
            // Check if potential mount is suitable and not already mounted
            if (!isStatusActive(potentialMount, 'mount') && !isStatusActive(potentialMount, 'rider') &&
                !isStatusActive(currentEnemy, 'rider') && !isStatusActive(currentEnemy, 'mount')) {
                
                // Check size requirements
                const mountHeight = potentialMount.misc?.height || 175;
                const mountWeight = potentialMount.misc?.weight || 65;
                const riderHeight = currentEnemy.misc?.height || 175;
                const riderWeight = currentEnemy.misc?.weight || 65;
                
                if (mountHeight >= 180 && mountWeight >= 80 && riderHeight <= 220 && riderWeight <= 120) {
                    return {
                        abilityId: 'mount',
                        ability: {
                            ...enemyAbilities['mount'],
                            comboBonus: {
                                type: 'mount_setup',
                                mountTarget: potentialMount,
                                message: `${currentEnemy.name} attempts to mount ${potentialMount.name}!`
                            }
                        },
                        comboName: "Mount Formation",
                        partnerEnemy: potentialMount
                    };
                }
            }
        }
    }
    
    // Mounted body slam combo: If enemy is riding another and uses body slam
    if (isStatusActive(currentEnemy, 'rider')) {
        const bodySlamAbility = Object.entries(enemyAbilities).find(([id, ability]) => 
            id.includes('body-slam') || ability.name.toLowerCase().includes('body slam')
        );
        
        if (bodySlamAbility) {
            // Find the mount
            const mount = aliveEnemies.find(e => isStatusActive(e, 'mount'));
            if (mount) {
                return {
                    abilityId: bodySlamAbility[0],
                    ability: {
                        ...bodySlamAbility[1],
                        damage: (bodySlamAbility[1].damage || 0) + 25,
                        comboBonus: {
                            type: 'mounted_slam',
                            combinedWeight: (currentEnemy.misc?.weight || 0) + (mount.misc?.weight || 0),
                            message: `${currentEnemy.name} and ${mount.name} dive bomb with crushing force!`,
                            aerialBonus: true
                        }
                    },
                    comboName: "Aerial Crush",
                    partnerEnemy: mount
                };
            }
        }
    }
    
    // Thunder Storm combo: If there are 2+ storm-type enemies
    const stormEnemies = aliveEnemies.filter(e => e.misc.type === 'storm');
    if (stormEnemies.length >= 2 && currentEnemy.misc.type === 'storm') {
        const lightningAbility = Object.entries(enemyAbilities).find(([id, ability]) => 
            ability.type === 'storm' || ability.elementalType === 'storm' || 
            id.includes('lightning') || ability.name.toLowerCase().includes('lightning')
        );

        if (lightningAbility && Math.random() < 0.3) { // 30% chance for combo
            return {
                abilityId: lightningAbility[0],
                ability: {
                    ...lightningAbility[1],
                    damage: (lightningAbility[1].damage || 0) + 20,
                    accuracy: Math.min(100, (lightningAbility[1].accuracy || 90) + 15),
                    comboBonus: {
                        type: 'storm_surge',
                        message: `The storm enemies coordinate their lightning attacks!`
                    }
                },
                comboName: "Thunder Storm Surge"
            };
        }
    }
    
    return null;
}

/**
 * Execute enemy ability against target
 * @param {Object} ability - The ability to execute
 * @param {Object} turnInfo - Turn information including stats
 * @param {Object} currentEnemy - The enemy using the ability
 * @param {number} enemyIndex - Index of current enemy
 * @param {Function} logger - Logging function
 * @param {Object} player - Player character
 * @param {Array} enemies - All enemies array
 * @param {Object} battleState - Battle state object
 */
export function executeEnemyAbility(ability, turnInfo, currentEnemy, enemyIndex, logger, player, enemies, battleState) {
    const activeEnemy = currentEnemy || enemies[0]; // Fallback for single enemy battles
    
    // Determine target based on ability type and preferences
    let target = player; // Default target
    
    // Special handling for mount abilities
    if (ability.name && ability.name.toLowerCase().includes('mount')) {
        // Get the ability data to check preferred target
        const mountAbilityData = (activeEnemy.abilityIds || []).find(abilityData => {
            const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
            return abilityId === 'mount';
        });
        
        const preferredTarget = typeof mountAbilityData === 'object' ? mountAbilityData.preferredTarget : null;
        const aliveEnemies = enemies.filter(e => (e.secondary?.life || e.life || 0) > 0);
        const otherAliveEnemies = aliveEnemies.filter(e => e !== activeEnemy && !e.mountPartner && !e.riderPartner);
        
        if (preferredTarget === 'ally' && otherAliveEnemies.length > 0) {
            // Target a random ally
            target = otherAliveEnemies[Math.floor(Math.random() * otherAliveEnemies.length)];
            logger(`${activeEnemy.name} attempts to mount ally ${target.name}!`);
        } else if (preferredTarget === 'enemy' || otherAliveEnemies.length === 0) {
            // Target the player
            target = player;
            logger(`${activeEnemy.name} attempts to mount ${target.name}!`);
        } else {
            // No preference - prefer allies if available
            if (otherAliveEnemies.length > 0) {
                target = otherAliveEnemies[Math.floor(Math.random() * otherAliveEnemies.length)];
                logger(`${activeEnemy.name} attempts to mount ally ${target.name}!`);
            } else {
                target = player;
                logger(`${activeEnemy.name} attempts to mount ${target.name}!`);
            }
        }
    }
    
    // Log the action (unless it's already logged for mount abilities)
    if (!ability.name || !ability.name.toLowerCase().includes('mount')) {
        logger(`${activeEnemy.name} used ${ability.name} on ${target.name}`);
    }
    
    // Handle combo bonus damage
    if (ability.comboBonus) {
        if (ability.comboBonus.type === 'dogpile') {
            logger(ability.comboBonus.message);
            logger(`Combined weight: ${ability.comboBonus.combinedWeight}kg creates massive impact!`);
        } else if (ability.comboBonus.type === 'storm_surge') {
            logger(ability.comboBonus.message);
        }
    }
    
    // ✨ NEW: Check modular battle interactions FIRST (before accuracy check)
    const battleResult = handleModularBattleInteractions(ability, activeEnemy, target, logger);
    if (!battleResult.canHit) {
        logger(`${activeEnemy.name}'s ${ability.name} cannot reach ${target.name}!`);
        return; // Attack cannot reach target due to range immunity
    }
    
    // Log any interaction messages
    battleResult.messages.forEach(msg => logger(msg));

    // 🎯 ENEMY ATTACK HIT DETECTION - Calculate accuracy and roll for hit/miss
    // For ally targets, accuracy should be different than against enemies
    const isAllyTarget = target !== player;
    let accuracy;
    
    // Extract proper speed values from character objects
    const attackerSpeed = activeEnemy.secondaryAttributes?.speed || activeEnemy.secondary?.speed || activeEnemy.speed || 0;
    const targetSpeed = target.secondaryAttributes?.speed || target.secondary?.speed || target.speed || 0;
    
    if (isAllyTarget) {
        // Mounting allies should have higher accuracy
        accuracy = ability.name && ability.name.toLowerCase().includes('mount') ? 95 : 
                   calculateAccuracy(ability, activeEnemy, target, attackerSpeed, targetSpeed, 1.0);
    } else {
        accuracy = calculateAccuracy(ability, activeEnemy, target, attackerSpeed, targetSpeed, 1.0);
    }
    const roll = Math.floor(Math.random() * 100) + 1;
    


    // 🎯 HIT CHECK: Roll must be <= accuracy to hit (minimum 30% chance guaranteed)
    if (roll <= accuracy) {
        // Update action results - HIT
        if (window.currentActionResults) {
            window.currentActionResults.hit = true;
        }
        
        if (ability.type === "physical" || ability.type === "magic") {
            // Log ability description if available
            if (ability.description) {
                logger(ability.description);
            }
            
            // Calculate all damage using the organized formula  
            let damageInfo = calculateDamage(ability, activeEnemy, target);
            
            
            // Apply any damage multipliers from modular interactions (e.g., swoop down)
            if (battleResult.damageMultiplier !== 1.0) {
                damageInfo.finalDamage = Math.floor(damageInfo.finalDamage * battleResult.damageMultiplier);
                logger(`Battle modifier applied: ${battleResult.damageMultiplier}x damage!`);
            }
            
            // Apply combo bonus damage if present
            if (ability.comboBonus && ability.comboBonus.type === 'dogpile') {
                // Add weight-based bonus damage for dog pile
                const weightBonus = Math.floor(ability.comboBonus.combinedWeight / 5);
                damageInfo.finalDamage += weightBonus;
                logger(`Extra weight damage: +${weightBonus}`);
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
            const critInfo = calculateCriticalHit(ability, activeEnemy, damageInfo.finalDamage, false);
            
            // ✨ NEW: Final damage (fall damage now handled in applyDamage automatically)
            const finalDamage = critInfo.finalDamage;
            
            // Update action results with damage and crit info
            if (window.currentActionResults) {
                window.currentActionResults.damage = finalDamage;
                window.currentActionResults.isCritical = critInfo.isCritical;
            }
            
            if (finalDamage > 0) {
                const damageResult = applyDamage(target, finalDamage, ability, activeEnemy, logger);
                
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
                removeIsHighStatuses(activeEnemy, logger);
            }

            // ✨ Check for forceful break-free from trapped status
            if (finalDamage > 0) {
                handleForcefulBreakFree(activeEnemy, target, logger);
            }

            // ✨ Status effects are now handled automatically by the modular system
        } else {
            // Non-damaging abilities (buffs, healing, etc.)
            // Update action results for non-damage abilities
            if (window.currentActionResults) {
                window.currentActionResults.damage = 0;
            }
            
            // Log ability description if available
            if (ability.description) {
                logger(ability.description);
            }
        }

        // Handle ability effects
        handleAbilityEffects(ability, activeEnemy, target, logger, battleState);
    } else {
        // Update action results - MISS
        if (window.currentActionResults) {
            window.currentActionResults.hit = false;
        }
        
        const targetName = target === player ? "you" : target.name;
        logger(`${activeEnemy.name} uses ${ability.name} but ${targetName} dodge${target === player ? "" : "s"}!`);
    }
}

/**
 * Select enemy ability using weighted random with mount targeting logic
 * @param {Object} enemy - The enemy character
 * @param {Object} enemyAbilities - Available abilities for the enemy
 * @param {Object} player - Player character
 * @param {Array} enemies - All enemies array
 * @param {Object} lastEnemyAbilities - Tracking for combo system
 * @param {string} lastPlayerAbility - Last player ability for combos
 * @returns {string} - Selected ability ID
 */
export function selectEnemyAbility(enemy, enemyAbilities, player, enemies, lastEnemyAbilities, lastPlayerAbility) {
    // Check for mount ability targeting logic with preferred target support
    const mountAbilityData = (enemy.abilityIds || []).find(abilityData => {
        const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
        return abilityId === 'mount';
    });
    
    // If enemy has mount ability, check targeting preferences
    // Don't try to mount if already in a mount partnership (as rider or mount)
    if (mountAbilityData && !enemy.mountPartner && !(enemy.riders && enemy.riders.length > 0) && !player.mountPartner) {
        const aliveEnemies = enemies.filter(e => (e.secondary?.life || e.life || 0) > 0);
        const otherAliveEnemies = aliveEnemies.filter(e => e !== enemy && !e.mountPartner && !e.riderPartner);
        
        // Get preferred target from ability configuration
        const preferredTarget = typeof mountAbilityData === 'object' ? mountAbilityData.preferredTarget : null;
        
        if (preferredTarget === 'ally' && otherAliveEnemies.length > 0) {
            // Strong preference for mounting allies
            let weighted = [];
            
            // Very high priority for mounting allies (80% chance)
            for (let i = 0; i < 12; i++) {
                weighted.push('mount');
            }
            
            // Add other abilities with much lower weight
            (enemy.abilityIds || []).forEach(abilityData => {
                const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
                if (abilityId !== 'mount') {
                    weighted.push(abilityId);
                }
            });
            
            return weighted[Math.floor(Math.random() * weighted.length)];
        }
        else if (preferredTarget === 'enemy' || (!preferredTarget && aliveEnemies.length === 1)) {
            // Prefer mounting enemies (player) or default behavior when alone
            const enemySize = enemy.size || 2;
            const playerSize = player.size || 2;
            
            // Mount player with moderate priority
            let weighted = [];
            
            // Priority based on size advantage
            const mountPriority = enemySize >= playerSize ? 6 : 3;
            for (let i = 0; i < mountPriority; i++) {
                weighted.push('mount');
            }
            
            // Add other abilities
            (enemy.abilityIds || []).forEach(abilityData => {
                const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
                if (abilityId !== 'mount') {
                    for (let j = 0; j < 4; j++) {
                        weighted.push(abilityId);
                    }
                }
            });
            
            return weighted[Math.floor(Math.random() * weighted.length)];
        }
        else if (!preferredTarget) {
            // No preference specified - use default logic (prefer allies if available, otherwise player)
            if (otherAliveEnemies.length > 0) {
                // Default to ally mounting if no preference specified
                let weighted = [];
                for (let i = 0; i < 8; i++) {
                    weighted.push('mount');
                }
                (enemy.abilityIds || []).forEach(abilityData => {
                    const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
                    if (abilityId !== 'mount') {
                        weighted.push(abilityId);
                    }
                });
                return weighted[Math.floor(Math.random() * weighted.length)];
            }
        }
    }
    
    // Filter available abilities based on status requirements and combo requirements
    const availableAbilityIds = (enemy.abilityIds || []).filter(abilityData => {
        const abilityId = typeof abilityData === 'string' ? abilityData : abilityData.id;
        const ability = enemyAbilities[abilityId];
        if (!ability) return false;
        
        // Prevent mount ability if already a rider (like buff abilities)
        if (abilityId === 'mount' && enemy.mountPartner) {
            return false;
        }
        
        // Check status requirements
        if (ability.requiresStatusSelf && !isStatusActive(enemy, ability.requiresStatusSelf)) return false;
        if (ability.requiresStatusTarget && !isStatusActive(player, ability.requiresStatusTarget)) return false;
        if (ability.requiresStatus && !isStatusActive(player, ability.requiresStatus)) return false;
        
        // Check combo requirements using the enhanced system
        if (ability.combo && ability.combo.followsFrom && ability.combo.followsFrom.length > 0) {
            const comboType = ability.combo.type || 'self';
            const requiredAbilities = ability.combo.followsFrom;
            let comboMet = false;

            switch (comboType) {
                case 'self':
                    // Enemy must have used one of the required abilities last turn
                    const enemyId = enemy.id || enemies.indexOf(enemy);
                    const lastEnemyAbility = lastEnemyAbilities[enemyId];
                    comboMet = lastEnemyAbility && requiredAbilities.includes(lastEnemyAbility);
                    break;

                case 'ally':
                    // Another enemy ally must have used one of the required abilities recently
                    for (const otherEnemyId in lastEnemyAbilities) {
                        if (otherEnemyId !== (enemy.id || enemies.indexOf(enemy))) {
                            const lastAbility = lastEnemyAbilities[otherEnemyId];
                            if (lastAbility && requiredAbilities.includes(lastAbility)) {
                                comboMet = true;
                                break;
                            }
                        }
                    }
                    break;

                case 'any':
                    // Any character (player or any enemy) must have used one of the required abilities
                    // Check player
                    if (lastPlayerAbility && requiredAbilities.includes(lastPlayerAbility)) {
                        comboMet = true;
                    }
                    
                    // Check all enemies if not already met
                    if (!comboMet) {
                        for (const enemyId in lastEnemyAbilities) {
                            const lastAbility = lastEnemyAbilities[enemyId];
                            if (lastAbility && requiredAbilities.includes(lastAbility)) {
                                comboMet = true;
                                break;
                            }
                        }
                    }
                    break;

                default:
                    comboMet = false;
                    break;
            }

            if (!comboMet) return false;
        }
        
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
    
    // Final defensive check - ensure we have at least one ability
    if (weighted.length === 0) {
        console.warn(`Enemy ${enemy.name} has no abilities in weighted array!`, {
            abilityIds: enemy.abilityIds,
            availableAbilityIds,
            enemyAbilities: Object.keys(enemyAbilities)
        });
        // Return the first available ability ID as fallback
        const firstAbilityId = (enemy.abilityIds && enemy.abilityIds.length > 0) 
            ? (typeof enemy.abilityIds[0] === 'string' ? enemy.abilityIds[0] : enemy.abilityIds[0].id)
            : null;
        return firstAbilityId;
    }
    
    return weighted[Math.floor(Math.random() * weighted.length)];
}
