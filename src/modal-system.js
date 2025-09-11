/**
 * Modal System - Centralized modal management
 */

import { formatRaces } from './element-helpers.js';

/**
 * Initialize all modal event listeners
 */
export function initializeModalEvents() {
    // Inventory modal close button
    const closeInventoryBtn = document.getElementById("close-inventory-modal");
    if (closeInventoryBtn) {
        closeInventoryBtn.onclick = function() {
            const modal = document.getElementById("inventory-modal");
            if (modal) modal.style.display = "none";
        };
    }

    // Character stats modal close button  
    const closeStatsBtn = document.getElementById("close-character-stats-modal");
    if (closeStatsBtn) {
        closeStatsBtn.onclick = function() {
            const modal = document.getElementById("character-stats-modal");
            if (modal) modal.style.display = "none";
        };
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        const inventoryModal = document.getElementById("inventory-modal");
        const statsModal = document.getElementById("character-stats-modal");
        
        if (event.target === inventoryModal) {
            inventoryModal.style.display = "none";
        }
        if (event.target === statsModal) {
            statsModal.style.display = "none";
        }
    };

    // History panel toggle
    const historyToggleBtn = document.getElementById("history-toggle-btn");
    if (historyToggleBtn) {
        historyToggleBtn.onclick = function() {
            const panel = document.getElementById("history-panel");
            if (panel) {
                const isVisible = panel.style.display !== "none";
                panel.style.display = isVisible ? "none" : "block";
            }
        };
    }
}

/**
 * Show character stats modal
 */
export function showCharacterStatsModal() {
    refreshCharacterStatsModal();
    const modal = document.getElementById("character-stats-modal");
    if (modal) {
        modal.style.display = "block";
    }
}

/**
 * Update character stats modal content without rebuilding everything
 */
