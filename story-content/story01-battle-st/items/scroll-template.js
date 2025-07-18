import { historyLog } from '../../../src/history.js';

/**
 * Generic scroll template for teaching abilities
 * Override the properties below to create specific scrolls
 */
export const createAbilityScroll = (config) => ({
  id: config.id,
  name: config.name,
  description: config.description || `A scroll that teaches the ${config.abilityName} ability. Single use.`,
  type: "consumable",
  abilityToLearn: config.abilityId,
  abilityName: config.abilityName,

  use(player) {
    // Check if player already knows this ability
    if (player.abilityIds && player.abilityIds.includes(this.abilityToLearn)) {
      historyLog.push({
        action: `${player.name} already knows the ${this.abilityName} ability!`
      });
      return false; // Not consumed
    }

    // Teach the ability to the player
    if (!player.abilityIds) {
      player.abilityIds = [];
    }
    
    player.abilityIds.push(this.abilityToLearn);
    
    historyLog.push({
      action: `${player.name} learned the ${this.abilityName} ability from the scroll!`
    });
    
    return true; // Consumed
  }
});

// Example usage:
// export const item = createAbilityScroll({
//   id: "scroll-of-fireball",
//   name: "Scroll of Fireball", 
//   abilityId: "fireball",
//   abilityName: "Fireball",
//   description: "A fiery scroll that teaches devastating fire magic."
// });
