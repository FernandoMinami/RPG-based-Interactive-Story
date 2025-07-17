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
            console.log(`Loaded status: ${status.id}`);
        } catch (e) {
            console.error(`Failed to load status: ${status.file}`, e);
        }
    }
}


/**
 * Applies a status to an entity using the registered status module.
 */
export function applyStatus(entity, statusId, turns = 1, addLog = null) {
    const status = StatusRegistry[statusId];
    if (!status) {
        console.warn(`Status "${statusId}" not found in registry.`);
        return;
    }

    status.apply(entity, turns);

    if (addLog) {
        if (status.permanent) {
            addLog(`${entity.name} is now affected by ${statusId} (permanent)!`);
        } else {
            addLog(`${entity.name} is now affected by ${statusId} for ${turns} turns!`);
        }
    }
}

/**
 * Updates all active statuses on an entity by calling their update handlers.
 */
export function updateStatuses(entity, addLog) {
    if (!entity.status) return;

    for (let statusId in entity.status) {
        const statusModule = StatusRegistry[statusId];
        if (statusModule && typeof statusModule.update === 'function') {
            statusModule.update(entity, addLog);
        } else {
            console.warn(`No update method for status "${statusId}"`);
        }
    }
}

/**
 * Checks if an entity currently has a status.
 */
export function isStatusActive(entity, statusId) {
    return entity.status && entity.status[statusId] !== undefined;
}

/**
 * Generates a string summary of an entity's active statuses.
 */
export function statusSummary(entity) {
    if (!entity.status) return "No status effects";

    const summaries = [];

    for (let statusId in entity.status) {
        const statusModule = StatusRegistry[statusId];
        if (statusModule && typeof statusModule.summary === 'function') {
            summaries.push(statusModule.summary(entity));
        } else {
            summaries.push(statusId);
        }
    }

    return summaries.length ? summaries.join(", ") : "No status effects";
}
