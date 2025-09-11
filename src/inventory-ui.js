/**
 * Inventory UI - Handles inventory modal and related UI interactions
 */

import { getInventoryState, addItem, removeItem, hasItem, addLoot, removeLoot, hasLoot, getMoney, addMoney, removeMoney } from './inventory.js';
import { getEquipmentCategories, findAvailableSlot, isSlotOccupied, getEquippedItem, findEquippedItemSlot, getEquippedItemsByType } from './equipment-utils.js';

/**
 * Rebuild the inventory modal content
 */
export function rebuildInventoryModal() {
    const modal = document.getElementById("inventory-modal");
    if (!modal) return;

    // Find the content div (the empty div after modal-header)
    const modalContent = modal.querySelector('.modal-content');
    const contentDiv = modalContent ? modalContent.children[2] : null; // Third child after close button and header
    if (!contentDiv) return;

    // Import items data and rebuild - fix the data source issue
    import('./items.js').then(({ items }) => {
        import('./loot.js').then(({ getLootById }) => {
            const inventoryState = getInventoryState();
            const { items: inventory, loot: lootInventory, money } = inventoryState;


            // Check specific items to understand categorization
            Object.keys(inventory).forEach(itemId => {
                const item = items[itemId];
                if (item) {
                }
            });

            let content = `
                    <div style="margin-bottom: 15px;">
                        <strong>Money: ${money} gold</strong>
                    </div>
            `;

            // Group items by category like the working merchant system
            const categories = {
                loot: { name: "Monster Parts", items: {} },
                consumables: { name: "Consumables", items: {} },
                
                
                quest: { name: "Quest Items", items: {} },
                other: { name: "Other", items: {} }
            };

            // Add dynamic equipment categories based on character body parts
            if (window.player && Array.isArray(window.player.equipment)) {
                const equipmentSlots = getEquipmentCategories(window.player);
                equipmentSlots.forEach(slot => {
                    // Create a user-friendly name for the category
                    const categoryName = slot.charAt(0).toUpperCase() + slot.slice(1) + " Equipment";
                    categories[slot] = { name: categoryName, items: {} };
                });
            } else {
            }


            // Add loot items to monster parts category first
            Object.keys(lootInventory).forEach(lootId => {
                const lootItem = getLootById(lootId);
                if (!lootItem) return;

                categories.loot.items[lootId] = {
                    ...lootItem,
                    count: lootInventory[lootId],
                    isLoot: true
                };
            });

            // Categorize inventory items using the same logic as merchant system
            Object.keys(inventory).forEach(itemId => {
                const item = items[itemId];
                if (!item) return;

                let category = "other";
                if (item.type === "consumable") {
                    category = "consumables";
                } else if ((item.type === "armor" || item.type === "equipable") && (item.category || item.slot)) {
                    // Use the category or slot for equipment
                    const itemSlot = item.category || item.slot;
                    
                    // Check if this slot exists in our categories (dynamic equipment slots)
                    if (categories[itemSlot]) {
                        category = itemSlot;
                    } else {
                        // Try to map to available slots if exact match not found
                        const availableSlots = Object.keys(categories);
                        const matchingSlot = availableSlots.find(slot => 
                            slot.toLowerCase().includes(itemSlot.toLowerCase()) ||
                            itemSlot.toLowerCase().includes(slot.toLowerCase())
                        );
                        
                        if (matchingSlot) {
                            category = matchingSlot;
                        } else {
                            // Special handling for old 'hand' and 'weapon' slots
                            if (itemSlot === 'hand' && (categories['hand1'] || categories['hand2'])) {
                                category = categories['hand1'] ? 'hand1' : 'hand2';
                            } else if (itemSlot === 'weapon' && (categories['weapon1'] || categories['weapon2'])) {
                                category = categories['weapon1'] ? 'weapon1' : 'weapon2';
                            }
                        }
                    }
                } else if (item.type === "quest") {
                    category = "quest";
                } else if (item.type === "material") {
                    category = "other"; // Materials go to other for now
                }

                // Ensure category exists
                if (!categories[category]) {
                    category = "other";
                }

                categories[category].items[itemId] = {
                    ...item,
                    count: inventory[itemId]
                };
            });

            // Generate HTML for each category
            Object.keys(categories).forEach(categoryKey => {
                const category = categories[categoryKey];
                const hasItems = Object.keys(category.items).length > 0;

                content += `
                    <div class="inventory-category">
                        <div class="accordion-header" onclick="window.toggleAccordion('${categoryKey}')">
                            <span>${category.name} ${hasItems ? `(${Object.keys(category.items).length})` : '(0)'}</span>
                            <span id="arrow-${categoryKey}" class="accordion-arrow">▶</span>
                        </div>
                        <div id="content-${categoryKey}" class="accordion-content">
                `;

                if (hasItems) {
                    Object.keys(category.items).forEach(itemId => {
                        const item = category.items[itemId];
                        
                        // Check if this item is equipped (for equipment items)
                        let isEquipped = false;
                        let equippedSlotIndex = -1;
                        
                        if ((item.type === "armor" || (item.type === "equipable" && (item.slot || item.category))) && 
                            Array.isArray(window.player.equipment)) {
                            equippedSlotIndex = window.player.equipment.findIndex(slot => 
                                slot.item && (slot.item.id === itemId || slot.item === itemId)
                            );
                            isEquipped = equippedSlotIndex !== -1;
                        }
                        
                        const equippedIndicator = isEquipped ? ' <span style="color: #28a745; font-weight: bold;">(Equipped)</span>' : '';
                        
                        content += `
                            <div class="inventory-item" style="margin: 8px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${item.name}</strong>${equippedIndicator} x${item.count}
                                        ${item.description ? `<div style="font-size: 0.9em; color: #666;">${item.description}</div>` : ''}
                                        ${item.sellValue ? `<div style="font-size: 0.8em; color: #888;">Sell: ${item.sellValue} gold</div>` : ''}
                                    </div>
                                    <div>
                        `;

                        // Add action buttons based on item type
                        if (item.type === "consumable") {
                            // Consumables get USE button
                            content += `
                                <button onclick="window.handleInventoryItemAction('${itemId}', '${categoryKey}')" 
                                        style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin: 2px;">
                                    Use
                                </button>
                            `;
                        } else if (item.type === "armor" || (item.type === "equipable" && (item.slot || item.category))) {
                            // Equipment gets EQUIP/UNEQUIP button
                            const buttonText = isEquipped ? 'Unequip' : 'Equip';
                            const buttonColor = isEquipped ? '#dc3545' : '#007bff';
                            
                            content += `
                                <button onclick="window.handleInventoryItemAction('${itemId}', '${categoryKey}')" 
                                        style="background: ${buttonColor}; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin: 2px;">
                                    ${buttonText}
                                </button>
                            `;
                        }

                        content += `
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    content += `<div style="color: #888; font-style: italic;">No items in this category</div>`;
                }

                content += `
                        </div>
                    </div>
                `;
            });

            contentDiv.innerHTML = content;
        }).catch(err => {
            console.error('Error loading loot data:', err);
            // Fallback without loot data
            buildInventoryWithItemsOnly(inventory, items, money, contentDiv);
        });
    }).catch(err => {
        console.error('Error loading items data:', err);
        contentDiv.innerHTML = '<div style="color: red;">Error loading inventory data</div>';
    });
}

/**
 * Fallback function to build inventory with items only (no loot)
 */
function buildInventoryWithItemsOnly(inventory, items, money, contentDiv) {
    let content = `
            <div style="margin-bottom: 15px;">
                <strong>Money: ${money} gold</strong>
            </div>
    `;

    // Group items by category
    const categories = {
        consumables: { name: "Consumables", items: {} },
        equipment: { name: "Equipment", items: {} },
        materials: { name: "Materials", items: {} },
        quest: { name: "Quest Items", items: {} },
        other: { name: "Other", items: {} }
    };

    // Categorize inventory items
    Object.keys(inventory).forEach(itemId => {
        const item = items[itemId];
        if (!item) return;

        let category = "other";
        if (item.type === "consumable") category = "consumables";
        else if (item.type === "equipable") category = "equipment";
        else if (item.type === "material") category = "materials";
        else if (item.type === "quest") category = "quest";

        categories[category].items[itemId] = {
            ...item,
            count: inventory[itemId]
        };
    });

    // Generate HTML for each category
    Object.keys(categories).forEach(categoryKey => {
        const category = categories[categoryKey];
        const hasItems = Object.keys(category.items).length > 0;

        content += `
            <div class="inventory-category">
                <div class="accordion-header" onclick="window.toggleAccordion('${categoryKey}')">
                    <span>${category.name} ${hasItems ? `(${Object.keys(category.items).length})` : '(0)'}</span>
                    <span id="arrow-${categoryKey}" class="accordion-arrow">▶</span>
                </div>
                <div id="content-${categoryKey}" class="accordion-content">
        `;

        if (hasItems) {
            Object.keys(category.items).forEach(itemId => {
                const item = category.items[itemId];
                content += `
                    <div class="inventory-item" style="margin: 8px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${item.name}</strong> x${item.count}
                                ${item.description ? `<div style="font-size: 0.9em; color: #666;">${item.description}</div>` : ''}
                                ${item.sellValue ? `<div style="font-size: 0.8em; color: #888;">Sell: ${item.sellValue} gold</div>` : ''}
                            </div>
                            <div>
                `;

                // Add action buttons based on item type
                if (item.type === "consumable" && item.effect) {
                    content += `
                        <button onclick="window.handleInventoryItemAction('${itemId}', '${categoryKey}')" 
                                style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin: 2px;">
                            Use
                        </button>
                    `;
                } else if (item.type === "equipable" && item.slot) {
                    const isEquipped = window.player.equipment?.[item.slot] === itemId;
                    content += `
                        <button onclick="window.handleInventoryItemAction('${itemId}', '${categoryKey}')" 
                                style="background: ${isEquipped ? '#dc3545' : '#007bff'}; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin: 2px;">
                            ${isEquipped ? 'Unequip' : 'Equip'}
                        </button>
                    `;
                }

                // Add sell button for items with sell value (except quest items)
                if (item.sellValue && item.type !== "quest") {
                    content += `
                        <button onclick="window.sellInventoryItem('${itemId}', '${categoryKey}')" 
                                style="background: #ffc107; color: #212529; border: none; padding: 4px 8px; border-radius: 3px; margin: 2px;">
                            Sell (${item.sellValue}g)
                        </button>
                    `;
                }

                content += `
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            content += `<div style="color: #888; font-style: italic;">No items in this category</div>`;
        }

        content += `
                </div>
            </div>
        `;
    });

    contentDiv.innerHTML = content;
}

/**
 * Handle use/equip/unequip actions from the inventory modal
 * @param {string} itemId - ID of the item
 * @param {string} categoryKey - Category of the item
 */
export function handleInventoryItemAction(itemId, categoryKey) {
    import('./items.js').then(({ items }) => {
        const item = items[itemId];
        if (!item || !window.player) return;

        try {
            if (item.type === "consumable") {
                // Use consumable item
                if (hasItem(itemId)) {
                    // Try to use the item using its use method
                    if (typeof item.use === 'function') {
                        const consumed = item.use(window.player);
                        if (consumed) {
                            removeItem(itemId, 1);
                        }
                    } else if (item.effect) {
                        // Apply item effect
                        if (typeof item.effect === 'function') {
                            item.effect(window.player);
                        } else if (typeof item.effect === 'object') {
                            // Handle object-based effects
                            Object.keys(item.effect).forEach(stat => {
                                if (window.player[stat] !== undefined) {
                                    window.player[stat] += item.effect[stat];
                                }
                            });
                        }
                        removeItem(itemId, 1);
                    }
                    
                    // Add to history
                    if (window.historyLog) {
                        window.historyLog.push({ 
                            action: `Used ${item.name}`
                        });
                    }

                    // Update UI
                    if (window.updateCharacterUI) window.updateCharacterUI();
                    if (window.updateHistoryPanel) window.updateHistoryPanel();
                    rebuildInventoryModal();
                }
            } else if (item.type === "armor" || (item.type === "equipable" && (item.slot || item.category))) {
                // Find the best available slot for this item using the new array-based system
                const preferredSlot = item.category || item.slot;
                let targetSlotIndex = findAvailableSlot(window.player, item);
                
                if (targetSlotIndex === null) {
                    console.warn(`No available slot found for item ${itemId} (preferred: ${preferredSlot})`);
                    return;
                }
                
                // Check if this item is already equipped somewhere
                const equippedSlotIndex = window.player.equipment ? 
                    window.player.equipment.findIndex(slot => 
                        slot.item && (slot.item.id === itemId || slot.item === itemId)
                    ) : -1;
                
                if (equippedSlotIndex !== -1) {
                    // Unequip - item is currently equipped, just remove from equipment slot
                    // Item stays in inventory, just remove equipped status
                    window.player.equipment[equippedSlotIndex].item = null;
                } else {
                    // Equip - try to equip the item
                    if (hasItem(itemId)) {
                        if (!Array.isArray(window.player.equipment)) {
                            console.error('Player equipment is not an array!');
                            return;
                        }
                        
                        // Check if the target slot is occupied and handle replacement
                        if (isSlotOccupied(window.player, targetSlotIndex)) {
                            const currentEquipped = getEquippedItem(window.player, targetSlotIndex);
                            const currentId = currentEquipped.id || currentEquipped;
                            // When replacing, the old item just becomes unequipped (stays in inventory)
                        }
                        
                        // Equip the new item - item stays in inventory, just gets equipped status
                        window.player.equipment[targetSlotIndex].item = { ...item, id: itemId };
                        // DO NOT REMOVE from inventory - item should stay in inventory with "Equipped" indicator
                    }
                }
                
                // Update character stats and UI
                if (window.updateSecondaryStats) window.updateSecondaryStats(window.player, true);
                if (window.updateCharacterUI) window.updateCharacterUI();
                
                // Refresh character stats modal if it's open
                const statsModal = document.getElementById("character-stats-modal");
                
                if (statsModal && statsModal.style.display === "block") {
                    if (window.refreshCharacterStatsModal) {
                        window.refreshCharacterStatsModal();
                    } else if (window.showCharacterStatsModal) {
                        // Fallback: rebuild the entire modal
                        window.showCharacterStatsModal();
                    }
                } else {
                }
                
                rebuildInventoryModal();
            }
        } catch (error) {
            console.error(`Error handling inventory action for ${itemId}:`, error);
        }
    });
}

/**
 * Sell an item from inventory
 * @param {string} itemId - ID of the item to sell
 * @param {string} categoryKey - Category of the item
 */
export function sellInventoryItem(itemId, categoryKey) {
    import('./items.js').then(({ items }) => {
        import('./loot.js').then(({ getLootById }) => {
            const item = items[itemId] || getLootById(itemId);
            if (!item || !item.sellValue) return;

            const isLootItem = !!getLootById(itemId);
            const hasItemInInventory = isLootItem ? hasLoot(itemId) : hasItem(itemId);
            
            if (!hasItemInInventory) return;

            // Remove item and add money
            if (isLootItem) {
                removeLoot(itemId, 1);
            } else {
                removeItem(itemId, 1);
            }
            
            addMoney(item.sellValue);

            // Add to history
            if (window.historyLog) {
                window.historyLog.push({ 
                    action: `Sold ${item.name} for ${item.sellValue} gold`
                });
            }

            // Update UI
            if (window.updateHistoryPanel) window.updateHistoryPanel();
            rebuildInventoryModal();
        }).catch(err => {
            console.error('Error loading loot data for selling:', err);
        });
    });
}

/**
 * Toggle accordion sections in modals
 * @param {string} categoryKey - Category to toggle
 */
export function toggleAccordion(categoryKey) {
    const content = document.getElementById(`content-${categoryKey}`);
    const arrow = document.getElementById(`arrow-${categoryKey}`);
    const header = arrow ? arrow.parentElement : null;
    
    if (content && arrow) {
        if (content.classList.contains('active')) {
            content.classList.remove('active');
            arrow.classList.remove('active');
            if (header) header.classList.remove('active');
        } else {
            content.classList.add('active');
            arrow.classList.add('active');
            if (header) header.classList.add('active');
        }
    }
}

/**
 * Update inventory modal content without closing/reopening
 */
export function updateInventoryModal() {
    const modal = document.getElementById("inventory-modal");
    if (modal && modal.style.display !== "none") {
        rebuildInventoryModal();
    }
}

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.handleInventoryItemAction = handleInventoryItemAction;
    window.sellInventoryItem = sellInventoryItem;
    window.toggleAccordion = toggleAccordion;
    window.updateInventoryModal = updateInventoryModal;
}
