// battle-logging.js - Battle message and history management

/**
 * Initialize battle logging system
 * @returns {Object} - Battle logging functions and state
 */
export function createBattleLogger() {
    let battleLog = [];            // Current "turn" log messages
    let groupedBattleLogs = [];    // All grouped logs for this battle
    let recentActions = [];        // Last few actions for recent display (max 2-3 actions)

    const logDiv = document.getElementById("combat-log");
    const recentDiv = document.getElementById("combat-recent");

    /**
     * Add a message to the current turn's log
     * @param {string} msg - Message to add
     */
    function addLog(msg) {
        battleLog.push(msg);

        // Show current turn messages in the recentDiv
        const recentGroups = battleLog.slice().map(m => `<div>${m}</div>`).join("");
        recentDiv.innerHTML = recentGroups;

        // Auto-scroll log
        logDiv.scrollTop = logDiv.scrollHeight;
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

        // Update recent display
        updateRecentDisplay();
    }

    /**
     * Update the recent actions display
     */
    function updateRecentDisplay() {
        const recentHTML = recentActions.map(action => {
            const messagesHTML = action.messages.map(msg => `<div class="recent-message">${msg}</div>`).join("");
            return `<div class="recent-action">
                <div class="recent-summary">${action.summary}</div>
                ${messagesHTML}
            </div>`;
        }).join("");

        recentDiv.innerHTML = recentHTML;
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
     * Clear all battle logs
     */
    function clearLogs() {
        battleLog = [];
        groupedBattleLogs = [];
        recentActions = [];
        logDiv.innerHTML = "";
        recentDiv.innerHTML = "";
    }

    return {
        addLog,
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
 */
export function logDamage(damageInfo, critInfo, ability, addLog) {
    if (damageInfo.finalDamage > 0) {
        if (critInfo.isCritical) {
            addLog(`CRITICAL HIT! ${critInfo.finalDamage} damage!`);
            if (ability.onCrit) {
                addLog(ability.onCrit);
            }
        } else {
            addLog(`${critInfo.finalDamage} damage!`);
        }

        // Log size advantage/disadvantage
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
        }
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