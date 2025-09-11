/**
 * Abilities UI - Handles ability button creation and buff management
 */

/**
 * Flag to prevent multiple simultaneous button creation calls
 */
let creatingStoryButtons = false;

/**
 * Create story ability buttons in the new layout
 */
export function createStoryAbilityButtons() {
    if (creatingStoryButtons) return;
    creatingStoryButtons = true;

    try {
        const container = document.getElementById("story-ability-buttons");
        const sidebarContainer = document.getElementById("ability-btns-story");
        if ((!container && !sidebarContainer) || !window.player) return;

        // Clear both containers
        if (container) container.innerHTML = "";
        if (sidebarContainer) sidebarContainer.innerHTML = "";

        // Get player abilities using the ability system
        const playerAbilities = window.getAbilities ? window.getAbilities(window.player.abilityIds || []) : {};

        for (const [key, ability] of Object.entries(playerAbilities)) {
            if (ability.type !== "buff" && ability.type !== "heal") continue;

            const createButton = () => {
                const btn = document.createElement("button");
                btn.textContent = (ability.name || key) + (ability.mpCost ? ` (MP: ${ability.mpCost})` : "");
                btn.style.cssText = `
                    margin: 2px;
                    padding: 6px 10px;
                    border: none;
                    border-radius: 4px;
                    background: #007bff;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                    width: 100%;
                `;

                // Check if buff is already active
                let buffActive = false;
                if (ability.type === "buff") {
                    // Check using statusToApply (for most abilities)
                    if (ability.statusToApply && window.isStatusActive) {
                        buffActive = window.isStatusActive(window.player, ability.statusToApply);
                    }
                    // Fallback check using statusTag
                    else if (ability.statusTag && window.player.statusEffects) {
                        buffActive = window.player.statusEffects.some(effect => effect.statusTag === ability.statusTag);
                    }
                }

                btn.disabled = window.player.secondary.mp < (ability.mpCost || 0) || buffActive;
                if (btn.disabled) {
                    btn.style.opacity = "0.5";
                    btn.style.cursor = "not-allowed";
                    btn.style.background = "#6c757d";
                }

                btn.onclick = function() {
                    if (btn.disabled) return;

                    // Deduct MP cost
                    window.player.secondary.mp -= ability.mpCost || 0;

                    try {
                        // Check if ability has a custom apply function (new ability system)
                        if (typeof ability.apply === 'function') {
                            // For self-buffs, both caster and target are the player
                            const addLog = (message) => {
                                if (window.historyLog) {
                                    window.historyLog.push({
                                        action: `Used ${ability.name}`,
                                        effect: message
                                    });
                                }
                            };
                            ability.apply(window.player, window.player, addLog);
                        } 
                        // Handle statusToApply format (most common for buffs)
                        else if (ability.statusToApply && ability.statusChance) {
                            const addLog = (message) => {
                                if (window.historyLog) {
                                    window.historyLog.push({
                                        action: `Used ${ability.name}`,
                                        effect: message
                                    });
                                }
                            };
                            
                            if (Math.random() < ability.statusChance) {
                                const statusTarget = ability.targetType === 'self' ? window.player : window.player;
                                if (window.addStatus) {
                                    // Use nullish coalescing to properly handle 0 values
                                    const duration = ability.statusDuration ?? 3;
                                    window.addStatus(statusTarget, ability.statusToApply, duration, window.player, addLog);
                                }
                            }
                        }
                        // Handle heal abilities
                        else if (ability.type === "heal" && ability.heal) {
                            const healAmount = ability.heal;
                            window.player.secondary.life = Math.min(window.player.maxLife, window.player.secondary.life + healAmount);
                            
                            if (window.historyLog) {
                                window.historyLog.push({
                                    action: `Used ${ability.name}`,
                                    effect: `Healed ${healAmount} life`
                                });
                            }
                        }

                        // Update UI after ability use
                        if (window.updateCharacterUI) window.updateCharacterUI();
                        if (window.updateStoryUI) window.updateStoryUI();
                        if (window.updateDiceChoiceTexts) window.updateDiceChoiceTexts();

                        // Refresh ability buttons after short delay
                        setTimeout(() => {
                            createStoryAbilityButtons();
                            if (window.createAbilityButtons) window.createAbilityButtons();
                        }, 1000);

                    } catch (error) {
                        console.error(`Error using ability ${ability.name}:`, error);
                        // Refund MP on error
                        window.player.secondary.mp += ability.mpCost || 0;
                        if (window.updateCharacterUI) window.updateCharacterUI();
                    }
                };

                return btn;
            };

            // Add to main content container
            if (container) {
                container.appendChild(createButton());
            }
            
            // Add to sidebar container
            if (sidebarContainer) {
                sidebarContainer.appendChild(createButton());
            }
        }
    } finally {
        creatingStoryButtons = false;
    }
}

