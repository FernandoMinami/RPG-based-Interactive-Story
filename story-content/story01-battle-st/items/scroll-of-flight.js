export const item = {
  id: "scroll-of-flight",
  name: "Scroll of Flight",
  get description() {
    // Dynamic description based on whether player knows the ability
    const player = window.player;
    if (player && player.abilityIds && player.abilityIds.includes("fly")) {
      return "A magical scroll that teaches the Fly ability. Already learnt.";
    }
    return "A magical scroll that teaches the Fly ability. Single use.";
  },
  type: "consumable",
  abilityToLearn: "fly",

  use(player) {
    const { learnAbility } = window.abilities || {};
    if (learnAbility) {
      return learnAbility(player, this.abilityToLearn, "Fly");
    } else {
      console.error("Ability learning system not available");
      return false;
    }
  }
};