export function refreshCharacterStatsModal() {
    const modal = document.getElementById("character-stats-modal");
    if (!modal || !window.player) return;

    const player = window.player;
    
    // Calculate current stats with equipment bonuses
    const baseStats = { ...player.primary };
    const equipmentBonuses = {};
    let totalArmor = 0;
    let totalDamage = 0;

    // Calculate equipment bonuses
    if (Array.isArray(player.equipment) && window.items) {
        player.equipment.forEach(equipmentSlot => {
            if (equipmentSlot.item) {
                const item = equipmentSlot.item;
                // Handle both old (modifiers) and new (stats) item structures
                if (item.stats) {
                    Object.keys(item.stats).forEach(stat => {
                        equipmentBonuses[stat] = (equipmentBonuses[stat] || 0) + item.stats[stat];
                    });
                } else if (item.modifiers) {
                    Object.keys(item.modifiers).forEach(stat => {
                        equipmentBonuses[stat] = (equipmentBonuses[stat] || 0) + item.modifiers[stat];
                    });
                }
                if (item.armor) totalArmor += item.armor;
                if (item.damage) totalDamage += item.damage;
            }
        });
    } else if (player.equipment && window.items) {
        // Fallback for old object-based equipment system
        Object.values(player.equipment).forEach(itemId => {
            const item = window.items[itemId];
            if (item && item.stats) {
                Object.keys(item.stats).forEach(stat => {
                    equipmentBonuses[stat] = (equipmentBonuses[stat] || 0) + item.stats[stat];
                });
            }
            if (item && item.armor) totalArmor += item.armor;
            if (item && item.damage) totalDamage += item.damage;
        });
    }

    let content = `
        <div class="modal-content">
            <span class="close" id="close-character-stats-modal">&times;</span>
            <h2>${player.name} - Character Stats</h2>
            
            <div style="margin-bottom: 15px;">
                <strong>Level:</strong> ${player.level || 1}<br>
                <strong>EXP:</strong> ${player.exp || 0}<br>
                <strong>Race:</strong> ${formatRaces(player)}<br>
                <strong>Type:</strong> ${player.type ? player.misc.elementalAlignment.charAt(0).toUpperCase() + player.type.slice(1) : 'Unknown'}<br>
                <strong>Height:</strong> ${player.misc.height || 'Unknown'}<br>
                <strong>Weight:</strong> ${player.misc.weight || 'Unknown'}<br>
            </div>

            <div style="margin-bottom: 15px;">
                <h3>Vital Stats</h3>
                <strong>Life:</strong> ${player.secondary.life || 0} / ${player.maxLife || 0}<br>
                <strong>Mp:</strong> ${player.secondary.mp || 0} / ${player.maxMp || 0}<br>
                <strong>Armor:</strong> ${totalArmor}<br>
                <strong>Base Damage:</strong> ${totalDamage}<br>
            </div>

            <div style="margin-bottom: 15px;">
                <h3>Attributes</h3>
    `;

    // Display attributes with equipment bonuses
    Object.keys(baseStats).forEach(attr => {
        const base = baseStats[attr] || 0;
        const bonus = equipmentBonuses[attr] || 0;
        const total = base + bonus;
        const bonusText = bonus > 0 ? ` (+${bonus})` : bonus < 0 ? ` (${bonus})` : '';
        
        content += `<strong>${attr.charAt(0).toUpperCase() + attr.slice(1)}:</strong> ${total}${bonusText}<br>`;
    });

    content += `
            </div>

            <div style="margin-bottom: 15px;">
                <h3>Equipment</h3>
    `;

    if (Array.isArray(player.equipment)) {
        // Use new array-based equipment system
        const slotTypes = [...new Set(player.equipment.map(slot => slot.slot))];
        let hasEquipment = false;
        
        slotTypes.forEach(slotType => {
            const itemsInSlot = player.equipment.filter(slot => slot.slot === slotType && slot.item);
            
            if (itemsInSlot.length > 0) {
                hasEquipment = true;
                itemsInSlot.forEach((equipmentSlot, index) => {
                    const item = equipmentSlot.item;
                    const displayName = itemsInSlot.length > 1 ? 
                        `${slotType.charAt(0).toUpperCase() + slotType.slice(1)} ${index + 1}` : 
                        slotType.charAt(0).toUpperCase() + slotType.slice(1);
                    content += `<strong>${displayName}:</strong> ${item.name}<br>`;
                });
            }
        });
        
        if (!hasEquipment) {
            content += `<em>No equipment equipped</em>`;
        }
    } else if (player.equipment && Object.keys(player.equipment).length > 0) {
        // Fallback for old object-based equipment system
        Object.keys(player.equipment).forEach(slot => {
            const itemId = player.equipment[slot];
            const item = window.items?.[itemId];
            if (item) {
                content += `<strong>${slot.charAt(0).toUpperCase() + slot.slice(1)}:</strong> ${item.name}<br>`;
            }
        });
    } else {
        content += `<em>No equipment equipped</em>`;
    }

    content += `
            </div>

            <div style="margin-bottom: 15px;">
                <h3>Status Effects</h3>
    `;

    if (player.statusEffects && player.statusEffects.length > 0) {
        player.statusEffects.forEach(effect => {
            content += `<div>${effect.name || effect.statusTag}: ${effect.duration || 'Permanent'} turns remaining</div>`;
        });
    } else {
        content += `<em>No active status effects</em>`;
    }

    content += `
            </div>
        </div>
    `;

    modal.innerHTML = content;

    // Reattach close event
    const closeBtn = document.getElementById("close-character-stats-modal");
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = "none";
    }
}

/**
 * Show inventory modal
 */
export function showInventoryModal() {
    const modal = document.getElementById("inventory-modal");
    if (modal) {
        // Import and call rebuild function
        import('./inventory-ui.js').then(({ rebuildInventoryModal }) => {
            rebuildInventoryModal();
            modal.style.display = "block";
        });
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showCharacterStatsModal = showCharacterStatsModal;
    window.refreshCharacterStatsModal = refreshCharacterStatsModal;
    window.showInventoryModal = showInventoryModal;
}
