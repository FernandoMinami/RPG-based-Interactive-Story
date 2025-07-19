export const item = {
    name: "Scroll of Vampiric Strike",
    type: "consumable",
    description: null, // Will be generated dynamically
    value: 30,
    rarity: "rare",
    
    get description() {
        return window.abilities?.getAbilityDescription?.('vampiricStrike') || 
               "A dark scroll teaching life-draining combat techniques.";
    },
    
    use(user) {
        if (window.abilities && window.abilities.learnAbility) {
            return window.abilities.learnAbility(user, 'vampiricStrike');
        }
        return { success: false, message: "Cannot learn ability at this time." };
    }
};
