/**
 * Save and Load system for the Interactive Story Game
 */

/**
 * Create a save data object with all necessary game state
 * @returns {Object} Complete save data
 */
export function createSaveData() {
    if (!window.player || !window.selectedStory) {
        console.error("Cannot save: player or story not loaded");
        return null;
    }

    const saveData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        story: {
            id: window.selectedStory.id || window.selectedStory.name,
            name: window.selectedStory.name,
            folder: window.selectedStory.folder
        },
        player: {
            id: window.player.id,
            name: window.player.name,
            level: window.player.level || 1,
            exp: window.player.exp || 0,
            experience: window.player.experience || 0,
            attributePoints: window.player.attributePoints || 0,
            height: window.player.height,
            weight: window.player.weight,
            hp: window.player.hp,
            maxHp: window.player.maxHp,
            life: window.player.life,
            maxLife: window.player.maxLife,
            mp: window.player.mp || 0,
            maxMp: window.player.maxMp || 0,
            mana: window.player.mana || 0,
            maxMana: window.player.maxMana || 0,
            manaRegen: window.player.manaRegen || 0,
            attributes: { ...window.player.attributes },
            secondary: { ...window.player.secondary },
            equipment: { ...window.player.equipment },
            statuses: [...(window.player.statuses || [])],
            abilityIds: [...(window.player.abilityIds || [])]
        },
        inventory: {
            items: {},
            loot: {},
            money: 0 // Will be set correctly in downloadSave
        },
        progress: {
            currentNode: window.currentNode || "",
            playerPath: [...(window.playerPath || [])],
            visitedNodes: [...(window.visitedNodes || [])]
        },
        gameState: {
            battleJustHappened: window.battleJustHappened || false,
            historyLog: [...(window.historyLog || [])]
        }
    };

    return saveData;
}

/**
 * Download save data as a JSON file
 */