/**
 * Sync buffs to new layout (called from old ability system)
 */
export function syncBuffsToNewLayout() {
    if (window.player && window.player.statusEffects) {
        updateBuffsDisplay();
        createStoryAbilityButtons();
    }
}

/**
 * Update buffs display in the story layout
 */
export function updateBuffsDisplay() {
    const buffsContainer = document.getElementById("story-buffs-container");
    if (!buffsContainer || !window.player) return;

    const activeBuffs = window.player.statusEffects || [];
    
    if (activeBuffs.length === 0) {
        buffsContainer.style.display = "none";
        return;
    }

    buffsContainer.style.display = "block";
    
    let buffsHtml = '<div style="margin-bottom: 10px;"><strong>Active Effects:</strong></div>';
    
    activeBuffs.forEach(effect => {
        const name = effect.name || effect.statusTag || 'Unknown Effect';
        const duration = effect.duration ? `${effect.duration} turns` : 'Permanent';
        
        buffsHtml += `
            <div style="
                background: rgba(0,123,255,0.1);
                border: 1px solid #007bff;
                border-radius: 4px;
                padding: 4px 8px;
                margin: 2px 0;
                font-size: 12px;
                color: #007bff;
            ">
                ${name} (${duration})
            </div>
        `;
    });
    
    buffsContainer.innerHTML = buffsHtml;
}

/**
 * Setup story content area buffs section
 */
export function setupBuffsSection() {
    const storyContent = document.getElementById("story-content-area");
    if (!storyContent) return;

    // Find or create buffs container
    let buffsContainer = document.getElementById("story-buffs-container");
    if (!buffsContainer) {
        buffsContainer = document.createElement("div");
        buffsContainer.id = "story-buffs-container";
        buffsContainer.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
            background: rgba(240,248,255,0.8);
            border: 1px solid #b3d9ff;
            display: none;
        `;
        
        // Insert before story title if it exists, otherwise at the beginning
        const storyTitle = document.getElementById("story-title-story");
        if (storyTitle) {
            storyContent.insertBefore(buffsContainer, storyTitle);
        } else {
            storyContent.insertBefore(buffsContainer, storyContent.firstChild);
        }
    }

    // Find or create ability buttons container
    let abilityContainer = document.getElementById("story-ability-buttons");
    if (!abilityContainer) {
        abilityContainer = document.createElement("div");
        abilityContainer.id = "story-ability-buttons";
        abilityContainer.style.cssText = `
            margin-bottom: 15px;
            padding: 8px;
            border-radius: 6px;
            background: rgba(248,249,250,0.8);
            border: 1px solid #dee2e6;
        `;
        
        // Insert after buffs container
        storyContent.insertBefore(abilityContainer, buffsContainer.nextSibling);
    }

    updateBuffsDisplay();
    createStoryAbilityButtons();
}

/**
 * Update dice choice button texts to reflect current attribute values
 */
export function updateDiceChoiceTexts() {
    if (!window.player) return;

    const diceButtons = document.querySelectorAll('button[data-dice-choice="true"]');
    
    diceButtons.forEach(btn => {
        const attribute = btn.getAttribute('data-dice-attribute');
        const baseText = btn.getAttribute('data-choice-base-text');
        
        if (attribute && baseText && window.player.primary[attribute] !== undefined) {
            const attributeValue = window.player.primary[attribute] || 0;
            const attributeDisplayName = attribute.charAt(0).toUpperCase() + attribute.slice(1);
            btn.textContent = `${baseText} 🎲 (${attributeDisplayName}: ${attributeValue})`;
        }
    });
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.createStoryAbilityButtons = createStoryAbilityButtons;
    window.syncBuffsToNewLayout = syncBuffsToNewLayout;
    window.updateDiceChoiceTexts = updateDiceChoiceTexts;
}
