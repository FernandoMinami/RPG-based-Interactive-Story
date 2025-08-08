// loot.js - Loot management and loading system

let lootRegistry = {};

/**
 * Load loot definitions from the current story
 * @param {string} storyId - The story identifier
 */
export async function loadLoot(storyId) {
    try {
        // Load the manifest as a regular fetch request instead of module import
        const manifestResponse = await fetch(`../story-content/${storyId}/loot/_loot.json`);
        if (!manifestResponse.ok) {
            throw new Error(`Failed to fetch loot manifest: ${manifestResponse.status}`);
        }
        
        const lootManifest = await manifestResponse.json();
        
        lootRegistry = {};
        
        for (const lootDef of lootManifest) {
            try {
                const lootModule = await import(`../story-content/${storyId}/loot/${lootDef.file}`);
                lootRegistry[lootDef.id] = lootModule.default;
            } catch (error) {
                console.error(`Failed to load loot ${lootDef.id}:`, error);
            }
        }
        
    } catch (error) {
        console.error("Failed to load loot manifest:", error);
        lootRegistry = {};
    }
}

/**
 * Get loot definitions by IDs
 * @param {Array} lootIds - Array of loot IDs to retrieve
 * @returns {Object} - Object mapping loot IDs to their definitions
 */
export function getLoot(lootIds) {
    const result = {};
    for (const lootId of lootIds) {
        if (lootRegistry[lootId]) {
            result[lootId] = lootRegistry[lootId];
        } else {
            console.warn(`Loot not found: ${lootId}`);
        }
    }
    return result;
}

/**
 * Get a single loot item definition
 * @param {string} lootId - The loot ID to retrieve
 * @returns {Object|null} - The loot definition or null if not found
 */
export function getLootById(lootId) {
    return lootRegistry[lootId] || null;
}

/**
 * Get all available loot items
 * @returns {Object} - All loot items in the registry
 */
export function getAllLoot() {
    return { ...lootRegistry };
}

/**
 * Check if a loot item exists
 * @param {string} lootId - The loot ID to check
 * @returns {boolean} - True if the loot exists
 */
export function hasLoot(lootId) {
    return !!lootRegistry[lootId];
}

// Debug access
window._debugLootRegistry = () => lootRegistry;