export async function downloadSave() {
    try {
        // Import getMoney and getInventoryState to get current values
        const { getMoney, getInventoryState } = await import('./inventory.js');
        
        const saveData = createSaveData();
        if (!saveData) {
            alert("Cannot create save file. Make sure you have a character loaded and a story selected.");
            return;
        }

        // Set the correct inventory and money values
        const currentInventory = getInventoryState();
        saveData.inventory = currentInventory;

        const dataStr = JSON.stringify(saveData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        
        // Create filename with story and character name
        const filename = `save_${saveData.story.name.replace(/[^a-zA-Z0-9]/g, '')}_${saveData.player.name.replace(/[^a-zA-Z0-9]/g, '')}_${new Date().toISOString().slice(0, 10)}.json`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        // Show success message
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px; border-radius: 5px; z-index: 10000; font-family: Arial, sans-serif;';
        notification.innerHTML = `
        <strong>Game Saved!</strong><br>
        <small>Downloaded: ${filename}</small>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
    
    } catch (error) {
        console.error("Error downloading save:", error);
        alert("Error creating save file: " + error.message);
    }
}

/**
 * Validate save data structure
 * @param {Object} saveData - The save data to validate
 * @returns {Object} {valid: boolean, error: string}
 */
function validateSaveData(saveData) {
    if (!saveData) {
        return { valid: false, error: "No save data provided" };
    }

    if (!saveData.version) {
        return { valid: false, error: "Invalid save file: missing version" };
    }

    if (!saveData.story || !saveData.story.id || !saveData.story.folder) {
        return { valid: false, error: "Invalid save file: missing story information" };
    }

    if (!saveData.player || !saveData.player.name) {
        return { valid: false, error: "Invalid save file: missing player information" };
    }

    if (!saveData.inventory) {
        return { valid: false, error: "Invalid save file: missing inventory data" };
    }

    if (!saveData.progress) {
        return { valid: false, error: "Invalid save file: missing progress data" };
    }

    return { valid: true, error: null };
}

/**
 * Load game state from save data
 * @param {Object} saveData - The save data to load
 * @returns {Promise<boolean>} Success status
 */
export async function loadGameFromSave(saveData) {
    const validation = validateSaveData(saveData);
    if (!validation.valid) {
        alert(`Failed to load save: ${validation.error}`);
        return false;
    }

    try {
        // Import required modules
        const { inventory, addItem, setMoney, addLoot, restoreInventory } = await import('./inventory.js');
        const { updateCharacterUI, updateStoryUI } = await import('./ui.js');
        const { updateSecondaryStats, syncManaProperties } = await import('./character.js');
        const { historyLog, updateHistoryPanel, restoreHistoryLog } = await import('./history.js');
        const { loadItems } = await import('./items.js');
        const { loadLoot } = await import('./loot.js');
        const { loadStatuses } = await import('./status.js');
        const { loadAbilities } = await import('./abilities.js');
        const { loadNpcs } = await import('./npcs.js');

        // Set global story reference
        window.selectedStory = saveData.story;
        
        // Find and load the character module based on saved player name
        const storyFolder = saveData.story.folder.replace('./', '');
        const manifestUrl = `../story-content/${storyFolder}/characters/_characters.json?v=${Date.now()}`;
        
        let characters;
        try {
            characters = await fetch(manifestUrl).then(r => {
                if (!r.ok) {
                    throw new Error(`Failed to fetch characters manifest: ${r.status} ${r.statusText}`);
                }
                return r.json();
            });
        } catch (error) {
            console.error("Error loading character manifest:", error);
            alert(`Failed to load character data for story "${saveData.story.name}". Please check if the story files exist.`);
            return false;
        }
        
        const characterData = characters.find(char => char.name === saveData.player.name);
        if (!characterData) {
            alert(`Character "${saveData.player.name}" not found in story "${saveData.story.name}"`);
            return false;
        }

        // Load character module
        const charPath = `../story-content/${storyFolder}/characters/${characterData.file.replace('./', '')}?v=${Date.now()}`;
        const characterModule = await import(charPath);
        
        // Set up player
        window.player = { ...characterModule.player };
        window.selectedCharacterModule = characterModule;
        window.applyAttributes = characterModule.applyAttributes;

        // Restore player state - preserve the original id if save data doesn't have one
        const originalId = window.player.id;
        Object.assign(window.player, saveData.player);
        
        // Ensure id is preserved
        if (!window.player.id && originalId) {
            window.player.id = originalId;
        }
        
        // Ensure equipment object exists
        if (!window.player.equipment) {
            window.player.equipment = {};
        }

        // Load game assets
        await loadItems(storyFolder);
        await loadLoot(storyFolder);
        
        // Load statuses with proper manifest
        try {
            const statusManifest = await fetch(`../story-content/${storyFolder}/statuses/_status.json?v=${Date.now()}`).then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch status manifest: ${res.status} ${res.statusText}`);
                }
                return res.json();
            });
            await loadStatuses(statusManifest, `../story-content/${storyFolder}/statuses/`);
        } catch (error) {
            console.error("Error loading statuses:", error);
            alert(`Failed to load status data: ${error.message}`);
            return false;
        }
        
        // Load abilities with proper manifest  
        try {
            const abilityManifest = await fetch(`../story-content/${storyFolder}/abilities/_abilities.json?v=${Date.now()}`).then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch ability manifest: ${res.status} ${res.statusText}`);
                }
                return res.json();
            });
            await loadAbilities(abilityManifest, `../story-content/${storyFolder}/abilities/`);
        } catch (error) {
            console.error("Error loading abilities:", error);
            alert(`Failed to load ability data: ${error.message}`);
            return false;
        }
        
        await loadNpcs(storyFolder);

        // Load story data - need to get the correct story file from _stories.json
        try {
            // First, load the stories manifest to get the correct story file path
            const storiesManifest = await fetch(`../story-content/_stories.json?v=${Date.now()}`).then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch stories manifest: ${res.status} ${res.statusText}`);
                }
                return res.json();
            });
            
            // Find the story by name to get the correct file path
            const storyInfo = storiesManifest.find(s => s.name === saveData.story.name);
            if (!storyInfo) {
                throw new Error(`Story "${saveData.story.name}" not found in stories manifest`);
            }
            
            // Load the actual story data file
            const storyFile = `../story-content/${storyInfo.file.replace('./', '')}`;
            const storyResponse = await fetch(storyFile + `?v=${Date.now()}`);
            if (!storyResponse.ok) {
                throw new Error(`Failed to fetch story data: ${storyResponse.status} ${storyResponse.statusText}`);
            }
            window.storyData = await storyResponse.json();
        } catch (error) {
            console.error("Error loading story data:", error);
            alert(`Failed to load story data: ${error.message}`);
            return false;
        }

        // Restore inventory using the proper function
        restoreInventory(saveData.inventory);

        // Restore progress and story state
        window.currentNode = saveData.progress.currentNode;
        window.playerPath = [...saveData.progress.playerPath];
        window.visitedNodes = [...(saveData.progress.visitedNodes || [])];

        // Restore game state
        window.battleJustHappened = saveData.gameState.battleJustHappened;
        restoreHistoryLog(saveData.gameState.historyLog);

        // Import story module and restore all state
        const storyModule = await import('./story.js');
        
        // Set the player in the story module
        storyModule.setPlayer(window.player);
        
        // Restore all story state variables
        storyModule.restoreStoryState(saveData, characterModule);

        // Sync character state after everything is loaded
        syncManaProperties(window.player);
        updateSecondaryStats(window.player);

        updateSecondaryStats(window.player);

        // Update UI - Story layout character name only (old elements removed)
        const characterNameStory = document.getElementById("current-character-name-story");
        if (characterNameStory) {
            characterNameStory.textContent = window.player.name;
        }
        
        document.getElementById("status-abilities").style.display = "block";
        document.getElementById("history-toggle-btn").style.display = "";
        
        updateCharacterUI();
        updateStoryUI();
        updateHistoryPanel();

        // Hide selection screens and show game
        document.getElementById("story-selection").style.display = "none";
        document.getElementById("character-selection").style.display = "none";
        document.getElementById("game-mode-selection").style.display = "none";
        document.querySelector(".story-container").style.display = "";

        // Show current node
        storyModule.showNode(window.currentNode);

        return true;

    } catch (error) {
        console.error("Error loading save:", error);
        alert(`Failed to load save file: ${error.message}`);
        return false;
    }
}

