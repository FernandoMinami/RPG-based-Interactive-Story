// battle-logging.js - Simplified Battle Logging System

/**
 * Create a battle logger with simplified structure
 * @returns {Object} - Battle logging functions
 */
export function createBattleLogger() {
    let battleLog = [];           // All messages for the entire battle
    let currentRound = [];        // Current round data
    let allRounds = [];          // All completed rounds for history
    let currentRoundNumber = 1;   // Track round number
    let totalParticipants = 1;    // Player + enemies count

    // DOM elements for display
    const logDiv = document.getElementById("combat-log");
    const recentDiv = document.getElementById("combat-recent");

    /**
     * Initialize the logger for a new battle
     * @param {number} enemyCount - Number of enemies in the battle
     */
    function initializeBattle(enemyCount) {
        totalParticipants = 1 + enemyCount; // Player + enemies
        clearLogs();
        addRecentRound();
    }

    /**
     * Update the main combat log display with proper round grouping
     */
    function updateMainLogDisplay() {
        if (!logDiv) return;
        
        let displayHTML = '';
        
        // Show completed rounds first
        allRounds.forEach(round => {
            displayHTML += `<div style="margin: 10px 0; border: 1px solid #666; padding: 8px; background-color: rgba(0,0,0,0.1);">`;
            displayHTML += `<div style="font-weight: bold; color: #444; margin-bottom: 5px;">Round ${round.roundNumber}</div>`;
            
            round.actions.forEach(action => {
                displayHTML += `<div style="margin: 3px 0; padding-left: 10px;">`;
                displayHTML += `<strong>${action.actor}</strong> used <em>${action.actionName}</em> on <strong>${action.target}</strong>`;
                
                // Add ability image button if ability has an image
                if (action.ability && action.ability.img) {
                    const imageSrc = window.getAbilityImageSrc ? window.getAbilityImageSrc(action.ability.img) : action.ability.img;
                    displayHTML += ` <button class="history-image-btn" onclick="showAbilityImageModal('${imageSrc}', '${action.ability.name || action.actionName}')">Show Attack Image</button>`;
                }
                
                if (action.messages && action.messages.length > 0) {
                    action.messages.forEach(msg => {
                        displayHTML += `<div style="margin-left: 15px; font-size: 0.9em; color: #666;">${msg}</div>`;
                    });
                }
                displayHTML += `</div>`;
            });
            
            // Show environmental effects
            if (round.environmentalEffects && round.environmentalEffects.length > 0) {
                displayHTML += `<div style="margin-top: 5px; font-style: italic; color: #888;">`;
                round.environmentalEffects.forEach(effect => {
                    displayHTML += `<div style="margin-left: 10px;">${effect}</div>`;
                });
                displayHTML += `</div>`;
            }
            
            displayHTML += `</div>`;
        });
        
        // Show current round in progress
        if (currentRound.length > 0) {
            displayHTML += `<div style="margin: 10px 0; border: 1px solid #999; padding: 8px;">`;
            displayHTML += `<div style="font-weight: bold; margin-bottom: 5px;">Round ${currentRoundNumber} (In Progress)</div>`;
            
            currentRound.forEach(action => {
                displayHTML += `<div style="margin: 3px 0; padding-left: 10px;">`;
                displayHTML += `<strong>${action.actor}</strong> used <em>${action.actionName}</em> on <strong>${action.target}</strong>`;
                if (action.messages && action.messages.length > 0) {
                    action.messages.forEach(msg => {
                        displayHTML += `<div style="margin-left: 15px; font-size: 0.9em;">${msg}</div>`;
                    });
                }
                displayHTML += `</div>`;
            });
            
            displayHTML += `</div>`;
        }
        
        // Show any additional battle log messages that aren't part of actions
        const additionalMessages = battleLog.filter(msg => {
            // Filter out messages that are already shown in the action displays
            return !allRounds.some(round => 
                round.actions.some(action => 
                    action.messages.includes(msg)
                )
            ) && !currentRound.some(action => 
                action.messages.includes(msg)
            );
        });
    
        
        logDiv.innerHTML = displayHTML;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    /**
     * Add messages to the main battle log
     * @param {string|Array<string>} messages - Message(s) to add
     */
    function addMessagesToLog(messages) {
        if (typeof messages === 'string') {
            battleLog.push(messages);
        } else if (Array.isArray(messages)) {
            battleLog.push(...messages);
        }
        
        // Update the main combat log display with proper formatting
        updateMainLogDisplay();
    }

    /**
     * Start a new round
     */
    function addRecentRound() {
        // Finalize previous round if it exists
        if (currentRound.length > 0) {
            allRounds.push({
                roundNumber: currentRoundNumber - 1,
                actions: [...currentRound],
                environmentalEffects: []
            });
        }

        // Start new round
        currentRound = [];
        currentRoundNumber++;
    }

    /**
     * Add an action to the current round
     * @param {Object} actionData - Action details
     * @param {string} actionData.actor - Who performed the action (e.g., "Player", "Enemy 1")
     * @param {string} actionData.actionName - Name of the action/ability used
     * @param {string} actionData.target - Target of the action
     * @param {Array<string>} actionData.messages - All messages from this action
     * @param {Object} actionData.results - Action results (damage, hit/miss, crit, overkill)
     */
    function addRecentAction(actionData) {
        const action = {
            actor: actionData.actor,
            actionName: actionData.actionName,
            target: actionData.target,
            messages: actionData.messages || [],
            results: {
                hit: actionData.results?.hit || false,
                damage: actionData.results?.damage || 0,
                isCritical: actionData.results?.isCritical || false,
                isOverkill: actionData.results?.isOverkill || false,
                statusEffects: actionData.results?.statusEffects || []
            },
            ability: actionData.ability || null, // Store ability data including image
            timestamp: Date.now()
        };

        currentRound.push(action);

        // Update recent actions display
        updateRecentDisplay();

        // Add messages to main log
        addMessagesToLog(actionData.messages);
    }

    /**
     * Log environmental effects at the end of a round
     * @param {Array<string>} effects - Environmental effect messages
     */
    function logEnvironmentalEffects(effects) {
        if (effects && effects.length > 0) {
            // Add to current round if it exists in allRounds
            if (allRounds.length > 0) {
                allRounds[allRounds.length - 1].environmentalEffects.push(...effects);
            }

            // Add to main log
            addMessagesToLog(effects);

            // Update recent display to show environmental effects
            updateRecentDisplay();
        }
    }

    /**
     * Update the recent actions display
     */
    function updateRecentDisplay() {
        if (!recentDiv) return;

        let recentHTML = '';

        // Show current round actions
        if (currentRound.length > 0) {
            recentHTML += `<div class="current-round">
                <h4>Current Round ${currentRoundNumber}</h4>`;
            
            currentRound.forEach(action => {
                recentHTML += `<div class="recent-action" style="margin-bottom: 10px; border: 1px solid #ccc; padding: 8px;">
                    <div class="action-summary" style="font-weight: bold; margin-bottom: 5px;">
                        <strong>${action.actor}</strong> used <em>${action.actionName}</em> on <strong>${action.target}</strong>
                    </div>`;
                        
                // Show ability image directly if ability has an image
                if (action.ability && action.ability.img) {
                    const imageSrc = window.getAbilityImageSrc ? window.getAbilityImageSrc(action.ability.img) : action.ability.img;
                    recentHTML += `<div style="text-align: center; margin: 8px 0;">
                        <img src="${imageSrc}" alt="${action.ability.name || action.actionName}" 
                             style="max-width: 150px; max-height: 100px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #666; cursor: pointer;" 
                             onclick="showAbilityImageModal('${imageSrc}', '${action.ability.name || action.actionName}')" 
                             onerror="this.style.display='none'">
                    </div>`;
                }
                
                // Show hit/miss and damage info
                if (action.results.hit) {
                    recentHTML += `<div class="action-results">`;
                    if (action.results.damage > 0) {
                        recentHTML += ` <span></span>`;
                    }
                    if (action.results.isCritical) {
                        recentHTML += ` <span></span>`;
                    }
                    if (action.results.isOverkill) {
                        recentHTML += ` <span></span>`;
                    }
                    recentHTML += `</div>`;
                } else {
                    recentHTML += `<div class="action-results">But you Dodged</div>`;
                }
                
                // Show messages if any
                if (action.messages && action.messages.length > 0) {
                    recentHTML += `<div class="action-messages" style="margin-top: 5px; font-size: 0.9em; color: #666;">`;
                    action.messages.forEach(msg => {
                        recentHTML += `<div class="message">${msg}</div>`;
                    });
                    recentHTML += `</div>`;
                }
                
                recentHTML += `</div>`;
            });
            
            recentHTML += `</div>`;
        }

        // Show environmental effects if any
        if (allRounds.length > 0) {
            const lastRound = allRounds[allRounds.length - 1];
            if (lastRound.environmentalEffects.length > 0) {
                recentHTML += `<div class="environmental-effects">
                    <h5>Environmental Effects</h5>
                    ${lastRound.environmentalEffects.map(effect => `<div class="env-effect">${effect}</div>`).join('')}
                </div>`;
            }
        }

        recentDiv.innerHTML = recentHTML;
    }

    /**
     * Finalize the current round and prepare for history
     * @param {Function} pushToHistory - Function to push the round to history (optional, only for individual rounds)
     */
    function finalizeRoundLog(pushToHistory = null) {
        if (currentRound.length > 0) {
            // Create final round object
            const finalRound = {
                roundNumber: currentRoundNumber,
                actions: [...currentRound],
                environmentalEffects: []
            };

            // Add to completed rounds
            allRounds.push(finalRound);

            // Only push individual rounds to history if specifically requested
            // This should typically NOT be called during battle, only at battle end
            if (typeof pushToHistory === 'function' && pushToHistory.name === 'forceRoundToHistory') {
                // Convert to format expected by history system for individual rounds
                const historyFormat = finalRound.actions.map(action => ({
                    summary: `${action.actor} used ${action.actionName}`,
                    messages: action.messages,
                    timestamp: action.timestamp
                }));
                
                // Get enemy name from the round actions
                const enemyName = finalRound.actions.find(action => action.actor !== "Character00")?.actor || "Enemy";
                const summary = `Round ${finalRound.roundNumber} completed`;
                
                pushToHistory(enemyName, historyFormat, summary);
            }

            // Start new round
            addRecentRound();
        }
    }

    /**
     * Get all rounds for history export
     * @returns {Array} - All rounds data
     */
    function getAllRounds() {
        return [...allRounds];
    }

    /**
     * Get current battle log messages
     * @returns {Array} - All battle log messages
     */
    function getBattleLog() {
        return [...battleLog];
    }

    /**
     * Clear all logs for a new battle
     */
    function clearLogs() {
        battleLog = [];
        currentRound = [];
        allRounds = [];
        currentRoundNumber = 1;

        // Clear display elements
        if (logDiv) logDiv.innerHTML = '';
        if (recentDiv) recentDiv.innerHTML = '';

        // Hide rewards div
        const rewardsDiv = document.getElementById("combat-rewards");
        if (rewardsDiv) {
            rewardsDiv.style.display = "none";
            rewardsDiv.innerHTML = "";
        }
    }

    /**
     * Complete the entire battle and send all rounds to history
     * @param {Function} addBattleToHistory - Function to add complete battle to history
     * @param {string} enemyNames - Names of enemies fought
     * @param {string} battleSummary - Battle result summary
     */
    function completeBattle(addBattleToHistory, enemyNames, battleSummary) {
        // Finalize any remaining round without pushing to history
        if (currentRound.length > 0) {
            const finalRound = {
                roundNumber: currentRoundNumber,
                actions: [...currentRound],
                environmentalEffects: []
            };
            allRounds.push(finalRound);
        }

        // Send the complete battle log to history as one entry
        if (typeof addBattleToHistory === 'function') {
            addBattleToHistory(enemyNames, allRounds, battleSummary);
        }
    }

    /**
     * Check if round is complete based on participant count
     * @returns {boolean} - True if all participants have acted
     */
    function isRoundComplete() {
        return currentRound.length >= totalParticipants;
    }

    /**
     * Force completion of current round (called by round manager)
     */
    function forceRoundCompletion() {
        if (currentRound.length > 0) {
            // Create final round object
            const finalRound = {
                roundNumber: currentRoundNumber,
                actions: [...currentRound],
                environmentalEffects: []
            };

            // Add to completed rounds
            allRounds.push(finalRound);

            // Start new round
            currentRound = [];
            currentRoundNumber++;
            
            // Update the main log display to show the completed round
            updateMainLogDisplay();
        }
    }

    return {
        initializeBattle,
        addMessagesToLog,
        addRecentRound,
        addRecentAction,
        logEnvironmentalEffects,
        finalizeRoundLog,
        forceRoundCompletion,
        completeBattle,
        clearLogs,
        getAllRounds,
        getBattleLog,
        isRoundComplete,
        
        // Backward compatibility methods
        addLog: addMessagesToLog,
        getBattleLogLength: () => battleLog.length,
        getCurrentBattleLogMessages: (fromIndex) => battleLog.slice(fromIndex),
        getGroupedLogs: getAllRounds
    };
}

/**
 * Helper function to create action data for logging
 * @param {string} actor - Who performed the action
 * @param {string} actionName - Name of the action
 * @param {string} target - Target of the action
 * @param {Array<string>} messages - Action messages
 * @param {Object} results - Action results
 * @param {Object} ability - The ability used (optional, for image support)
 * @returns {Object} - Formatted action data
 */
export function createActionData(actor, actionName, target, messages, results = {}, ability = null) {
    return {
        actor,
        actionName,
        target,
        messages: Array.isArray(messages) ? messages : [messages],
        results: {
            hit: results.hit || false,
            damage: results.damage || 0,
            isCritical: results.isCritical || false,
            isOverkill: results.isOverkill || false,
            statusEffects: results.statusEffects || []
        },
        ability: ability // Include ability data for image support
    };
}

/**
 * Log damage results - utility function for backward compatibility
 * @param {Object} damageInfo - Damage calculation results
 * @param {Object} critInfo - Critical hit information
 * @param {Object} ability - The ability used
 * @param {Function} addLog - Logging function
 * @param {number} actualFinalDamage - The actual final damage
 * @param {boolean} isOverkill - Whether this attack was an overkill
 */
export function logDamage(damageInfo, critInfo, ability, addLog, actualFinalDamage = null, isOverkill = false) {
    const displayDamage = actualFinalDamage || damageInfo.finalDamage;
    
    if (displayDamage > 0) {
        // Priority 1: Overkill message
        if (isOverkill && ability.onOverkill) {
            addLog(ability.onOverkill);
            addLog(`${displayDamage} damage!`);
        }
        // Priority 2: Critical hit message
        else if (critInfo.isCritical) {
            addLog(`CRITICAL HIT! ${displayDamage} damage!`);
            if (ability.onCrit) {
                addLog(ability.onCrit);
            }
        }
        // Priority 3: Regular hit message
        else {
            if (ability.onHit) {
                addLog(ability.onHit);
            }
            addLog(`${displayDamage} damage!`);
        }
    }
}

/**
 * Log ability hit/miss results - utility function for backward compatibility
 * @param {boolean} hit - Whether the ability hit
 * @param {Object} ability - The ability used
 * @param {string} attackerName - Name of the attacker
 * @param {Function} addLog - Logging function
 */
export function logAttackResult(hit, ability, attackerName, addLog) {
    if (hit) {
        addLog(ability.onHit || `The ${ability.name} hits!`);
    } else {
        addLog(ability.onMiss || `The ${ability.name} misses!`);
    }
}
