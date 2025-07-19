export const item = {
    name: "Scroll of Precision Strike",
    type: "consumable",
    description: null, // Will be generated dynamically
    value: 20,
    rarity: "uncommon",
    
    get description() {
        return window.abilities?.getAbilityDescription?.('precisionStrike') || 
               "A scroll containing techniques for precise, critical strikes.";
    },
    
    use(user) {
        if (window.abilities && window.abilities.learnAbility) {
            return window.abilities.learnAbility(user, 'precisionStrike');
        }
        return { success: false, message: "Cannot learn ability at this time." };
    }
};
