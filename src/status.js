// status.js

export const StatusRegistry = {};

/**
 * Dynamically loads all statuses from a manifest.
 */
export async function loadStatuses(statusManifest, statusBasePath = "../story-content/story01-battle-st/statuses/") {
    if (!Array.isArray(statusManifest)) {
        throw new TypeError('statusManifest must be an array');
    }
    
    for (let status of statusManifest) {
        try {
            const statusModule = await import(`${statusBasePath}${status.file}`);
            StatusRegistry[status.id] = statusModule.default;
        } catch (e) {
            console.error(`Failed to load status: ${status.file}`, e);
        }
    }
}

/**
 * Apply a status effect to a target
 */
export function applyStatus(target, statusId, turns = 1, addLog = () => {}, permanent = false) {
    if (!StatusRegistry[statusId]) {
        console.warn(`Status ${statusId} not found in registry`);
        return;
    }

    const statusDef = StatusRegistry[statusId];
    target.status = target.status || {};
    
    if (permanent || statusDef.permanent) {
        target.status[statusId] = { permanent: true };
    } else {
        target.status[statusId] = turns;
    }

    // Apply initial effect
    if (statusDef.apply) {
        statusDef.apply(target);
    }
    
    addLog(`${target.name} is now ${statusDef.summary ? statusDef.summary(target) : statusId}!`);
}

/**
 * Check if a target has a specific status effect active
 */
export function isStatusActive(target, statusId) {
    if (!target.status) return false;
    const statusValue = target.status[statusId];
    
    if (typeof statusValue === 'object' && statusValue.permanent) {
        return true;
    }
    
    return statusValue && statusValue > 0;
}

/**
 * Update all status effects on a target (called each turn)
 */
export function updateStatuses(target, addLog = () => {}) {
    if (!target.status) return;

    for (const [statusId, statusValue] of Object.entries(target.status)) {
        const statusDef = StatusRegistry[statusId];
        if (!statusDef) continue;

        // Update status effect
        if (statusDef.update) {
            statusDef.update(target, addLog);
        }

        // Handle turn counting for non-permanent effects
        if (typeof statusValue === 'number') {
            target.status[statusId] = Math.max(0, statusValue - 1);
            
            if (target.status[statusId] === 0) {
                delete target.status[statusId];
                if (statusDef.remove) {
                    statusDef.remove(target, addLog);
                }
            }
        }
    }
}

/**
 * Get a summary string of all active status effects
 */
export function statusSummary(target) {
    if (!target.status) return 'No status effects';
    
    const activeStatuses = Object.keys(target.status)
        .filter(statusId => isStatusActive(target, statusId))
        .map(statusId => {
            const statusDef = StatusRegistry[statusId];
            return statusDef && statusDef.summary ? statusDef.summary(target) : statusId;
        });
    
    return activeStatuses.length > 0 ? activeStatuses.join(', ') : 'No status effects';
}
