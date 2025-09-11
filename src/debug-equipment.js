/**
 * Debug functions for testing the dynamic equipment system
 */

// Add some test items to inventory for testing
window.debugAddTestItems = function() {
    if (typeof window.addItem === 'function') {
        // Add some test items
        window.addItem('metal-armor', 1);
        window.addItem('metal-helmet', 1);
        window.addItem('leather-gloves', 1);
        window.addItem('potion', 3);
        
        
        // Rebuild inventory modal to see changes
        if (typeof window.rebuildInventoryModal === 'function') {
            window.rebuildInventoryModal();
        }
    } else {
        console.error('addItem function not available');
    }
};

// Test equipment bonuses specifically
window.debugTestEquipmentBonuses = function() {
    if (!window.player) {
        console.error('No player found');
        return;
    }
    
    if (Array.isArray(window.player.equipment)) {
        window.player.equipment.forEach((slot, index) => {
            if (slot.item) {
                const equipStats = slot.item.modifiers || slot.item.stats;
                if (equipStats) {
                } else {
                }
            }
        });
        
        // Test the bonus application function directly
        if (typeof window.applyAllEquipmentBonuses === 'function') {
            window.applyAllEquipmentBonuses(window.player);
        }
        
        // Update character stats to see if bonuses are applied
        if (typeof window.updateSecondaryStats === 'function') {
            window.updateSecondaryStats(window.player, true);
        }
        
    }
};

// Debug function to check player equipment structure
window.debugCheckPlayerStructure = function() {
    if (window.player) {
        
        if (Array.isArray(window.player.equipment)) {
            window.player.equipment.forEach((slot, index) => {
            });
            
            // Test equipment utilities
            if (typeof window.getEquipmentCategories === 'function') {
                const categories = window.getEquipmentCategories(window.player);
            }
            
            // Show equipped items by type
            if (typeof window.getEquippedItemsByType === 'function') {
                categories.forEach(slotType => {
                    const equippedItems = window.getEquippedItemsByType(window.player, slotType);
                    if (equippedItems.length > 0) {
                    }
                });
            }
        } else {
            console.error('Player equipment is not an array!');
        }
    } else {
        console.error('No player object found');
    }
};
