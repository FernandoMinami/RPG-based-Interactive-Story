/**
 * Equipment Utilities - Dynamic equipment category management
 * This module provides utilities for handling equipment categories based on character body parts
 * Updated to support array-based equipment slots with duplicate slot names
 */

/**
 * Get available equipment categories for a character based on their body parts
 * @param {Object} character - The character object
 * @returns {Array} Array of unique equipment slot names
 */
export function getEquipmentCategories(character) {
    if (!character || !Array.isArray(character.equipment)) {
        console.warn('Character has no equipment array structure, using default categories');
        return ['head', 'body', 'legs', 'foot', 'hand', 'weapon'];
    }
    
    // Get unique slot names from the equipment array
    const uniqueSlots = [...new Set(character.equipment.map(slot => slot.slot))];
    return uniqueSlots;
}

/**
 * Find an available slot index for an equipment item
 * @param {Object} character - The character object
 * @param {Object} item - The item to equip
 * @returns {number|null} Available slot index or null if none found
 */
export function findAvailableSlot(character, item) {
    if (!character || !Array.isArray(character.equipment) || !item) {
        return null;
    }
    
    // Get the item's preferred category/slot
    const preferredSlot = item.category || item.slot;
    
    if (!preferredSlot) {
        console.warn('Item has no category or slot defined:', item);
        return null;
    }
    
    // Find first available slot matching the preferred type
    const availableSlotIndex = character.equipment.findIndex(slot => 
        slot.slot === preferredSlot && slot.item === null
    );
    
    if (availableSlotIndex !== -1) {
        return availableSlotIndex;
    }
    
    // If no empty slot found, try to find any slot of the same type (for replacement)
    const anySlotIndex = character.equipment.findIndex(slot => 
        slot.slot === preferredSlot
    );
    
    return anySlotIndex !== -1 ? anySlotIndex : null;
}

/**
 * Check if all slots of a specific type are occupied
 * @param {Object} character - The character object
 * @param {string} slotType - The slot type to check (e.g., "hand", "weapon")
 * @returns {boolean} True if all slots of this type are occupied
 */
export function areAllSlotsOccupied(character, slotType) {
    if (!character || !Array.isArray(character.equipment)) {
        return false;
    }
    
    const slotsOfType = character.equipment.filter(slot => slot.slot === slotType);
    return slotsOfType.length > 0 && slotsOfType.every(slot => slot.item !== null);
}

/**
 * Check if a specific equipment slot index is occupied
 * @param {Object} character - The character object
 * @param {number} slotIndex - The slot index to check
 * @returns {boolean} True if slot is occupied
 */
export function isSlotOccupied(character, slotIndex) {
    if (!character || !Array.isArray(character.equipment) || slotIndex < 0 || slotIndex >= character.equipment.length) {
        return false;
    }
    return character.equipment[slotIndex].item !== null;
}

/**
 * Get the currently equipped item at a specific slot index
 * @param {Object} character - The character object
 * @param {number} slotIndex - The slot index to check
 * @returns {Object|null} The equipped item or null
 */
export function getEquippedItem(character, slotIndex) {
    if (!character || !Array.isArray(character.equipment) || slotIndex < 0 || slotIndex >= character.equipment.length) {
        return null;
    }
    return character.equipment[slotIndex].item;
}

/**
 * Get all equipped items of a specific slot type
 * @param {Object} character - The character object
 * @param {string} slotType - The slot type (e.g., "hand", "weapon")
 * @returns {Array} Array of equipped items of this type
 */
export function getEquippedItemsByType(character, slotType) {
    if (!character || !Array.isArray(character.equipment)) {
        return [];
    }
    
    return character.equipment
        .filter(slot => slot.slot === slotType && slot.item !== null)
        .map(slot => ({ ...slot.item, slotIndex: character.equipment.indexOf(slot) }));
}

/**
 * Find the slot index where a specific item is equipped
 * @param {Object} character - The character object
 * @param {string} itemId - The item ID to find
 * @returns {number|null} Slot index where item is equipped, or null if not found
 */
export function findEquippedItemSlot(character, itemId) {
    if (!character || !Array.isArray(character.equipment)) {
        return null;
    }
    
    const slotIndex = character.equipment.findIndex(slot => 
        slot.item && (slot.item.id === itemId || slot.item === itemId)
    );
    
    return slotIndex !== -1 ? slotIndex : null;
}