/**
 * Handle file upload for loading saves
 * @param {File} file - The uploaded save file
 */
export async function handleSaveFileUpload(file) {
    if (!file) {
        alert("No file selected");
        return;
    }

    if (!file.name.endsWith('.json')) {
        alert("Please select a valid save file (.json)");
        return;
    }

    try {
        const fileContent = await file.text();
        const saveData = JSON.parse(fileContent);
        
        const success = await loadGameFromSave(saveData);
        if (success) {
            const notification = document.createElement('div');
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #17a2b8; color: white; padding: 15px; border-radius: 5px; z-index: 10000; font-family: Arial, sans-serif;';
            notification.innerHTML = `
                <strong>Game Loaded!</strong><br>
                <small>Character: ${saveData.player.name}</small><br>
                <small>Story: ${saveData.story.name}</small>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        }
    } catch (error) {
        console.error("Error reading save file:", error);
        alert("Invalid save file format");
    }
}

/**
 * Create and show the save button in game
 */
export function addSaveButton() {
    // Check if save button already exists
    if (document.getElementById('save-game-btn')) {
        return;
    }

    const saveBtn = document.createElement('button');
    saveBtn.id = 'save-game-btn';
    saveBtn.textContent = 'Save Game';
    saveBtn.style.cssText = 'margin-left: 10px; background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;';
    saveBtn.style.cssText = 'background: #007bff; color: white; border: none; padding: 8px 14px; border-radius: 5px; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: background-color 0.2s ease;';
    saveBtn.onclick = downloadSave;

    // Add to save button area in character info section
    const saveButtonArea = document.getElementById('save-button-area');
    if (saveButtonArea) {
        saveButtonArea.appendChild(saveBtn);
    }
}
