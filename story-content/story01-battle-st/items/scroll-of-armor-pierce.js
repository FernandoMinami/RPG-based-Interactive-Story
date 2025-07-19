export const item = {
    name: "Scroll of Armor Pierce",
    type: "consumable",
    description: null, // Will be generated dynamically
    value: 25,
    rarity: "uncommon",
    
    get description() {
        return window.abilities?.getAbilityDescription?.('armorPierce') || 
               "A scroll containing knowledge of armor-piercing techniques.";
    },
    
    use(user) {
        if (window.abilities && window.abilities.learnAbility) {
            return window.abilities.learnAbility(user, 'armorPierce');
        }
        return { success: false, message: "Cannot learn ability at this time." };
    }
};
