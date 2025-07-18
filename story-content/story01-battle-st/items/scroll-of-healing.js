export const item = {
  id: "scroll-of-healing",
  name: "Scroll of Healing",
  get description() {
    // Dynamic description based on whether player knows the ability
    const player = window.player;
    if (player && player.abilityIds && player.abilityIds.includes("heal")) {
      return "A sacred scroll that teaches the Heal ability. Already learnt.";
    }
    return "A sacred scroll that teaches the Heal ability. Single use.";
  },
  type: "consumable",
  abilityToLearn: "heal",

  use(player) {
    const { learnAbility } = window.abilities || {};
    if (learnAbility) {
      return learnAbility(player, this.abilityToLearn, "Heal");
    } else {
      console.error("Ability learning system not available");
      return false;
    }
  }
};
