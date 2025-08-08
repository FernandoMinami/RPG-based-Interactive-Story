export const item = {
  id: "scroll-of-ancient-wisdom",
  name: "Scroll of Ancient Wisdom",
  get description() {
    // Dynamic description based on player's intelligence and known abilities
    const player = window.player;
    if (!player) {
      return "A legendary scroll containing ancient knowledge. Teaches multiple abilities but requires high intelligence.";
    }
    
    // Check intelligence requirement
    if (player.attributes && player.attributes.intelligence < 10) {
      return "A legendary scroll containing ancient knowledge. Requires 10 Intelligence to use.";
    }
    
    // Check which abilities are already known
    const abilitiesToLearn = ["wisdomBoost", "heal", "magicMissile"];
    const alreadyKnown = abilitiesToLearn.filter(abilityId => 
      player.abilityIds && player.abilityIds.includes(abilityId)
    );
    
    if (alreadyKnown.length === abilitiesToLearn.length) {
      return "A legendary scroll containing ancient knowledge. All abilities already learnt.";
    } else if (alreadyKnown.length > 0) {
      return `A legendary scroll containing ancient knowledge. ${alreadyKnown.length}/${abilitiesToLearn.length} abilities already learnt.`;
    } else {
      return "A legendary scroll containing ancient knowledge. Teaches Wisdom Boost, Heal, and Magic Missile.";
    }
  },
  type: "consumable",
  abilitiesToLearn: ["wisdomBoost", "heal", "magicMissile"], // Multiple abilities
  requiredAttribute: "intelligence", // Required attribute
  requiredLevel: 10, // Minimum required value

  use(player) {
    // Check intelligence requirement
    if (player.attributes && player.attributes[this.requiredAttribute] < this.requiredLevel) {
      const message = `${player.name} lacks the intelligence (${this.requiredLevel} required) to comprehend this ancient scroll!`;
      if (window.historyLog) {
        window.historyLog.push({ action: message });
      }
      return false; // Not consumed
    }

    // Use the multi-ability learning function
    const { learnMultipleAbilities } = window.abilities || {};
    if (!learnMultipleAbilities) {
      console.error("Ability learning system not available");
      return false;
    }

    const result = learnMultipleAbilities(player, this.abilitiesToLearn);
    
    // Generate appropriate message
    if (result.learnedCount === 0) {
      const message = `${player.name} already knows all the abilities in this scroll!`;
      if (window.historyLog) {
        window.historyLog.push({ action: message });
      }
      return false; // Not consumed if no new abilities learned
    } else {
      let message = `${player.name} gained ancient wisdom and learned ${result.learnedCount} new abilities!`;
      if (result.alreadyKnown.length > 0) {
        message += ` (Already knew ${result.alreadyKnown.length} abilities)`;
      }
      if (window.historyLog) {
        window.historyLog.push({ action: message });
      }
      return true; // Consumed
    }
  }
};
