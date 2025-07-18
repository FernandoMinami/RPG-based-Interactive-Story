export const item = {
  id: "scroll-of-magic-missile",
  name: "Scroll of Magic Missile",
  get description() {
    // Dynamic description based on whether player knows the ability
    const player = window.player;
    if (player && player.abilityIds && player.abilityIds.includes("magicMissile")) {
      return "An arcane scroll that teaches the Magic Missile ability. Already learnt.";
    }
    return "An arcane scroll that teaches the Magic Missile ability. Single use.";
  },
  type: "consumable",
  abilityToLearn: "magicMissile",

  use(player) {
    // Import the learning function
    const { learnAbility } = window.abilities || {};
    if (learnAbility) {
      return learnAbility(player, this.abilityToLearn, "Magic Missile");
    } else {
      console.error("Ability learning system not available");
      return false;
    }
  }
};