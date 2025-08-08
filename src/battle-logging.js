// battle-logging.js - Battle message and history management

/**
 * Initialize battle logging system
 * @returns {Object} - Battle logging functions and state
 */
export function createBattleLogger() {
    let battleLog = [];            // Current "turn" log messages
    let groupedBattleLogs = [];    // All grouped logs for this battle
    let recentActions = [];        // Last few actions for recent display (max 2-3 actions)
    let systemMessages = [];       // System messages like buff expiration

    const logDiv = document.getElementById("combat-log");
    const recentDiv = document.getElementById("combat-recent");

    /**
     * Add a message to the current turn's log
     * @param {string} msg - Message to add
     */
    function addLog(msg) {
        battleLog.push(msg);

        // Don't update recentDiv here - let updateRecentDisplay handle it
        // Auto-scroll main log
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    /**
     * Add a system message (like buff expiration) that appears below recent actions
     * @param {string} msg - System message to add
     */
    function addSystemMessage(msg) {
        systemMessages.push(msg);
        updateRecentDisplay();
    }

    /**
     * Add an action to the recent actions display
     * @param {string} actionSummary - Summary of the action (e.g., "Player used Quick Attack")
     * @param {Array} actionMessages - All messages from this action
     */
    function addRecentAction(actionSummary, actionMessages) {
        // Add to recent actions list
        recentActions.push({
            summary: actionSummary,
            messages: actionMessages,
            timestamp: Date.now()
        });

        // Keep only the last 2 actions (most recent player and enemy)
        if (recentActions.length > 2) {
            recentActions.shift();
        }

        // Clear system messages when new actions occur
        systemMessages = [];

        // Update recent display
        updateRecentDisplay();
    }

    /**
     * Update the recent actions display
     */
    function updateRecentDisplay() {
        // Build recent actions HTML
        const recentHTML = recentActions.map(action => {
            const messagesHTML = action.messages.map(msg => `<div class="recent-message">${msg}</div>`).join("");
            return `<div class="recent-action">
                <div class="recent-summary">${action.summary}</div>
                ${messagesHTML}
            </div>`;
        }).join("");

        // Build system messages HTML
        const systemHTML = systemMessages.map(msg => 
            `<div class="system-message" style="color: #ccc; font-style: italic; margin-top: 8px;">${msg}</div>`
        ).join("");

        // Combine both in recentDiv
        recentDiv.innerHTML = recentHTML + systemHTML;
    }

    /**
     * Separate the current turn's messages into a grouped log
     */
    function separateLog() {
        if (battleLog.length === 0) return; // Nothing to group

        // Display in logDiv with proper formatting
        const formattedMessages = battleLog.map(msg => `<div>${msg}</div>`).join('');
        logDiv.innerHTML += `<div class="battle-log-group">${formattedMessages}</div>`;

        // Save this group for history (keep turns as groups)
        groupedBattleLogs.push([...battleLog]);

        // Clear current turn log
        battleLog = [];
    }

    /**
     * Get all grouped battle logs for history
     * @returns {Array} - Array of grouped log strings
     */
    function getGroupedLogs() {
        return [...groupedBattleLogs];
    }

    /**
     * Get the current length of the battle log
     * @returns {number} - Current battle log length
     */
    function getBattleLogLength() {
        return battleLog.length;
    }

    /**
     * Get messages added since a specific point
     * @param {number} fromIndex - Starting index to get messages from
     * @returns {Array} - Array of messages
     */
    function getCurrentBattleLogMessages(fromIndex) {
        return battleLog.slice(fromIndex);
    }

    /**
     * Clear all battle logs and rewards
     */
    function clearLogs() {
        battleLog = [];
        groupedBattleLogs = [];
        recentActions = [];
        systemMessages = [];
        logDiv.innerHTML = "";
        recentDiv.innerHTML = "";
        
        // Hide rewards div at battle start
        const rewardsDiv = document.getElementById("combat-rewards");
        if (rewardsDiv) {
            rewardsDiv.style.display = "none";
            rewardsDiv.innerHTML = "";
        }
    }

    return {
        addLog,
        addSystemMessage,
        addRecentAction,
        getBattleLogLength,
        getCurrentBattleLogMessages,
        separateLog,
        getGroupedLogs,
        clearLogs
    };
}

/**
 * Log damage dealt in battle
 * @param {Object} damageInfo - Damage calculation results
 * @param {Object} critInfo - Critical hit information
 * @param {Object} ability - The ability used
 * @param {Function} addLog - Logging function
 * @param {number} actualFinalDamage - The actual final damage after all calculations (optional)
 * @param {boolean} isOverkill - Whether this attack was an overkill (optional)
 */
export function logDamage(damageInfo, critInfo, ability, addLog, actualFinalDamage = null, isOverkill = false) {
    const displayDamage = actualFinalDamage || damageInfo.finalDamage;
    
    if (displayDamage > 0) {
        // Priority 1: Overkill message (replaces normal hit message entirely)
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

        /*// Log size advantage/disadvantage
        if (damageInfo.sizeBonus > 0) {
            addLog("Size advantage increases damage!");
        } else if (damageInfo.sizeBonus < 0) {
            addLog("Size disadvantage reduces damage!");
        }

        // Log weight bonus
        if (damageInfo.weightBonus > 0) {
            addLog("Heavy impact from massive weight!");
        }

        if (damageInfo.defenseBypass) {
            addLog("Defense bypassed!");
        }*/
    }
}

/**
 * Log ability hit/miss results
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