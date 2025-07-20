/**
 * LOOT ITEM TEMPLATE
 * Template for sellable monster parts and crafting materials
 * These items cannot be used directly but can be sold for money
 */

export default {
    // === BASIC PROPERTIES ===
    name: "Monster Part Name",              // Display name of the loot
    description: "A valuable part from a defeated monster.", // Description of the loot
    type: "loot",                          // Always "loot" for sellable items
    
    // === ECONOMIC PROPERTIES ===
    value: 10,                             // Base sell value in gold/currency
    rarity: "common",                      // "common", "uncommon", "rare", "epic", "legendary"
    
    // === CLASSIFICATION ===
    category: "monster_part",              // "monster_part", "crafting_material", "trophy", "gem"
    source: "enemy01",                     // What creature this drops from
    
    // === SELL FUNCTION ===
    /**
     * Function called when item is sold
     * @param {number} quantity - How many to sell
     * @returns {number} - Total gold earned
     */
    sell(quantity = 1) {
        const totalValue = this.value * quantity;
        return totalValue;
    },
    
    // === DISPLAY PROPERTIES ===
    icon: "🦴",                           // Emoji or icon for display
    sellMessage: "You sell the monster part to the merchant." // Message shown when sold
};

/*
 * LOOT CATEGORIES:
 * 
 * MONSTER_PART:
 * - Bones, scales, claws, fangs, pelts
 * - Common drops from defeated enemies
 * - Low to medium value
 * 
 * CRAFTING_MATERIAL:
 * - Rare components for weapon/armor crafting
 * - Higher value, less common
 * 
 * TROPHY:
 * - Unique parts from boss enemies
 * - High value, very rare
 * 
 * GEM:
 * - Precious stones and crystals
 * - Very high value, extremely rare
 */
